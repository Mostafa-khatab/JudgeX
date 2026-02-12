import 'dotenv/config';

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import connectDB from './config/db.js';
import route from './routes/index.js';

import { delayMiddleware } from './middlewares/delayMiddlewares.js';

import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: (origin, callback) => {
			const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173', process.env.ADMIN_URL || 'http://localhost:5174'];
			if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		credentials: true,
	},
});

// Export io for use in controllers
export { io };

connectDB();

app.use(express.static(path.join(path.resolve(), 'uploads')));

app.use(
	express.urlencoded({
		extended: true,
	}),
);

app.use(
	cors({
		origin: (origin, callback) => {
			const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173', process.env.ADMIN_URL || 'http://localhost:5174'];
			if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		credentials: true,
	}),
);

app.use(express.json());
app.use(cookieParser());

app.use(morgan('combined'));

if (process.env.NODE_ENV === 'development') {
	app.use(delayMiddleware);
}

route(app);

io.on('connection', (socket) => {
	console.log('A user connected:', socket.id);

	socket.on('join-room', (roomId) => {
		socket.join(roomId);
		console.log(`User ${socket.id} joined room ${roomId}`);
		socket.to(roomId).emit('user-joined', socket.id);
	});

	// Interview specific events
	socket.on('join-interview', ({ interviewId, role, name }) => {
		const room = `interview:${interviewId}`;
		socket.join(room);
		console.log(`${role} ${name || socket.id} joined interview ${interviewId}`);
		socket.to(room).emit('participant-joined', { role, name, socketId: socket.id });
	});

	socket.on('leave-interview', ({ interviewId }) => {
		const room = `interview:${interviewId}`;
		socket.leave(room);
		socket.to(room).emit('participant-left', { socketId: socket.id });
	});

	socket.on('interview-code-update', ({ interviewId, code, problemId, language }) => {
		const room = `interview:${interviewId}`;
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
			
			const starterCode = problem.starterCode?.[language] || '// Start coding...';
			
			// Update interview state
			await Interview.findByIdAndUpdate(interviewId, {
				'state.activeProblemId': problemId,
				'state.code': starterCode
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
	});
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server listening on port ${PORT} ${process.env.PORT ? '' : '(default)'}`));

