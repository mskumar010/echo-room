import type { Server } from 'socket.io';
import { Message } from '../models/Message';
import { Room } from '../models/Room';
import { User } from '../models/User';
import type { AuthenticatedSocket } from './auth';

// Track sequence numbers per room
const roomSequences = new Map<string, number>();

function getNextSeq(roomId: string): number {
	const current = roomSequences.get(roomId) || 0;
	const next = current + 1;
	roomSequences.set(roomId, next);
	return next;
}

// Initialize sequence from database on server start
export async function initializeSequences(): Promise<void> {
	const messages = await Message.find().sort({ seq: -1 });
	const sequences = new Map<string, number>();

	for (const msg of messages) {
		const roomId = msg.roomId.toString();
		if (!sequences.has(roomId)) {
			sequences.set(roomId, msg.seq);
		}
	}

	roomSequences.clear();
	for (const [roomId, seq] of sequences) {
		roomSequences.set(roomId, seq);
	}
}

export function setupSocketHandlers(io: Server): void {
	io.on('connection', (socket: AuthenticatedSocket) => {
		console.log(`Client connected: ${socket.id}`);

		// Handle authentication
		socket.on('auth:identify', async (data: { token: string }) => {
			try {
				const { verifyAccessToken } = await import('../utils/jwt');
				const payload = verifyAccessToken(data.token);
				socket.userId = payload.userId;
				socket.userEmail = payload.email;

				socket.emit('auth:ok', { userId: payload.userId });
				console.log(`Socket ${socket.id} authenticated as ${payload.userId}`);
			} catch (error) {
				socket.emit('auth:error', { message: 'Authentication failed' });
				console.error(`Socket ${socket.id} auth failed:`, error);
			}
		});

		// Handle room joining
		socket.on('room:join', async (data: { roomId: string }) => {
			if (!socket.userId) {
				socket.emit('error', { message: 'Not authenticated' });
				return;
			}

			const { roomId } = data;
			socket.join(roomId);
			console.log(`Socket ${socket.id} joined room: ${roomId}`);

			// Get room info and recent messages
			const room = await Room.findById(roomId);
			if (!room) {
				socket.emit('error', { message: 'Room not found' });
				return;
			}

			// Get recent messages
			const recentMessages = await Message.find({ roomId })
				.populate('senderId', 'displayName avatarUrl')
				.sort({ seq: -1 })
				.limit(50)
				.lean();

			recentMessages.reverse();

			socket.emit('room:joined', {
				roomId,
				messages: recentMessages.map((msg) => {
					const sender = msg.senderId as any;
					return {
						id: msg._id.toString(),
						roomId: msg.roomId.toString(),
						sender: {
							id: typeof sender === 'object' && sender._id ? sender._id.toString() : sender.toString(),
							displayName: typeof sender === 'object' && sender.displayName ? sender.displayName : 'Unknown',
							avatarUrl: typeof sender === 'object' && sender.avatarUrl ? sender.avatarUrl : undefined,
						},
						text: msg.text,
						createdAt: msg.createdAt.toISOString(),
						isSystemMessage: msg.isSystemMessage,
					};
				}),
			});
		});

		// Handle room leaving
		socket.on('room:leave', (data: { roomId: string }) => {
			const { roomId } = data;
			socket.leave(roomId);
			console.log(`Socket ${socket.id} left room: ${roomId}`);
			socket.emit('room:left', { roomId });
		});

		// Handle message sending
		socket.on('message:send', async (data: { roomId: string; text: string; tempId: string }) => {
			if (!socket.userId) {
				socket.emit('error', { message: 'Not authenticated' });
				return;
			}

			const { roomId, text, tempId } = data;

			// Validate room exists
			const room = await Room.findById(roomId);
			if (!room) {
				socket.emit('error', { message: 'Room not found' });
				return;
			}

			// Get user info
			const user = await User.findById(socket.userId);
			if (!user) {
				socket.emit('error', { message: 'User not found' });
				return;
			}

			// Create message
			const seq = getNextSeq(roomId);
			const message = new Message({
				roomId,
				senderId: socket.userId,
				text: text.trim(),
				seq,
			});

			await message.save();

			// Populate sender info
			await message.populate('senderId', 'displayName avatarUrl');

			const messageData = {
				id: message._id.toString(),
				roomId: message.roomId.toString(),
				sender: {
					id: user._id.toString(),
					displayName: user.displayName,
					avatarUrl: user.avatarUrl,
				},
				text: message.text,
				createdAt: message.createdAt.toISOString(),
				isSystemMessage: message.isSystemMessage,
			};

			// Broadcast to room
			io.to(roomId).emit('message:new', {
				message: messageData,
				seq,
			});

			// Acknowledge to sender
			socket.emit('message:ack', {
				tempId,
				realId: message._id.toString(),
			});
		});

		// Handle typing indicators
		socket.on('typing:start', (data: { roomId: string }) => {
			if (!socket.userId) return;

			const { roomId } = data;
			socket.to(roomId).emit('typing:update', {
				roomId,
				userId: socket.userId,
				isTyping: true,
			});
		});

		socket.on('typing:stop', (data: { roomId: string }) => {
			if (!socket.userId) return;

			const { roomId } = data;
			socket.to(roomId).emit('typing:update', {
				roomId,
				userId: socket.userId,
				isTyping: false,
			});
		});

		// Handle connection recovery
		socket.on('connection:recover', async (data: { roomId: string; lastSeenSeq: number }) => {
			if (!socket.userId) {
				socket.emit('error', { message: 'Not authenticated' });
				return;
			}

			const { roomId, lastSeenSeq } = data;

			// Find missed messages
			const missedMessages = await Message.find({
				roomId,
				seq: { $gt: lastSeenSeq },
			})
				.populate('senderId', 'displayName avatarUrl')
				.sort({ seq: 1 })
				.lean();

			if (missedMessages.length > 0) {
				socket.emit('connection:missed', {
					roomId,
					messages: missedMessages.map((msg) => {
						const sender = msg.senderId as any;
						return {
							id: msg._id.toString(),
							roomId: msg.roomId.toString(),
							sender: {
								id: typeof sender === 'object' && sender._id ? sender._id.toString() : sender.toString(),
								displayName: typeof sender === 'object' && sender.displayName ? sender.displayName : 'Unknown',
								avatarUrl: typeof sender === 'object' && sender.avatarUrl ? sender.avatarUrl : undefined,
							},
							text: msg.text,
							createdAt: msg.createdAt.toISOString(),
							isSystemMessage: msg.isSystemMessage,
							seq: msg.seq,
						};
					}),
					fromSeq: lastSeenSeq,
					toSeq: missedMessages[missedMessages.length - 1].seq,
				});
			}
		});

		// Handle disconnection
		socket.on('disconnect', () => {
			console.log(`Client disconnected: ${socket.id}`);
		});
	});
}

