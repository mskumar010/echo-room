import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Message } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const messagesApi = createApi({
	reducerPath: 'messagesApi',
	baseQuery: fetchBaseQuery({
		baseUrl: `${API_URL}/rooms`,
		credentials: 'include',
		prepareHeaders: (headers, { getState }) => {
			const state = getState() as { auth: { accessToken: string | null } };
			const token = state.auth.accessToken;
			if (token) {
				headers.set('authorization', `Bearer ${token}`);
			}
			return headers;
		},
	}),
	tagTypes: ['Message'],
	endpoints: (builder) => ({
		getMessages: builder.query<
			Message[],
			{ roomId: string; limit?: number; before?: string }
		>({
			query: ({ roomId, limit = 50, before }) => {
				const params = new URLSearchParams();
				if (limit) params.append('limit', limit.toString());
				if (before) params.append('before', before);
				return `/${roomId}/messages?${params.toString()}`;
			},
			providesTags: (_result, _error, { roomId }) => [
				{ type: 'Message', id: roomId },
			],
		}),
	}),
});

export const { useGetMessagesQuery } = messagesApi;

