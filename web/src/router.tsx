import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { ChatRoomPage } from '@/pages/ChatRoomPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { WelcomePage } from '@/pages/WelcomePage';
import { ProfilePage } from '@/pages/ProfilePage';

// Router configuration
const router = createBrowserRouter([
	{
		path: '/',
		element: (
			<ProtectedRoute>
				<AppLayout />
			</ProtectedRoute>
		),
		children: [
			{
				index: true,
				element: <HomePage />,
			},
			{
				path: 'room/:roomId',
				element: <ChatRoomPage />,
			},
			{
				path: 'welcome',
				element: <WelcomePage />,
			},
			{
				path: 'profile',
				element: <ProfilePage />,
			},
		],
	},
	{
		path: '/login',
		element: <LoginPage />,
	},
	{
		path: '/register',
		element: <RegisterPage />,
	},
]);

export function AppRouter() {
	return <RouterProvider router={router} />;
}
