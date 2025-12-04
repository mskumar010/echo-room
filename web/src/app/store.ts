import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import roomsReducer from '../features/rooms/roomsSlice';
import chatReducer from '../features/chat/chatSlice';
import connectionReducer from '../features/connection/connectionSlice';
import onboardingReducer from '../features/onboarding/onboardingSlice';
import { authApi } from '../api/authApi';
import { roomsApi } from '../api/roomsApi';
import { messagesApi } from '../api/messagesApi';

const rootReducer = combineReducers({
	auth: authReducer,
	rooms: roomsReducer,
	chat: chatReducer,
	connection: connectionReducer,
	onboarding: onboardingReducer,
	[authApi.reducerPath]: authApi.reducer,
	[roomsApi.reducerPath]: roomsApi.reducer,
	[messagesApi.reducerPath]: messagesApi.reducer,
});

export const store = configureStore({
	reducer: rootReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ['socket/connect', 'socket/disconnect'],
			},
		})
			.concat(authApi.middleware)
			.concat(roomsApi.middleware)
			.concat(messagesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

