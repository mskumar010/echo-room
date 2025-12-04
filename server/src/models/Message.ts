import mongoose, { Schema } from 'mongoose';

export interface IMessage {
	_id: string;
	roomId: string; // Room ID
	senderId: string; // User ID
	text: string;
	seq: number; // Sequential number for recovery
	isSystemMessage?: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
	{
		roomId: {
			type: Schema.Types.ObjectId,
			ref: 'Room',
			required: true,
			index: true,
		} as any,
		senderId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		} as any,
		text: {
			type: String,
			required: true,
			trim: true,
		},
		seq: {
			type: Number,
			required: true,
			index: true,
		},
		isSystemMessage: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

// Compound index for efficient queries
messageSchema.index({ roomId: 1, seq: 1 });
messageSchema.index({ roomId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);

