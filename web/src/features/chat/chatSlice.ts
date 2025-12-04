import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UIMessage, SocketMessageNew } from '../../types';
import { generateTempId } from '../../lib/utils';

interface ChatState {
	messages: {
		[roomId: string]: UIMessage[];
	};
	typingUsers: {
		[roomId: string]: Set<string>;
	};
	onlineUsers: {
		[roomId: string]: Set<string>;
	};
}

const initialState: ChatState = {
	messages: {},
	typingUsers: {},
	onlineUsers: {},
};

export const chatSlice = createSlice({
	name: 'chat',
	initialState,
	reducers: {
		addMessage: (
			state,
			action: PayloadAction<{ roomId: string; message: UIMessage }>
		) => {
			const { roomId, message } = action.payload;
			if (!state.messages[roomId]) {
				state.messages[roomId] = [];
			}
			// Avoid duplicates
			if (!state.messages[roomId].find((m) => m.id === message.id)) {
				state.messages[roomId].push(message);
			}
		},
		addMessages: (
			state,
			action: PayloadAction<{ roomId: string; messages: UIMessage[] }>
		) => {
			const { roomId, messages } = action.payload;
			if (!state.messages[roomId]) {
				state.messages[roomId] = [];
			}
			state.messages[roomId] = [
				...state.messages[roomId],
				...messages.filter(
					(msg) => !state.messages[roomId].find((m) => m.id === msg.id)
				),
			].sort(
				(a, b) =>
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
			);
		},
		setMessages: (
			state,
			action: PayloadAction<{ roomId: string; messages: UIMessage[] }>
		) => {
			const { roomId, messages } = action.payload;
			state.messages[roomId] = messages;
		},
		updateOptimisticMessage: (
			state,
			action: PayloadAction<{
				roomId: string;
				tempId: string;
				realId: string;
			}>
		) => {
			const { roomId, tempId, realId } = action.payload;
			const messages = state.messages[roomId];
			if (messages) {
				const index = messages.findIndex((m) => m.id === tempId);
				if (index !== -1) {
					messages[index].id = realId;
					messages[index].isOptimistic = false;
				}
			}
		},
		setTypingUser: (
			state,
			action: PayloadAction<{
				roomId: string;
				userId: string;
				isTyping: boolean;
			}>
		) => {
			const { roomId, userId, isTyping } = action.payload;
			if (!state.typingUsers[roomId]) {
				state.typingUsers[roomId] = new Set();
			}
			if (isTyping) {
				state.typingUsers[roomId].add(userId);
			} else {
				state.typingUsers[roomId].delete(userId);
			}
		},
		setOnlineUsers: (
			state,
			action: PayloadAction<{ roomId: string; userIds: string[] }>
		) => {
			const { roomId, userIds } = action.payload;
			state.onlineUsers[roomId] = new Set(userIds);
		},
		clearRoom: (state, action: PayloadAction<string>) => {
			const roomId = action.payload;
			delete state.messages[roomId];
			delete state.typingUsers[roomId];
			delete state.onlineUsers[roomId];
		},
	},
});

export const {
	addMessage,
	addMessages,
	setMessages,
	updateOptimisticMessage,
	setTypingUser,
	setOnlineUsers,
	clearRoom,
} = chatSlice.actions;

export default chatSlice.reducer;

