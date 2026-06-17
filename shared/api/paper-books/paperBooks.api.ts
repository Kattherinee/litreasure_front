import { requestAuth } from "../base";
import type {
	IPaperBooksParams,
	IPaperBooksResponse,
	IPaperBookState,
	IPaperBookStatusCounts,
	IUpsertPaperBookPayload,
} from "./paperBooks.types";

const buildPaperBooksQuery = (params: IPaperBooksParams = {}) => {
	const searchParams = new URLSearchParams();

	if (params.status) searchParams.set("status", params.status);
	if (params.page && params.page > 0) searchParams.set("page", String(params.page));
	if (params.limit && params.limit > 0)
		searchParams.set("limit", String(params.limit));

	const query = searchParams.toString();
	return query ? `?${query}` : "";
};

export const getPaperBooks = (
	params: IPaperBooksParams = {},
): Promise<IPaperBooksResponse> =>
	requestAuth<IPaperBooksResponse>(`/paper-books${buildPaperBooksQuery(params)}`);

export const getPaperBookStatusCounts = (): Promise<IPaperBookStatusCounts> =>
	requestAuth<IPaperBookStatusCounts>("/paper-books/status-counts");

export const getPaperBookState = (bookId: string): Promise<IPaperBookState> =>
	requestAuth<IPaperBookState>(`/paper-books/${bookId}`);

export const createPaperBookState = (
	bookId: string,
	payload: IUpsertPaperBookPayload,
): Promise<IPaperBookState> =>
	requestAuth<IPaperBookState>(`/paper-books/${bookId}`, {
		body: JSON.stringify(payload),
		method: "POST",
	});

export const updatePaperBookState = (
	bookId: string,
	payload: IUpsertPaperBookPayload,
): Promise<IPaperBookState> =>
	requestAuth<IPaperBookState>(`/paper-books/${bookId}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});

export const deletePaperBookState = (bookId: string): Promise<IPaperBookState> =>
	requestAuth<IPaperBookState>(`/paper-books/${bookId}`, {
		method: "DELETE",
	});
