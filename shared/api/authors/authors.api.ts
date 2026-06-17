import { requestAuth, requestOptionalAuth } from "../base";
import type {
	IAuthorDetails,
	IAuthorDetailsParams,
	IAuthorsListParams,
	IAuthorsListResponse,
	ICreateAuthorPayload,
	IUpdateAuthorPayload,
} from "./authors.types";

const normalizeAuthorsList = (
	response: IAuthorsListResponse | IAuthorsListResponse["items"],
	params: IAuthorsListParams = {},
): IAuthorsListResponse => {
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

const getAuthorsQuery = (params: IAuthorsListParams = {}) => {
	const searchParams = new URLSearchParams();

	appendSearchParam(searchParams, "genreMode", params.genreMode);
	appendSearchParam(
		searchParams,
		"genres",
		params.genres?.length ? params.genres.join(",") : undefined,
	);
	appendSearchParam(searchParams, "limit", params.limit);
	appendSearchParam(searchParams, "maxBooks", params.maxBooks);
	appendSearchParam(searchParams, "minBooks", params.minBooks);
	appendSearchParam(searchParams, "page", params.page);
	appendSearchParam(searchParams, "sort", params.sort);

	const query = searchParams.toString();

	return query ? `?${query}` : "";
};

const getAuthorDetailsQuery = (params: IAuthorDetailsParams = {}) => {
	const searchParams = new URLSearchParams();

	appendSearchParam(searchParams, "bookSort", params.bookSort);

	const query = searchParams.toString();

	return query ? `?${query}` : "";
};

const appendSearchParam = (
	searchParams: URLSearchParams,
	key: string,
	value?: number | string | null,
) => {
	if (value === undefined || value === null) {
		return;
	}

	if (typeof value === "number") {
		if (!Number.isFinite(value) || value === 0) {
			return;
		}
	}

	const stringValue = String(value).trim();

	if (!stringValue) {
		return;
	}

	searchParams.set(key, stringValue);
};

export const getAuthors = async (
	params: IAuthorsListParams = {},
): Promise<IAuthorsListResponse> => {
	const response = await requestOptionalAuth<
		IAuthorsListResponse | IAuthorsListResponse["items"]
	>(`/authors${getAuthorsQuery(params)}`);

	return normalizeAuthorsList(response, params);
};

export const getMyAuthors = async (
	params: IAuthorsListParams = {},
): Promise<IAuthorsListResponse> => {
	const response = await requestAuth<
		IAuthorsListResponse | IAuthorsListResponse["items"]
	>(`/authors/mine${getAuthorsQuery(params)}`);

	return normalizeAuthorsList(response, params);
};

export const getAuthor = (
	id: string,
	params: IAuthorDetailsParams = {},
): Promise<IAuthorDetails> =>
	requestOptionalAuth<IAuthorDetails>(
		`/authors/${id}${getAuthorDetailsQuery(params)}`,
	);

export const createAuthor = (
	payload: ICreateAuthorPayload,
): Promise<IAuthorDetails> =>
	requestAuth<IAuthorDetails>("/authors", {
		body: JSON.stringify(payload),
		method: "POST",
	});

export const updateAuthor = (
	id: string,
	payload: IUpdateAuthorPayload,
): Promise<IAuthorDetails> =>
	requestAuth<IAuthorDetails>(`/authors/${id}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});

export const deleteAuthor = (id: string): Promise<IAuthorDetails> =>
	requestAuth<IAuthorDetails>(`/authors/${id}`, { method: "DELETE" });

export const saveAuthor = (id: string): Promise<unknown> =>
	requestAuth(`/authors/${id}/save`, { method: "POST" });

export const unsaveAuthor = (id: string): Promise<unknown> =>
	requestAuth(`/authors/${id}/save`, { method: "DELETE" });
