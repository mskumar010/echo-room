import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
	origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
	credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO setup
const io = new Server(httpServer, {
	cors: corsOptions,
	transports: ['websocket', 'polling'],
});

// Health check endpoint
app.get('/health', (_req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
	console.log(`Client connected: ${socket.id}`);

	// Handle authentication
	socket.on('auth:identify', (data) => {
		// TODO: Verify JWT token
		console.log('Auth attempt:', data);
		socket.emit('auth:ok', { userId: 'temp-user-id' });
	});

	// Handle room joining
	socket.on('room:join', (data) => {
		const { roomId } = data;
		socket.join(roomId);
		console.log(`Socket ${socket.id} joined room: ${roomId}`);
		socket.emit('room:joined', { roomId });
	});

	// Handle room leaving
	socket.on('room:leave', (data) => {
		const { roomId } = data;
		socket.leave(roomId);
		console.log(`Socket ${socket.id} left room: ${roomId}`);
		socket.emit('room:left', { roomId });
	});

	// Handle message sending
	socket.on('message:send', (data) => {
		const { roomId, text, tempId } = data;
		console.log(`Message in room ${roomId}: ${text}`);

		// Broadcast to room
		io.to(roomId).emit('message:new', {
			message: {
				id: tempId || `msg-${Date.now()}`,
				roomId,
				text,
				sender: {
					id: 'temp-user-id',
					displayName: 'User',
				},
				createdAt: new Date().toISOString(),
			},
			seq: Date.now(),
		});

		// Acknowledge to sender
		socket.emit('message:ack', {
			tempId,
			realId: `msg-${Date.now()}`,
		});
	});

	// Handle typing indicators
	socket.on('typing:start', (data) => {
		const { roomId } = data;
		socket.to(roomId).emit('typing:update', {
			roomId,
			userId: socket.id,
			isTyping: true,
		});
	});

	socket.on('typing:stop', (data) => {
		const { roomId } = data;
		socket.to(roomId).emit('typing:update', {
			roomId,
			userId: socket.id,
			isTyping: false,
		});
	});

	// Handle disconnection
	socket.on('disconnect', () => {
		console.log(`Client disconnected: ${socket.id}`);
	});
});

// Start server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`📡 Socket.IO ready`);
	console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

