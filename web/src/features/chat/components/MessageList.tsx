import { useEffect, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import type { UIMessage } from '../../../types';

interface MessageListProps {
	messages: UIMessage[];
	typingUserIds: string[];
	typingUserNames: { [userId: string]: string };
}

export function MessageList({
	messages,
	typingUserIds,
	typingUserNames,
}: MessageListProps) {
	const virtuosoRef = useRef<any>(null);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (virtuosoRef.current && messages.length > 0) {
			setTimeout(() => {
				virtuosoRef.current?.scrollToIndex({
					index: messages.length - 1,
					behavior: 'smooth',
				});
			}, 100);
		}
	}, [messages.length]);

	const typingNames = typingUserIds
		.map((id) => typingUserNames[id])
		.filter(Boolean);

	if (messages.length === 0 && typingNames.length === 0) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center space-y-2">
					<p style={{ color: 'var(--color-text-tertiary)' }}>No messages yet</p>
					<p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Start the conversation!</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<Virtuoso
				ref={virtuosoRef}
				data={messages}
				itemContent={(_index, message) => (
					<MessageItem key={message.id} message={message} />
				)}
				initialTopMostItemIndex={messages.length - 1}
				followOutput="smooth"
				style={{ height: '100%' }}
			/>
			{typingNames.length > 0 && <TypingIndicator userNames={typingNames} />}
		</div>
	);
}

