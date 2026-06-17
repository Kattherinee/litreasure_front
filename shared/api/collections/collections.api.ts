import { request, requestAuth, requestOptionalAuth } from "../base";
import type {
	ICollectionDetails,
	ICollectionTagSuggestion,
	ICollectionsListParams,
	ICollectionsListResponse,
	ICreateCollectionPayload,
	IUpdateCollectionPayload,
} from "./collections.types";

const normalizeCollectionsList = (
	response: ICollectionsListResponse | ICollectionsListResponse["items"],
): ICollectionsListResponse => {
	if (Array.isArray(response)) {
		return {
			items: response,
			limit: response.length,
			page: 1,
			pages: 1,
			total: response.length,
		};
	}

	return response;
};

type ICollectionsListApiResponse =
	| ICollectionsListResponse
	| ICollectionsListResponse["items"];

const getCollectionsQuery = (params: ICollectionsListParams = {}) => {
	const searchParams = new URLSearchParams();

	if (params.page) searchParams.set("page", String(params.page));
	if (params.limit) searchParams.set("limit", String(params.limit));
	if (params.tags) searchParams.set("tags", params.tags);
	if (params.tagMode) searchParams.set("tagMode", params.tagMode);
	if (params.genres?.length) searchParams.set("genres", params.genres.join(","));
	if (params.genreMode) searchParams.set("genreMode", params.genreMode);
	if (params.sort) searchParams.set("sort", params.sort);

	const query = searchParams.toString();

	return query ? `?${query}` : "";
};

export const getPublicCollections = async (
	params: ICollectionsListParams = {},
): Promise<ICollectionsListResponse> => {
	const response = await requestOptionalAuth<ICollectionsListApiResponse>(
		`/collections${getCollectionsQuery(params)}`,
	);

	return normalizeCollectionsList(response);
};

export const getMyCollections = async (
	params: ICollectionsListParams = {},
): Promise<ICollectionsListResponse> => {
	const response = await requestAuth<ICollectionsListApiResponse>(
		`/collections/mine${getCollectionsQuery(params)}`,
	);

	return normalizeCollectionsList(response);
};

export const getSubscribedCollections = async (
	params: ICollectionsListParams = {},
): Promise<ICollectionsListResponse> => {
	const response = await requestAuth<ICollectionsListApiResponse>(
		`/collections/subscribed${getCollectionsQuery(params)}`,
	);

	return normalizeCollectionsList(response);
};
export const getCollection = (id: string): Promise<ICollectionDetails> =>
	requestOptionalAuth<ICollectionDetails>(`/collections/${id}`);

export const getCollectionTags = ({
	limit,
	search,
}: {
	limit?: number;
	search?: string;
} = {}): Promise<ICollectionTagSuggestion[]> => {
	const searchParams = new URLSearchParams();
	if (search) searchParams.set("search", search);
	if (limit) searchParams.set("limit", String(limit));
	const query = searchParams.toString();

	return request<ICollectionTagSuggestion[]>(
		`/collections/tags${query ? `?${query}` : ""}`,
	);
};

export const createCollection = (
	payload: ICreateCollectionPayload,
): Promise<ICollectionDetails> =>
	requestAuth<ICollectionDetails>("/collections", {
		body: JSON.stringify(payload),
		method: "POST",
	});

export const updateCollection = (
	id: string,
	payload: IUpdateCollectionPayload,
): Promise<ICollectionDetails> =>
	requestAuth<ICollectionDetails>(`/collections/${id}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});

export const deleteCollection = (id: string): Promise<ICollectionDetails> =>
	requestAuth<ICollectionDetails>(`/collections/${id}`, { method: "DELETE" });

export const saveCollection = (id: string): Promise<unknown> =>
	requestAuth(`/collections/${id}/save`, { method: "POST" });

export const unsaveCollection = (id: string): Promise<unknown> =>
	requestAuth(`/collections/${id}/save`, { method: "DELETE" });

export const addBookToCollection = (
	id: string,
	bookId: string,
): Promise<ICollectionDetails> =>
	requestAuth<ICollectionDetails>(`/collections/${id}/books/${bookId}`, {
		method: "POST",
	});

export const removeBookFromCollection = (
	id: string,
	bookId: string,
): Promise<ICollectionDetails> =>
	requestAuth<ICollectionDetails>(`/collections/${id}/books/${bookId}`, {
		method: "DELETE",
	});
