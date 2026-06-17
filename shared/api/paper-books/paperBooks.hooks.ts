"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { booksQueryKeys } from "../books";
import {
	createPaperBookState,
	deletePaperBookState,
	getPaperBooks,
	getPaperBookState,
	getPaperBookStatusCounts,
	updatePaperBookState,
} from "./paperBooks.api";
import type {
	IPaperBooksParams,
	IUpsertPaperBookPayload,
} from "./paperBooks.types";

export const paperBooksQueryKeys = {
	all: ["paper-books"] as const,
	byBookId: (bookId: string) => ["paper-books", "book", bookId] as const,
	list: (params: IPaperBooksParams = {}) => ["paper-books", "list", params] as const,
	statusCounts: () => ["paper-books", "status-counts"] as const,
};

export const usePaperBooksQuery = (
	params: IPaperBooksParams = {},
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: options?.enabled ?? true,
		queryFn: () => getPaperBooks(params),
		queryKey: paperBooksQueryKeys.list(params),
	});

export const usePaperBookStateQuery = (
	bookId: string,
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: Boolean(bookId) && (options?.enabled ?? true),
		queryFn: () => getPaperBookState(bookId),
		queryKey: paperBooksQueryKeys.byBookId(bookId),
		retry: false,
	});

export const usePaperBookStatusCountsQuery = (options?: { enabled?: boolean }) =>
	useQuery({
		enabled: options?.enabled ?? true,
		queryFn: getPaperBookStatusCounts,
		queryKey: paperBooksQueryKeys.statusCounts(),
	});

export const useCreatePaperBookStateMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			bookId,
			payload,
		}: {
			bookId: string;
			payload: IUpsertPaperBookPayload;
		}) => createPaperBookState(bookId, payload),
		onSuccess: (data, { bookId }) => {
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.byId(bookId) });
			queryClient.invalidateQueries({ queryKey: paperBooksQueryKeys.all });
			queryClient.setQueryData(paperBooksQueryKeys.byBookId(bookId), data);
		},
	});
};

export const useUpdatePaperBookStateMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			bookId,
			payload,
		}: {
			bookId: string;
			payload: IUpsertPaperBookPayload;
		}) => updatePaperBookState(bookId, payload),
		onSuccess: (data, { bookId }) => {
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.byId(bookId) });
			queryClient.invalidateQueries({ queryKey: paperBooksQueryKeys.all });
			queryClient.setQueryData(paperBooksQueryKeys.byBookId(bookId), data);
		},
	});
};

export const useDeletePaperBookStateMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (bookId: string) => deletePaperBookState(bookId),
		onSuccess: (_data, bookId) => {
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.byId(bookId) });
			queryClient.invalidateQueries({ queryKey: paperBooksQueryKeys.all });
			queryClient.removeQueries({ queryKey: paperBooksQueryKeys.byBookId(bookId) });
		},
	});
};
