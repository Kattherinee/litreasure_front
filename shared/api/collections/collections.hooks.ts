"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { booksQueryKeys } from "../books";
import {
	addBookToCollection,
	createCollection,
	deleteCollection,
	getCollection,
	getCollectionTags,
	getMyCollections,
	getPublicCollections,
	getSubscribedCollections,
	removeBookFromCollection,
	saveCollection,
	unsaveCollection,
	updateCollection,
} from "./collections.api";
import type {
	ICollectionsListParams,
	ICreateCollectionPayload,
	IUpdateCollectionPayload,
} from "./collections.types";

export const collectionsQueryKeys = {
	all: ["collections"] as const,
	byId: (id: string) => ["collections", id] as const,
	mine: (params: ICollectionsListParams) =>
		["collections", "mine", params] as const,
	public: (params: ICollectionsListParams) =>
		["collections", "public", params] as const,
	subscribed: (params: ICollectionsListParams) =>
		["collections", "subscribed", params] as const,
	tags: (search: string, limit: number) =>
		["collections", "tags", search, limit] as const,
};

export const usePublicCollectionsQuery = (
	params: ICollectionsListParams = {},
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: options?.enabled ?? true,
		queryFn: () => getPublicCollections(params),
		queryKey: collectionsQueryKeys.public(params),
	});

export const useMyCollectionsQuery = (
	params: ICollectionsListParams = {},
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: options?.enabled ?? true,
		queryFn: () => getMyCollections(params),
		queryKey: collectionsQueryKeys.mine(params),
	});

export const useSubscribedCollectionsQuery = (
	params: ICollectionsListParams = {},
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: options?.enabled ?? true,
		queryFn: () => getSubscribedCollections(params),
		queryKey: collectionsQueryKeys.subscribed(params),
	});
export const useCollectionQuery = (id: string) =>
	useQuery({
		enabled: Boolean(id),
		queryFn: () => getCollection(id),
		queryKey: collectionsQueryKeys.byId(id),
	});

export const useCollectionTagsQuery = (
	search = "",
	limit = 10,
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: options?.enabled ?? true,
		queryFn: () => getCollectionTags({ limit, search }),
		queryKey: collectionsQueryKeys.tags(search, limit),
	});

export const useCreateCollectionMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: ICreateCollectionPayload) =>
			createCollection(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.all });
		},
	});
};

export const useUpdateCollectionMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: IUpdateCollectionPayload;
		}) => updateCollection(id, payload),
		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({
				queryKey: collectionsQueryKeys.byId(id),
			});
			queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.all });
		},
	});
};

export const useDeleteCollectionMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteCollection(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({
				queryKey: collectionsQueryKeys.byId(id),
			});
			queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.all });
		},
	});
};

export const useSaveCollectionMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => saveCollection(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({
				queryKey: collectionsQueryKeys.byId(id),
			});
			queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.all });
		},
	});
};

export const useUnsaveCollectionMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => unsaveCollection(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({
				queryKey: collectionsQueryKeys.byId(id),
			});
			queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.all });
		},
	});
};

export const useAddBookToCollectionMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ bookId, id }: { bookId: string; id: string }) =>
			addBookToCollection(id, bookId),
		onSuccess: (data, { id }) => {
			const bookIds = data.books.map((book) => book.id);

			queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.all });
			for (const bookId of bookIds) {
				queryClient.invalidateQueries({
					queryKey: booksQueryKeys.byId(bookId),
				});
			}
			queryClient.setQueryData(collectionsQueryKeys.byId(id), data);
		},
	});
};

export const useRemoveBookFromCollectionMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ bookId, id }: { bookId: string; id: string }) =>
			removeBookFromCollection(id, bookId),
		onSuccess: (data, { bookId, id }) => {
			queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.byId(bookId) });
			queryClient.setQueryData(collectionsQueryKeys.byId(id), data);
		},
	});
};
