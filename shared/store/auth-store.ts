"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface IAuthUser {
	id?: string;
	email: string;
	name?: string;
	username?: string;
	avatarUrl?: string;
}

export interface IAuthSession {
	accessToken?: string;
	refreshToken?: string;
	user: IAuthUser;
}

interface IAuthStoreState {
	session: IAuthSession | null;
	isAuthenticated: boolean;
	setSession: (session: IAuthSession) => void;
	updateUser: (user: Partial<IAuthUser>) => void;
	logout: () => void;
}

export const AUTH_STORAGE_KEY = "litreasure-auth";

export const useAuthStore = create<IAuthStoreState>()(
	persist(
		(set) => ({
			session: null,
			isAuthenticated: false,
			setSession: (session) =>
				set({
					session,
					isAuthenticated: true,
				}),
			updateUser: (user) =>
				set((state) => {
					if (!state.session) return state;

					return {
						session: {
							...state.session,
							user: {
								...state.session.user,
								...user,
							},
						},
					};
				}),
			logout: () =>
				set({
					session: null,
					isAuthenticated: false,
				}),
		}),
		{
			name: AUTH_STORAGE_KEY,
			partialize: (state) => ({
				session: state.session,
				isAuthenticated: state.isAuthenticated,
			}),
		},
	),
);
