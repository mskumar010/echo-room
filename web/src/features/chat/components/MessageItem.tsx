import { memo } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '../../../components/common/Avatar';
import { formatMessageTime } from '../../../lib/utils';
import type { UIMessage } from '../../../types';

interface MessageItemProps {
	message: UIMessage;
}

export const MessageItem = memo(function MessageItem({ message }: MessageItemProps) {
	if (message.isSystemMessage) {
		return (
			<div className="flex items-center justify-center py-2">
				<div 
					className="rounded-full px-4 py-1"
					style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
				>
					<p className="text-xs italic" style={{ color: 'var(--color-text-tertiary)' }}>{message.text}</p>
				</div>
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2 }}
			className="group flex gap-3 px-4 py-2 transition-colors"
			onMouseEnter={(e) => {
				e.currentTarget.style.backgroundColor = 'rgba(58, 58, 60, 0.3)';
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.backgroundColor = 'transparent';
			}}
		>
			<Avatar
				src={message.sender.avatarUrl}
				name={message.sender.displayName}
				size="md"
			/>
			<div className="flex-1 min-w-0">
				<div className="flex items-baseline gap-2 mb-1">
					<span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
						{message.sender.displayName}
					</span>
					<span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
						{formatMessageTime(message.createdAt)}
					</span>
					{message.isOptimistic && (
						<span className="text-xs italic" style={{ color: 'var(--color-text-tertiary)' }}>Sending...</span>
					)}
				</div>
				<p className="break-words" style={{ color: 'var(--color-text-secondary)' }}>{message.text}</p>
			</div>
		</motion.div>
	);
});

