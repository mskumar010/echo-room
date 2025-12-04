import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChatArea } from '../components/layout/ChatArea';
import { MessageList } from '../features/chat/components/MessageList';
import { MessageInput } from '../features/chat/components/MessageInput';
import { useRoomSocket } from '../hooks/useRoomSocket';
import type { RootState } from '../app/store';

export function ChatRoomPage() {
	const { roomId } = useParams<{ roomId: string }>();
	const currentRoomId = roomId || 'general';

	const { user } = useSelector((state: RootState) => state.auth);
	const messages = useSelector(
		(state: RootState) => state.chat.messages[currentRoomId] || []
	);
	const typingUsers = useSelector(
		(state: RootState) => state.chat.typingUsers[currentRoomId] || new Set()
	);

	// Connect to room socket
	useRoomSocket({
		roomId: currentRoomId,
		userId: user?._id || '',
	});

	// Get room name (will be from Redux later)
	const roomName = currentRoomId;

	// Typing user names (placeholder - will get from Redux later)
	const typingUserNames: { [key: string]: string } = {};
	Array.from(typingUsers).forEach((userId) => {
		if (typeof userId === 'string') {
			typingUserNames[userId] = `User ${userId.slice(0, 4)}`;
		}
	});

	return (
		<ChatArea
			header={
				<div className="flex items-center gap-2">
					<span className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}># {roomName}</span>
				</div>
			}
		>
			<div className="flex h-full flex-col">
				<div className="flex-1 overflow-hidden">
					<MessageList
						messages={messages}
						typingUserIds={Array.from(typingUsers)}
						typingUserNames={typingUserNames}
					/>
				</div>
				<MessageInput roomId={currentRoomId} />
			</div>
		</ChatArea>
	);
}

