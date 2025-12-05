import { Router } from 'express';
import { Message } from '../models/Message';
import { Room } from '../models/Room';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router({ mergeParams: true });

// Get messages for a room
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
	try {
		const roomIdOrSlug = (req.params as { roomId: string }).roomId;
		const limit = parseInt(req.query.limit as string) || 50;
		const before = req.query.before as string; // Message ID or seq to fetch before

		// Find room first to get the correct _id
		const room = await Room.findOne({
			$or: [{ _id: roomIdOrSlug.match(/^[0-9a-fA-F]{24}$/) ? roomIdOrSlug : null }, { slug: roomIdOrSlug }],
		});

		if (!room) {
			throw new AppError('Room not found', 404);
		}

		const roomId = room._id;

		let query: any = { roomId };

		// If before is provided, fetch messages before that seq
		if (before) {
			const beforeMessage = await Message.findOne({
				_id: before,
				roomId,
			});
			if (beforeMessage) {
				query.seq = { $lt: beforeMessage.seq };
			}
		}

		const messages = await Message.find(query)
			.populate('senderId', 'displayName avatarUrl')
			.sort({ seq: -1 })
			.limit(limit)
			.lean();

		// Reverse to get chronological order
		messages.reverse();

		res.json(
			messages.map((msg) => {
				const sender = msg.senderId as any;
				return {
					_id: msg._id.toString(),
					roomId: msg.roomId.toString(),
					senderId: typeof sender === 'object' && sender._id ? sender._id.toString() : sender.toString(),
					text: msg.text,
					seq: msg.seq,
					isSystemMessage: msg.isSystemMessage,
					parentId: msg.parentId ? msg.parentId.toString() : undefined,
					replyCount: msg.replyCount,
					createdAt: msg.createdAt.toISOString(),
					sender: {
						id: typeof sender === 'object' && sender._id ? sender._id.toString() : sender.toString(),
						displayName: typeof sender === 'object' && sender.displayName ? sender.displayName : 'Unknown',
						avatarUrl: typeof sender === 'object' && sender.avatarUrl ? sender.avatarUrl : undefined,
					},
				};
			})
		);
	} catch (error) {
		next(error);
	}
});

export default router;

