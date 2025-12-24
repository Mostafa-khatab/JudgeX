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
		origin: [process.env.CLIENT_URL || 'http://localhost:5173', process.env.ADMIN_URL || 'http://localhost:5174'],
		credentials: true,
	},
});

connectDB();

app.use(express.static(path.join(path.resolve(), 'uploads')));

app.use(
	express.urlencoded({
		extended: true,
	}),
);

app.use(
	cors({
		origin: [process.env.CLIENT_URL || 'http://localhost:5173', process.env.ADMIN_URL || 'http://localhost:5174'],
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
