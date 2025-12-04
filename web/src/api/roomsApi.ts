import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Room } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const roomsApi = createApi({
	reducerPath: 'roomsApi',
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
	tagTypes: ['Room'],
	endpoints: (builder) => ({
		getRooms: builder.query<Room[], void>({
			query: () => '',
			providesTags: ['Room'],
		}),
		getRoom: builder.query<Room, string>({
			query: (id) => `/${id}`,
			providesTags: (_result, _error, id) => [{ type: 'Room', id }],
		}),
		createRoom: builder.mutation<Room, { name: string; description?: string }>({
			query: (body) => ({
				url: '',
				method: 'POST',
				body,
			}),
			invalidatesTags: ['Room'],
		}),
	}),
});

export const { useGetRoomsQuery, useGetRoomQuery, useCreateRoomMutation } = roomsApi;

