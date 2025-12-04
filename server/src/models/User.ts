import mongoose, { Schema } from 'mongoose';

export interface IUser {
	_id: string;
	email: string;
	passwordHash: string;
	displayName: string;
	avatarUrl?: string;
	hasCompletedOnboarding?: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const userSchema = new Schema<IUser>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		passwordHash: {
			type: String,
			required: true,
		},
		displayName: {
			type: String,
			required: true,
			trim: true,
		},
		avatarUrl: {
			type: String,
			trim: true,
		},
		hasCompletedOnboarding: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

export const User = mongoose.model<IUser>('User', userSchema);

