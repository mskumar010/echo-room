import { Router } from 'express';
import { Room } from '../models/Room';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Get all rooms
router.get('/', authenticateToken, async (_req, res, next) => {
	try {
		const rooms = await Room.find().populate('createdBy', 'displayName').sort({ createdAt: -1 });

		res.json(
			rooms.map((room) => ({
				_id: room._id.toString(),
				name: room.name,
				slug: room.slug,
				description: room.description,
				createdBy: room.createdBy.toString(),
				createdAt: room.createdAt.toISOString(),
			}))
		);
	} catch (error) {
		next(error);
	}
});

// Get single room
router.get('/:id', authenticateToken, async (req, res, next) => {
	try {
		const room = await Room.findOne({
			$or: [{ _id: req.params.id }, { slug: req.params.id }],
		}).populate('createdBy', 'displayName');

		if (!room) {
			throw new AppError('Room not found', 404);
		}

		res.json({
			_id: room._id.toString(),
			name: room.name,
			slug: room.slug,
			description: room.description,
			createdBy: room.createdBy.toString(),
			createdAt: room.createdAt.toISOString(),
		});
	} catch (error) {
		next(error);
	}
});

// Create room
router.post('/', authenticateToken, async (req: AuthRequest, res, next) => {
	try {
		const { name, description } = req.body;

		if (!name) {
			throw new AppError('Room name is required', 400);
		}

		// Generate slug from name
		const slug = name
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, '')
			.replace(/[\s_-]+/g, '-')
			.replace(/^-+|-+$/g, '');

		// Check if slug exists
		const existingRoom = await Room.findOne({ slug });
		if (existingRoom) {
			throw new AppError('Room with this name already exists', 409);
		}

		const room = new Room({
			name,
			slug,
			description,
			createdBy: req.userId,
		});

		await room.save();

		res.status(201).json({
			_id: room._id.toString(),
			name: room.name,
			slug: room.slug,
			description: room.description,
			createdBy: room.createdBy.toString(),
			createdAt: room.createdAt.toISOString(),
		});
	} catch (error) {
		next(error);
	}
});

export default router;

