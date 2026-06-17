import { requestAuth } from "../base";
import {
	applyLocalUserBookTracking,
	isOfflineError,
	queueUserBookMutation,
	readCachedBook,
	readCachedApiResponse,
	removeLocalUserBookTracking,
} from "@/shared/pwa/offlineStorage";
import type {
	IUpdateBookTrackingPayload,
	IUserBooksParams,
	IUserBooksResponse,
	IUserBookStatusCounts,
	IUserBookTracking,
} from "./userBooks.types";

const buildUserBooksQuery = (params: IUserBooksParams = {}) => {
	const searchParams = new URLSearchParams();

	if (params.status) searchParams.set("status", params.status);
	if (params.page && params.page > 0) searchParams.set("page", String(params.page));
	if (params.limit && params.limit > 0) searchParams.set("limit", String(params.limit));

	const query = searchParams.toString();
	return query ? `?${query}` : "";
};

export const getUserBooks = (
	params: IUserBooksParams = {},
): Promise<IUserBooksResponse> =>
	requestAuth<IUserBooksResponse>(`/user-books${buildUserBooksQuery(params)}`);

export const getUserBookTracking = (
	bookId: string,
): Promise<IUserBookTracking> =>
	requestAuth<IUserBookTracking>(`/user-books/${bookId}`);

export const getUserBookStatusCounts =
	(): Promise<IUserBookStatusCounts> =>
		requestAuth<IUserBookStatusCounts>("/user-books/status-counts");

export const updateBookTracking = (
	bookId: string,
	payload: IUpdateBookTrackingPayload,
): Promise<IUserBookTracking> =>
	requestAuth<IUserBookTracking>(`/user-books/${bookId}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	}).catch(async (error) => {
		if (!isOfflineError(error)) throw error;

		const cachedTracking = await readCachedApiResponse<IUserBookTracking>(
			`/user-books/${bookId}`,
		);
		const cachedBook = await readCachedBook(bookId);
		const book = cachedTracking?.book ??
			(cachedBook && {
				author: cachedBook.author,
				coverUrl: cachedBook.coverUrl,
				id: cachedBook.id,
				title: cachedBook.title,
			});

		if (!book) throw error;

		const optimisticTracking: IUserBookTracking = {
			currentPage: payload.currentPage ?? cachedTracking?.currentPage,
			finishedAt: payload.finishedAt ?? cachedTracking?.finishedAt,
			id: cachedTracking?.id ?? `offline-${bookId}`,
			isRereading: payload.isRereading ?? cachedTracking?.isRereading ?? false,
			readCount: payload.readCount ?? cachedTracking?.readCount ?? 0,
			startedAt: payload.startedAt ?? cachedTracking?.startedAt,
			status: payload.status,
			updatedAt: new Date().toISOString(),
			book,
		};

		await applyLocalUserBookTracking(bookId, optimisticTracking);
		await queueUserBookMutation({
			body: JSON.stringify(payload),
			method: "PATCH",
			path: `/user-books/${bookId}`,
		});

		return optimisticTracking;
	});

export const deleteBookTracking = async (
	bookId: string,
): Promise<IUserBookTracking> =>
	requestAuth<IUserBookTracking>(`/user-books/${bookId}`, {
		method: "DELETE",
	}).catch(async (error) => {
		if (!isOfflineError(error)) throw error;

		const cachedTracking = await readCachedApiResponse<IUserBookTracking>(
			`/user-books/${bookId}`,
		);
		if (!cachedTracking) throw error;

		await removeLocalUserBookTracking(bookId);
		await queueUserBookMutation({
			method: "DELETE",
			path: `/user-books/${bookId}`,
		});

		return cachedTracking;
	});
