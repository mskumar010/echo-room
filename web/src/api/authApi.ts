import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const authApi = createApi({
	reducerPath: 'authApi',
	baseQuery: fetchBaseQuery({
		baseUrl: `${API_URL}/auth`,
		credentials: 'include',
		prepareHeaders: (headers, { getState }) => {
			// Get token from Redux state
			const state = getState() as { auth: { accessToken: string | null } };
			const token = state.auth.accessToken;
			if (token) {
				headers.set('authorization', `Bearer ${token}`);
			}
			return headers;
		},
	}),
	tagTypes: ['User'],
	endpoints: (builder) => ({
		register: builder.mutation<AuthResponse, RegisterCredentials>({
			query: (credentials) => ({
				url: '/register',
				method: 'POST',
				body: credentials,
			}),
		}),
		login: builder.mutation<AuthResponse, LoginCredentials>({
			query: (credentials) => ({
				url: '/login',
				method: 'POST',
				body: credentials,
			}),
		}),
		refresh: builder.mutation<{ accessToken: string }, void>({
			query: () => ({
				url: '/refresh',
				method: 'POST',
			}),
		}),
		logout: builder.mutation<void, void>({
			query: () => ({
				url: '/logout',
				method: 'POST',
			}),
		}),
		getMe: builder.query<User, void>({
			query: () => '/me',
			providesTags: ['User'],
		}),
	}),
});

export const {
	useRegisterMutation,
	useLoginMutation,
	useRefreshMutation,
	useLogoutMutation,
	useGetMeQuery,
} = authApi;

