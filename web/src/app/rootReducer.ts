import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import roomsReducer from '../features/rooms/roomsSlice';
import chatReducer from '../features/chat/chatSlice';
import connectionReducer from '../features/connection/connectionSlice';

export const rootReducer = combineReducers({
	auth: authReducer,
	rooms: roomsReducer,
	chat: chatReducer,
	connection: connectionReducer,
});

