"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
	createAuthor,
	deleteAuthor,
	getAuthor,
	getAuthors,
	getMyAuthors,
	saveAuthor,
	unsaveAuthor,
	updateAuthor,
} from "./authors.api";
import type {
	IAuthorDetailsParams,
	IAuthorsListParams,
	ICreateAuthorPayload,
	IUpdateAuthorPayload,
} from "./authors.types";

export const authorsQueryKeys = {
	all: ["authors"] as const,
	byId: (id: string) => ["authors", id] as const,
	details: (id: string, params: IAuthorDetailsParams) =>
		["authors", id, params] as const,
	list: (params: IAuthorsListParams) => ["authors", "list", params] as const,
	mine: (params: IAuthorsListParams) => ["authors", "mine", params] as const,
};

export const useAuthorsQuery = (
	params: IAuthorsListParams = {},
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: options?.enabled ?? true,
		queryFn: () => getAuthors(params),
		queryKey: authorsQueryKeys.list(params),
	});

export const useMyAuthorsQuery = (
	params: IAuthorsListParams = {},
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: options?.enabled ?? true,
		queryFn: () => getMyAuthors(params),
		queryKey: authorsQueryKeys.mine(params),
	});

export const useAuthorQuery = (
	id: string,
	params: IAuthorDetailsParams = {},
) =>
	useQuery({
		enabled: Boolean(id),
		queryFn: () => getAuthor(id, params),
		queryKey: authorsQueryKeys.details(id, params),
	});

export const useCreateAuthorMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: ICreateAuthorPayload) => createAuthor(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: authorsQueryKeys.all });
		},
	});
};

export const useUpdateAuthorMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: IUpdateAuthorPayload;
		}) => updateAuthor(id, payload),
		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({ queryKey: authorsQueryKeys.byId(id) });
			queryClient.invalidateQueries({ queryKey: authorsQueryKeys.all });
		},
	});
};

export const useDeleteAuthorMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteAuthor(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: authorsQueryKeys.byId(id) });
			queryClient.invalidateQueries({ queryKey: authorsQueryKeys.all });
		},
	});
};

export const useSaveAuthorMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => saveAuthor(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: authorsQueryKeys.byId(id) });
			queryClient.invalidateQueries({ queryKey: authorsQueryKeys.all });
		},
	});
};

export const useUnsaveAuthorMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => unsaveAuthor(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: authorsQueryKeys.byId(id) });
			queryClient.invalidateQueries({ queryKey: authorsQueryKeys.all });
		},
	});
};
