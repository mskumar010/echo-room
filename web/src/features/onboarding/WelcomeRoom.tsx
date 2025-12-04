import { useEffect } from 'react';
import { ChatArea } from '../../components/layout/ChatArea';
import { MessageList } from '../chat/components/MessageList';
import { MessageInput } from '../chat/components/MessageInput';
import { addMessage } from '../chat/chatSlice';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import type { UIMessage } from '../../types';

interface WelcomeMessage {
	text: string;
	sender: {
		id: string;
		displayName: string;
		avatarUrl?: string;
	};
	delay: number; // Delay in milliseconds before showing this message
}

const WELCOME_MESSAGES: WelcomeMessage[] = [
	{
		text: `Welcome to EchoRoom! 👋`,
		sender: {
			id: 'system',
			displayName: 'EchoRoom',
		},
		delay: 0,
	},
	{
		text: `We're excited to have you here! This is your personal welcome room where you can learn about EchoRoom.`,
		sender: {
			id: 'system',
			displayName: 'EchoRoom',
		},
		delay: 1000,
	},
	{
		text: `EchoRoom is a real-time chat application with Discord-style rooms. You can join different rooms, chat with others, and stay connected.`,
		sender: {
			id: 'system',
			displayName: 'EchoRoom',
		},
		delay: 2000,
	},
	{
		text: `Here's what you can do:
• Browse rooms in the sidebar
• Join any room to start chatting
• Send messages in real-time
• See who's typing
• Customize your experience`,
		sender: {
			id: 'system',
			displayName: 'EchoRoom',
		},
		delay: 3000,
	},
	{
		text: `Feel free to explore! You can reply to these messages, but they're just here to help you get started. When you're ready, check out the other rooms in the sidebar.`,
		sender: {
			id: 'system',
			displayName: 'EchoRoom',
		},
		delay: 4000,
	},
];

interface WelcomeRoomProps {
	userName: string;
	userId: string;
	roomId: string;
	onComplete?: () => void;
}

export function WelcomeRoom({ userName, userId, roomId, onComplete }: WelcomeRoomProps) {
	const dispatch = useDispatch<AppDispatch>();
	const messages = useSelector((state: RootState) => state.chat.messages[roomId] || []);

	useEffect(() => {
		// Add personalized welcome message
		const personalizedMessage: WelcomeMessage = {
			text: `Hey ${userName}! Let's get you started.`,
			sender: {
				id: 'system',
				displayName: 'EchoRoom',
			},
			delay: 500,
		};

		const allMessages = [personalizedMessage, ...WELCOME_MESSAGES];

		// Display messages with delays
		const timeouts: ReturnType<typeof setTimeout>[] = [];

		allMessages.forEach((msg, index) => {
			const timeout = setTimeout(() => {
				const uiMessage: UIMessage = {
					id: `welcome-${index}-${Date.now()}`,
					roomId,
					sender: msg.sender,
					text: msg.text,
					createdAt: new Date().toISOString(),
					isMine: false,
					isSystemMessage: true,
				};

				// Add to Redux
				dispatch(addMessage({ roomId, message: uiMessage }));

				// Check if all messages are shown
				if (index === allMessages.length - 1) {
					// Call onComplete after a short delay
					if (onComplete) {
						setTimeout(() => {
							onComplete();
						}, 2000);
					}
				}
			}, msg.delay);

			timeouts.push(timeout);
		});

		// Cleanup timeouts on unmount
		return () => {
			timeouts.forEach(clearTimeout);
		};
	}, [userName, userId, roomId, dispatch, onComplete]);

	return (
		<ChatArea
			header={
				<div className="flex items-center gap-2">
					<span className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
						👋 Welcome Room
					</span>
				</div>
			}
		>
			<div className="flex h-full flex-col">
				<div className="flex-1 overflow-hidden">
					<MessageList
						messages={messages}
						typingUserIds={[]}
						typingUserNames={{}}
					/>
				</div>
				<MessageInput roomId={roomId} />
			</div>
		</ChatArea>
	);
}

