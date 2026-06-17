import { request, requestAuth, requestOptionalAuth } from "../base";
import type { IBookCollectionPreview } from "../collections";
import type {
	IBook,
	IBookCardsParams,
	IBookCardsResponse,
	ICreateBookPayload,
	IRateBookPayload,
	IRateBookResponse,
	IUpdateBookPayload,
} from "./books.types";

const getBookCardsQuery = (params: IBookCardsParams) => {
	const searchParams = new URLSearchParams();

	if (params.genre) searchParams.set("genre", params.genre);
	if (params.genreIds?.length)
		searchParams.set("genreIds", params.genreIds.join(","));
	if (params.limit) searchParams.set("limit", String(params.limit));
	if (params.onlyMine) searchParams.set("onlyMine", "true");
	if (params.page) searchParams.set("page", String(params.page));
	if (params.search) searchParams.set("search", params.search);
	if (params.searchScope) searchParams.set("searchScope", params.searchScope);
	if (params.sort) searchParams.set("sort", params.sort);

	const query = searchParams.toString();

	return query ? `?${query}` : "";
};

export const getBooks = (): Promise<IBook[]> => request<IBook[]>("/books");

export const getBookCards = async ({
	params,
}: {
	params: IBookCardsParams;
}): Promise<IBookCardsResponse> => {
	const response = await requestOptionalAuth<IBookCardsResponse | IBook[]>(
		`/books/cards${getBookCardsQuery(params)}`,
	);

	if (Array.isArray(response)) {
		return {
			items: response,
			limit: params.limit ?? response.length,
			page: params.page ?? 1,
			pages: 1,
			total: response.length,
		};
	}

	return response;
};

export const getBook = (id: string): Promise<IBook> =>
	requestOptionalAuth<IBook>(`/books/${id}`);

export const createBook = (payload: ICreateBookPayload): Promise<IBook> =>
	requestAuth<IBook>("/books", {
		body: JSON.stringify(payload),
		method: "POST",
	});

export const updateBook = (
	id: string,
	payload: IUpdateBookPayload,
): Promise<IBook> =>
	requestAuth<IBook>(`/books/${id}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});

export const deleteBook = (id: string): Promise<void> =>
	requestAuth<void>(`/books/${id}`, { method: "DELETE" });

export const rateBook = (
	id: string,
	payload: IRateBookPayload,
): Promise<IRateBookResponse> =>
	requestAuth<IRateBookResponse>(`/books/${id}/rating`, {
		body: JSON.stringify(payload),
		method: "POST",
	});

export const getBookCollections = (
	id: string,
): Promise<IBookCollectionPreview[]> =>
	requestOptionalAuth<IBookCollectionPreview[]>(`/books/${id}/collections`);
