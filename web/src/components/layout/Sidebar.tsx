import { Home, Hash, Plus, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useGetRoomsQuery } from '../../api/roomsApi';
import { useLogoutMutation } from '../../api/authApi';
import { cn } from '../../lib/utils';
import { setActiveRoom } from '../../features/rooms/roomsSlice';
import { logout } from '../../features/auth/authSlice';
import { ThemeToggleCompact } from '../common/ThemeToggle';
import type { RootState } from '../../app/store';

export function Sidebar() {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
	const { user } = useSelector((state: RootState) => state.auth);
	const { activeRoomId, rooms: roomsFromState } = useSelector(
		(state: RootState) => state.rooms
	);
	const [logoutMutation] = useLogoutMutation();
	const { data: roomsData, isLoading: roomsLoading } = useGetRoomsQuery(undefined, {
		skip: !user, // Only fetch if user is authenticated
	});

	// Use API data if available, otherwise fall back to state
	const displayRooms = roomsData && roomsData.length > 0 ? roomsData : roomsFromState;
	const currentRoomId = activeRoomId || location.pathname.split('/room/')[1] || null;

	const handleLogout = async () => {
		try {
			await logoutMutation().unwrap();
			dispatch(logout());
			navigate('/login');
		} catch (error) {
			console.error('Logout failed:', error);
			// Still logout locally
			dispatch(logout());
			navigate('/login');
		}
	};

	const handleRoomClick = (roomId: string) => {
		dispatch(setActiveRoom(roomId));
		navigate(`/room/${roomId}`);
	};

	const handleHomeClick = () => {
		dispatch(setActiveRoom(null));
		navigate('/');
	};

	return (
		<aside 
			className="flex w-64 flex-col border-r" 
			style={{ 
				backgroundColor: 'var(--color-bg-secondary)',
				borderColor: 'var(--color-border)'
			}}
		>
			{/* Server/App Header */}
			<div 
				className="flex h-14 items-center border-b px-4"
				style={{ borderColor: 'var(--color-border)' }}
			>
				<div className="flex items-center gap-2">
					<div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
						<span className="text-white font-bold text-sm">ER</span>
					</div>
					<h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>EchoRoom</h1>
				</div>
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto p-2">
			{/* Home */}
			<motion.button
				onClick={handleHomeClick}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				className={cn(
					'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
					location.pathname === '/' && 'font-medium'
				)}
				style={{
					color: location.pathname === '/' 
						? 'var(--color-text-primary)' 
						: 'var(--color-text-secondary)',
					backgroundColor: location.pathname === '/' 
						? 'var(--color-bg-tertiary)' 
						: 'transparent',
				}}
				onMouseEnter={(e) => {
					if (location.pathname !== '/') {
						e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
						e.currentTarget.style.color = 'var(--color-text-primary)';
					}
				}}
				onMouseLeave={(e) => {
					if (location.pathname !== '/') {
						e.currentTarget.style.backgroundColor = 'transparent';
						e.currentTarget.style.color = 'var(--color-text-secondary)';
					}
				}}
			>
				<Home className="h-5 w-5" />
				<span className="font-medium">Home</span>
			</motion.button>

				{/* Divider */}
				<div className="my-2 border-t" style={{ borderColor: 'var(--color-border)' }} />

			{/* Rooms */}
			<div className="space-y-1">
				{roomsLoading ? (
					<div className="px-3 py-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Loading rooms...</div>
				) : displayRooms.length === 0 ? (
					<div className="px-3 py-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No rooms available</div>
				) : (
					displayRooms.map((room) => {
						const isActive = currentRoomId === room.slug || currentRoomId === room._id;
						return (
							<motion.button
								key={room._id}
								onClick={() => handleRoomClick(room.slug || room._id)}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
								style={{
									color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
									backgroundColor: isActive ? 'var(--color-bg-tertiary)' : 'transparent',
									fontWeight: isActive ? '500' : '400',
								}}
								onMouseEnter={(e) => {
									if (!isActive) {
										e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
										e.currentTarget.style.color = 'var(--color-text-secondary)';
									}
								}}
								onMouseLeave={(e) => {
									if (!isActive) {
										e.currentTarget.style.backgroundColor = 'transparent';
										e.currentTarget.style.color = 'var(--color-text-tertiary)';
									}
								}}
							>
								<Hash className="h-5 w-5" />
								<span className="font-medium">{room.name}</span>
							</motion.button>
						);
					})
				)}
			</div>

				{/* Add Room Button */}
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
					style={{ color: 'var(--color-text-tertiary)' }}
					onMouseEnter={(e) => {
						e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
						e.currentTarget.style.color = 'var(--color-text-secondary)';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.backgroundColor = 'transparent';
						e.currentTarget.style.color = 'var(--color-text-tertiary)';
					}}
				>
					<Plus className="h-5 w-5" />
					<span className="font-medium">Add Room</span>
				</motion.button>
			</nav>

			{/* User Section */}
			<div className="border-t p-2 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
					style={{ color: 'var(--color-text-secondary)' }}
					onMouseEnter={(e) => {
						e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.backgroundColor = 'transparent';
					}}
				>
					<div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
						<span className="text-white text-xs font-semibold">
							{user?.displayName?.[0]?.toUpperCase() || 'U'}
						</span>
					</div>
					<div className="flex-1">
						<p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
							{user?.displayName || 'User'}
						</p>
						<p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Online</p>
					</div>
					<Settings className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
				</motion.button>
				<div className="flex items-center justify-between gap-2">
					<ThemeToggleCompact />
					<motion.button
						onClick={handleLogout}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className="rounded-lg p-2 transition-colors"
						style={{ color: 'var(--color-text-tertiary)' }}
						title="Logout"
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
							e.currentTarget.style.color = '#ef4444';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = 'transparent';
							e.currentTarget.style.color = 'var(--color-text-tertiary)';
						}}
					>
						<LogOut className="h-5 w-5" />
					</motion.button>
				</div>
			</div>
		</aside>
	);
}

