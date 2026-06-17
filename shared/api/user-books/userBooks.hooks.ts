"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { booksQueryKeys } from "../books";
import {
	deleteBookTracking,
	getUserBookStatusCounts,
	getUserBooks,
	getUserBookTracking,
	updateBookTracking,
} from "./userBooks.api";
import type {
	IUpdateBookTrackingPayload,
	IUserBooksParams,
} from "./userBooks.types";

export const userBooksQueryKeys = {
	all: ["user-books"] as const,
	byBookId: (bookId: string) => ["user-books", "book", bookId] as const,
	list: (params: IUserBooksParams = {}) => ["user-books", "list", params] as const,
	statusCounts: () => ["user-books", "status-counts"] as const,
};

export const useUserBooksQuery = (
	params: IUserBooksParams = {},
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: options?.enabled ?? true,
		queryFn: () => getUserBooks(params),
		queryKey: userBooksQueryKeys.list(params),
	});

export const useUserBookTrackingQuery = (
	bookId: string,
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: Boolean(bookId) && (options?.enabled ?? true),
		queryFn: () => getUserBookTracking(bookId),
		queryKey: userBooksQueryKeys.byBookId(bookId),
		retry: false,
	});

export const useUserBookStatusCountsQuery = (options?: { enabled?: boolean }) =>
	useQuery({
		enabled: options?.enabled ?? true,
		queryFn: getUserBookStatusCounts,
		queryKey: userBooksQueryKeys.statusCounts(),
	});

export const useUpdateBookTrackingMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			bookId,
			payload,
		}: {
			bookId: string;
			payload: IUpdateBookTrackingPayload;
		}) => updateBookTracking(bookId, payload),
		onSuccess: (data, { bookId }) => {
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.byId(bookId) });
			queryClient.invalidateQueries({ queryKey: userBooksQueryKeys.all });
			queryClient.setQueryData(userBooksQueryKeys.byBookId(bookId), data);
		},
	});
};

export const useDeleteBookTrackingMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (bookId: string) => deleteBookTracking(bookId),
		onSuccess: (_data, bookId) => {
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.byId(bookId) });
			queryClient.invalidateQueries({ queryKey: userBooksQueryKeys.all });
			queryClient.removeQueries({ queryKey: userBooksQueryKeys.byBookId(bookId) });
		},
	});
};
