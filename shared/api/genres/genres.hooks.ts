"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/shared/store/auth-store";

import {
	createGenre,
	deleteGenre,
	getGenres,
	getGenresByCategory,
	saveGenre,
	updateGenre,
} from "./genres.api";
import type {
	ICreateGenrePayload,
	IUpdateGenrePayload,
} from "./genres.types";

export const useGenresQuery = () =>
	useQuery({ queryFn: getGenres, queryKey: ["genres"] });

interface IUseGenresByCategoryQueryParams {
	includeCounts?: boolean;
	selected?: string[];
}

export const useGenresByCategoryQuery = ({
	includeCounts = false,
	selected = [],
}: IUseGenresByCategoryQueryParams = {}) => {
	const sessionKey = useAuthStore(
		(state) => state.session?.user.id ?? state.session?.user.email ?? "guest",
	);

	return useQuery({
		queryFn: () => getGenresByCategory({ includeCounts, selected }),
		queryKey: [
			"genres",
			"byCategory",
			includeCounts,
			selected.join(","),
			sessionKey,
		],
	});
};

export const useSaveGenreMutation = () => {
	const queryClient = useQueryClient();
	const userId = useAuthStore(
		(state) => state.session?.user.id ?? state.session?.user.email ?? "guest",
	);

	return useMutation({
		mutationFn: (genreId: string) => saveGenre(userId, genreId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["genres"] });
		},
	});
};

export const useCreateGenreMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: ICreateGenrePayload) => createGenre(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["genres"] });
		},
	});
};

export const useUpdateGenreMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: IUpdateGenrePayload }) =>
			updateGenre(id, payload),
		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["genres"] });
			queryClient.invalidateQueries({ queryKey: ["genres", id] });
		},
	});
};

export const useDeleteGenreMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteGenre(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: ["genres"] });
			queryClient.invalidateQueries({ queryKey: ["genres", id] });
		},
	});
};
