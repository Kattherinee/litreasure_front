"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
	addUserGenre,
	deleteUserAccount,
	getUserGenres,
	updateUserGenres,
	updateUserPassword,
	updateUserProfile,
} from "./users.api";
import type {
	IAddUserGenrePayload,
	IUpdateUserGenresPayload,
	IUpdateUserPasswordPayload,
	IUpdateUserProfilePayload,
} from "./users.types";

export const userQueryKeys = {
	genres: (userId?: string) => ["users", userId, "genres"] as const,
};

export const useUserGenresQuery = (
	userId?: string,
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: Boolean(userId) && (options?.enabled ?? true),
		queryFn: () => getUserGenres(userId as string),
		queryKey: userQueryKeys.genres(userId),
	});

export const useAddUserGenreMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			userId,
			payload,
		}: {
			userId: string;
			payload: IAddUserGenrePayload;
		}) => addUserGenre(userId, payload),
		onSuccess: (_data, { userId }) => {
			queryClient.invalidateQueries({ queryKey: userQueryKeys.genres(userId) });
			queryClient.invalidateQueries({ queryKey: ["genres", "byCategory"] });
		},
	});
};

export const useUpdateUserGenresMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			userId,
			payload,
		}: {
			userId: string;
			payload: IUpdateUserGenresPayload;
		}) => updateUserGenres(userId, payload),
		onSuccess: (_data, { userId }) => {
			queryClient.invalidateQueries({ queryKey: userQueryKeys.genres(userId) });
			queryClient.invalidateQueries({ queryKey: ["genres", "byCategory"] });
		},
	});
};

export const useUpdateUserProfileMutation = () =>
	useMutation({
		mutationFn: ({
			userId,
			payload,
		}: {
			userId: string;
			payload: IUpdateUserProfilePayload;
		}) => updateUserProfile(userId, payload),
	});

export const useUpdateUserPasswordMutation = () =>
	useMutation({
		mutationFn: ({
			userId,
			payload,
		}: {
			userId: string;
			payload: IUpdateUserPasswordPayload;
		}) => updateUserPassword(userId, payload),
	});

export const useDeleteUserAccountMutation = () =>
	useMutation({
		mutationFn: (userId: string) => deleteUserAccount(userId),
	});
