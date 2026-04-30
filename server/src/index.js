import 'dotenv/config';

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import connectDB from './config/db.js';
import route from './routes/index.js';

import { delayMiddleware } from './middlewares/delayMiddlewares.js';
import { socketAuthMiddleware } from './middlewares/socketAuth.js';
import { globalErrorHandler, notFoundHandler } from './middlewares/errorHandler.js';

import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: process.env.CLIENT_URL || true,
		credentials: true,
	},
	transports: ['websocket', 'polling'],
	pingTimeout: 60000,
	pingInterval: 25000,
});

// Export io for use in controllers
export { io };

connectDB();

// ============ CLEANUP CONFIGURATION ============
// Auto-cleanup abandoned interview sessions every 30 minutes
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

setInterval(async () => {
	try {
		const Interview = (await import('./models/interview.js')).default;
		
		// Find active interviews with no connected participants
		const interviews = await Interview.find({ status: 'active' }).select('_id candidate instructor startedAt');
		
		for (const interview of interviews) {
			// Check if interview has been running for too long without activity
			const elapsed = Date.now() - new Date(interview.startedAt).getTime();
			
			if (elapsed > SESSION_TIMEOUT) {
				// Auto-end abandoned sessions
				await Interview.findByIdAndUpdate(interview._id, {
					status: 'finished',
					endedAt: new Date()
				});
				
				// Notify connected participants
				io.to(`interview:${interview._id}`).emit('interview-auto-ended', {
					reason: 'Session timeout due to inactivity',
					timestamp: new Date()
				});
				
				// Disconnect all sockets
				io.to(`interview:${interview._id}`).disconnectSockets();
				
				console.log(`[CLEANUP] Auto-ended abandoned interview: ${interview._id}`);
			}
		}
	} catch (err) {
		console.error('Error during interview cleanup:', err);
	}
}, CLEANUP_INTERVAL);

app.use(
	cors({
		origin: (origin, callback) => {
			const allowed = process.env.CLIENT_URL;
			if (!origin || !allowed || origin === allowed || origin === allowed.replace(/\/$/, '')) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		credentials: true,
	}),
);

app.use(express.static(path.join(path.resolve(), 'uploads')));

app.use(
	express.urlencoded({
		extended: true,
	}),
);

app.use(express.json());
app.use(cookieParser());

app.use(morgan('combined'));

if (process.env.NODE_ENV === 'development') {
	app.use(delayMiddleware);
}

route(app);

// 🔐 Socket.IO Authentication Middleware
io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
	console.log('A user connected:', socket.id);

	socket.on('join-room', (roomId) => {
		socket.join(roomId);
		console.log(`User ${socket.id} joined room ${roomId}`);
		socket.to(roomId).emit('user-joined', socket.id);
	});

	// Interview specific events
	socket.on('join-interview', ({ interviewId, role, name, avatar }) => {
		const room = `interview:${interviewId}`;
		socket.join(room);
		socket.interviewRoom = room;
		socket.role = role;
		console.log(`${role} ${name || socket.id} joined interview ${interviewId}`);
		socket.to(room).emit('participant-joined', { role, name, avatar, socketId: socket.id });
	});

	socket.on('leave-interview', ({ interviewId }) => {
		const room = `interview:${interviewId}`;
		socket.leave(room);
		socket.interviewRoom = null;
		socket.to(room).emit('participant-left', { socketId: socket.id });
	});

	socket.on('interview-code-update', async ({ interviewId, code, problemId, language }) => {
		const room = `interview:${interviewId}`;
		// Optional: Add DB check if high security is needed, or use a local cache
		socket.to(room).emit('code-updated', { code, problemId, language, from: socket.id });
	});

	socket.on('interview-submission', ({ interviewId, problemId, status }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('submission-made', { problemId, status, from: socket.id });
	});

	socket.on('interview-question-switch', ({ interviewId, problemId }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('question-switched', { problemId, from: socket.id });
	});

	socket.on('interview-chat-message', ({ interviewId, role, content }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('chat-message', { role, content, timestamp: new Date() });
	});

	socket.on('interview-paste-event', ({ interviewId, problemId, contentLength }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('paste-detected', { problemId, contentLength });
	});

	socket.on('interview-focus-event', ({ interviewId, type }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('focus-updated', { type, timestamp: new Date() });
	});

	socket.on('interview-status-update', ({ interviewId, status, remainingTime }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('status-updated', { status, remainingTime });
	});

	socket.on('interview-problem-update', ({ interviewId, type, problemId, problemData }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('problem-updated', { type, problemId, problemData });
	});

	// Cursor position sync
	socket.on('interview-cursor-update', ({ interviewId, role, position }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('cursor-updated', { role, position, timestamp: new Date() });
	});

	// Language change sync
	socket.on('interview-language-change', ({ interviewId, language }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('language-changed', { language, timestamp: new Date() });
	});

	// Tab switch tracking
	socket.on('interview-tab-switch', ({ interviewId }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('tab-switch-detected', { timestamp: new Date() });
	});

	// Interview ended
	socket.on('interview-ended', ({ interviewId }) => {
		const room = `interview:${interviewId}`;
		io.to(room).emit('interview-finished', { timestamp: new Date() });
	});

	// ===== WebRTC Signaling for Interview =====
	socket.on('interview-webrtc-offer', ({ interviewId, offer }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('webrtc-offer', { offer, from: socket.id });
	});

	socket.on('interview-webrtc-answer', ({ interviewId, answer }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('webrtc-answer', { answer, from: socket.id });
	});

	socket.on('interview-webrtc-ice', ({ interviewId, candidate }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('webrtc-ice', { candidate, from: socket.id });
	});

	// ===== Problem Switch with Starter Code =====
	socket.on('interview-problem-switch', async ({ interviewId, problemId, language }) => {
		const room = `interview:${interviewId}`;
		try {
			// Import dynamically to avoid circular deps
			const Problem = (await import('./models/problem.js')).default;
			const Interview = (await import('./models/interview.js')).default;
			
			const problem = await Problem.findById(problemId);
			if (!problem) return;

			const interview = await Interview.findById(interviewId);
			if (!interview || interview.status === 'finished') return;
			
			// Only interviewer can switch problems
			if (socket.role !== 'interviewer' && interview.instructor.toString() !== socket.userId?.toString()) {
				return;
			}
			
			const langMap = {
				'c': 'c',
				'cpp': 'cpp',
				'c++': 'cpp',
				'c++11': 'cpp',
				'c++14': 'cpp',
				'c++17': 'cpp',
				'c++20': 'cpp',
				'python': 'python',
				'python2': 'python',
				'python3': 'python',
				'javascript': 'javascript',
				'node': 'javascript',
				'java': 'java'
			};

			const key = langMap[language?.toLowerCase()] || 'cpp';
			const starterCode = problem.starterCode?.[key] || problem.starterCode?.['cpp'] || '// Start coding...';
			
			// Update interview state
			await Interview.findByIdAndUpdate(interviewId, {
				'state.activeProblemId': problemId,
				'state.code': starterCode,
				'state.language': language
			});
			// Broadcast to room
			io.to(room).emit('problem-switched', {
				problemId,
				problem: {
					_id: problem._id,
					name: problem.name,
					task: problem.task,
					difficulty: problem.difficulty,
					timeLimit: problem.timeLimit,
					memoryLimit: problem.memoryLimit
				},
				starterCode,
				timestamp: new Date()
			});
		} catch (err) {
			console.error('Problem switch error:', err);
		}
	});

	// ===== Selection Sync =====
	socket.on('interview-selection-update', ({ interviewId, role, selection }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('selection-updated', { role, selection });
	});

	// ===== Media State Sync (Mute/Video Toggle) =====
	socket.on('interview-media-state', ({ interviewId, mediaState }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('media-state-updated', { 
			mediaState, // { audio: boolean, video: boolean }
			from: socket.id,
			role: socket.role || 'unknown'
		});
	});

	// ===== WebRTC Reconnection Request =====
	socket.on('interview-webrtc-reconnect', async ({ interviewId }) => {
		const room = `interview:${interviewId}`;
		// Notify peer to restart ICE
		socket.to(room).emit('webrtc-reconnect-request', { 
			from: socket.id,
			timestamp: new Date()
		});
	});

	// ===== Screen Share =====
	socket.on('interview-screen-offer', ({ interviewId, offer }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('screen-offer', { offer, from: socket.id });
	});

	socket.on('interview-screen-answer', ({ interviewId, answer }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('screen-answer', { answer, from: socket.id });
	});

	socket.on('interview-screen-ice', ({ interviewId, candidate }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('screen-ice', { candidate, from: socket.id });
	});

	socket.on('interview-screen-stopped', ({ interviewId }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('screen-stopped', { from: socket.id });
	});

	// ===== Participant Presence Signaling =====
	socket.on('participant-request', ({ interviewId }) => {
		const room = `interview:${interviewId}`;
		socket.to(room).emit('participant-query', { from: socket.id });
	});

	socket.on('participant-response', (data) => {
		const room = `interview:${data.interviewId}`;
		socket.to(room).emit('participant-info', {
			role: data.role,
			name: data.name,
			avatar: data.avatar,
			socketId: socket.id
		});
	});

	// ===== Participant Leave/Rejoin =====
	socket.on('interview-rejoin', ({ interviewId, role, name }) => {
		const room = `interview:${interviewId}`;
		socket.join(room);
		socket.interviewId = interviewId;
		socket.role = role;
		socket.to(room).emit('participant-rejoined', { 
			role, 
			name, 
			socketId: socket.id 
		});
	});

	// Legacy video call events
	socket.on('offer', ({ roomId, offer }) => {
		socket.to(roomId).emit('offer', { offer, from: socket.id });
	});

	socket.on('answer', ({ roomId, answer }) => {
		socket.to(roomId).emit('answer', { answer, from: socket.id });
	});

	socket.on('ice-candidate', ({ roomId, candidate }) => {
		socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
	});

	socket.on('code-change', ({ roomId, code }) => {
		socket.to(roomId).emit('code-change', code);
	});

	socket.on('cursor-move', ({ roomId, cursor }) => {
		socket.to(roomId).emit('cursor-move', { cursor, from: socket.id });
	});

	socket.on('whiteboard-draw', ({ roomId, data }) => {
		socket.to(roomId).emit('whiteboard-draw', data);
	});

	socket.on('whiteboard-clear', ({ roomId }) => {
		socket.to(roomId).emit('whiteboard-clear');
	});

	socket.on('screen-offer', ({ roomId, offer }) => {
		socket.to(roomId).emit('screen-offer', { offer, from: socket.id });
	});

	socket.on('screen-answer', ({ roomId, answer }) => {
		socket.to(roomId).emit('screen-answer', { answer, from: socket.id });
	});

	socket.on('screen-stopped', ({ roomId }) => {
		socket.to(roomId).emit('screen-stopped');
	});

	socket.on('disconnect', () => {
		console.log('User disconnected:', socket.id);
		if (socket.interviewRoom) {
			socket.to(socket.interviewRoom).emit('participant-left', { 
				socketId: socket.id,
				role: socket.role,
				timestamp: new Date()
			});
			
			// Check if room is now empty
			const roomSockets = io.sockets.adapter.rooms.get(socket.interviewRoom);
			if (!roomSockets || roomSockets.size === 0) {
				console.log(`[CLEANUP] Interview room empty: ${socket.interviewRoom}`);
				// Room cleanup will happen via scheduled task
			}
		}
	});
});

// ✅ Global Error Handler Middleware (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server listening on port ${PORT} ${process.env.PORT ? '' : '(default)'}`));

// Export for Vercel
export default app;


