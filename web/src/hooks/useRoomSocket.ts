import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSocket } from './useSocket';
import {
	addMessage,
	setTypingUser,
	updateOptimisticMessage,
	setMessages,
} from '../features/chat/chatSlice';
import { requestRecovery, recoverMessages, updateLastSeenSeq } from '../features/connection/connectionSlice';
import { useGetMessagesQuery } from '../api/messagesApi';
import type { SocketMessageNew, SocketTypingUpdate } from '../types';
import type { AppDispatch, RootState } from '../app/store';

interface UseRoomSocketOptions {
	roomId: string;
	userId: string;
}

export function useRoomSocket({ roomId, userId }: UseRoomSocketOptions) {
	const dispatch = useDispatch<AppDispatch>();
	const socket = useSocket();
	const roomIdRef = useRef(roomId);
	const { lastSeenSeq, rooms } = useSelector(
		(state: RootState) => state.connection
	);
	const roomLastSeq = rooms[roomId]?.lastSeenSeq || 0;

	// Fetch initial messages
	const { data: initialMessages } = useGetMessagesQuery(
		{ roomId },
		{ skip: !roomId }
	);

	useEffect(() => {
		roomIdRef.current = roomId;
	}, [roomId]);

	// Load initial messages
	useEffect(() => {
		if (initialMessages && initialMessages.length > 0) {
			const uiMessages = initialMessages.map((msg) => ({
				id: msg._id,
				roomId: msg.roomId,
				sender: {
					id: msg.senderId,
					displayName: 'User', // Will be populated from server
					avatarUrl: undefined,
				},
				text: msg.text,
				createdAt: msg.createdAt,
				isMine: msg.senderId === userId,
			}));
			dispatch(setMessages({ roomId, messages: uiMessages }));
			// Update last seen seq
			const maxSeq = Math.max(...initialMessages.map((m) => m.seq || 0));
			if (maxSeq > 0) {
				dispatch(updateLastSeenSeq({ roomId, seq: maxSeq }));
			}
		}
	}, [initialMessages, roomId, userId, dispatch]);

	useEffect(() => {
		if (!socket || !roomId) {
			return;
		}

		// Join room
		socket.emit('room:join', { roomId });

		// Request recovery if needed
		if (roomLastSeq > 0) {
			dispatch(requestRecovery());
			socket.emit('connection:recover', {
				roomId,
				lastSeenSeq: roomLastSeq,
			});
		}

		// Message handlers
		const handleMessageNew = (data: SocketMessageNew) => {
			if (data.message.roomId === roomIdRef.current) {
				dispatch(
					addMessage({
						roomId: roomIdRef.current,
						message: {
							...data.message,
							isMine: data.message.sender.id === userId,
						},
					})
				);
				// Update last seen seq
				dispatch(updateLastSeenSeq({ roomId: roomIdRef.current, seq: data.seq }));
			}
		};

		const handleMessageAck = (data: { tempId: string; realId: string }) => {
			dispatch(
				updateOptimisticMessage({
					roomId: roomIdRef.current,
					tempId: data.tempId,
					realId: data.realId,
				})
			);
		};

		const handleTypingUpdate = (data: SocketTypingUpdate) => {
			if (data.roomId === roomIdRef.current && data.userId !== userId) {
				dispatch(
					setTypingUser({
						roomId: roomIdRef.current,
						userId: data.userId,
						isTyping: data.isTyping,
					})
				);
			}
		};

		const handleConnectionMissed = (data: {
			roomId: string;
			messages: Array<{ seq: number; [key: string]: unknown }>;
		}) => {
			if (data.roomId === roomIdRef.current && data.messages.length > 0) {
				dispatch(recoverMessages({ roomId: roomIdRef.current, messages: data.messages }));
				// Add recovered messages to chat
				const recoveredMessages = data.messages.map((msg: unknown) => {
					// Type assertion - server should send proper message format
					const m = msg as {
						_id: string;
						roomId: string;
						senderId: string;
						text: string;
						createdAt: string;
						seq: number;
					};
					return {
						id: m._id,
						roomId: m.roomId,
						sender: {
							id: m.senderId,
							displayName: 'User',
							avatarUrl: undefined,
						},
						text: m.text,
						createdAt: m.createdAt,
						isMine: m.senderId === userId,
					};
				});
				recoveredMessages.forEach((msg) => {
					dispatch(addMessage({ roomId: roomIdRef.current, message: msg }));
				});
			}
		};

		socket.on('message:new', handleMessageNew);
		socket.on('message:ack', handleMessageAck);
		socket.on('typing:update', handleTypingUpdate);
		socket.on('connection:missed', handleConnectionMissed);

		// Cleanup
		return () => {
			if (socket && roomIdRef.current) {
				socket.emit('room:leave', { roomId: roomIdRef.current });
				socket.off('message:new', handleMessageNew);
				socket.off('message:ack', handleMessageAck);
				socket.off('typing:update', handleTypingUpdate);
				socket.off('connection:missed', handleConnectionMissed);
			}
		};
	}, [socket, roomId, userId, dispatch, roomLastSeq]);

	return socket;
}

