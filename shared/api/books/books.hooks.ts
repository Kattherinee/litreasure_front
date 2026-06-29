"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
	createBook,
	deleteBook,
	getBook,
	getBookCollections,
	getBookCards,
	getBooks,
	rateBook,
	updateBook,
} from "./books.api";
import { useAuthStore } from "@/shared/store/auth-store";
import type {
	ICreateBookPayload,
	IBookCardsParams,
	IRateBookResponse,
	IUpdateBookPayload,
} from "./books.types";

export const booksQueryKeys = {
	all: ["books"] as const,
	byId: (id: string) => ["books", id] as const,
	cards: (params: IBookCardsParams, viewerKey: string) =>
		["books", "cards", params, viewerKey] as const,
	collections: (id: string) => ["books", id, "collections"] as const,
};

const recomendationsForYouBooksQueryKey = [
	"recomendations",
	"for-you-books",
] as const;

export const useBooksQuery = () =>
	useQuery({ queryFn: getBooks, queryKey: booksQueryKeys.all });

export const useBookCardsQuery = (
	params: IBookCardsParams,
	options?: { enabled?: boolean },
) => {
	const viewerKey = useAuthStore(
		(state) => state.session?.user.id ?? state.session?.user.email ?? "anon",
	);

	return useQuery({
		enabled: options?.enabled,
		queryFn: () => getBookCards({ params }),
		queryKey: booksQueryKeys.cards(params, viewerKey),
		gcTime:
			params.genre || params.genreIds?.length
				? 7 * 24 * 60 * 60_000
				: undefined,
		staleTime:
			params.genre || params.genreIds?.length
				? 7 * 24 * 60 * 60_000
				: undefined,
	});
};

export const useBookQuery = (id: string) =>
	useQuery({
		enabled: Boolean(id),
		queryFn: () => getBook(id),
		queryKey: booksQueryKeys.byId(id),
	});

export const useCreateBookMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: ICreateBookPayload) => createBook(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.all });
			queryClient.invalidateQueries({
				queryKey: recomendationsForYouBooksQueryKey,
			});
		},
	});
};

export const useUpdateBookMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: IUpdateBookPayload;
		}) => updateBook(id, payload),
		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.byId(id) });
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.all });
			queryClient.invalidateQueries({
				queryKey: recomendationsForYouBooksQueryKey,
			});
		},
	});
};

export const useDeleteBookMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteBook(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.all });
			queryClient.invalidateQueries({
				queryKey: recomendationsForYouBooksQueryKey,
			});
		},
	});
};

export const useBookCollectionsQuery = (
	id: string,
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: Boolean(id) && options?.enabled,
		queryFn: () => getBookCollections(id),
		queryKey: booksQueryKeys.collections(id),
	});

export const useRateBookMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, rating }: { id: string; rating: number }) =>
			rateBook(id, { rating }),
		onSuccess: (ratingData: IRateBookResponse, { id }) => {
			queryClient.setQueryData(booksQueryKeys.byId(id), (current) => {
				if (!current || typeof current !== "object") return current;

				return {
					...current,
					ratingAvg: ratingData.ratingAvg,
					ratingsByStars: ratingData.ratingsByStars,
					ratingsCount: ratingData.ratingsCount,
				};
			});
			queryClient.invalidateQueries({ queryKey: ["books", "cards"] });
			queryClient.invalidateQueries({
				queryKey: recomendationsForYouBooksQueryKey,
			});
		},
	});
};
