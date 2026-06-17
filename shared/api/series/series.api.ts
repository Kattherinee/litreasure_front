import { requestAuth, requestOptionalAuth } from "../base";

export interface ISeriesPreview {
	id: string;
	title: string;
	openLibrarySeriesKey?: string;
	description?: string;
	coverUrl?: string;
	bookCount?: number;
	authorId?: string;
	authorName?: string;
	authorPhotoUrl?: string;
	isOwned?: boolean;
	isPublic?: boolean;
	isSaved: boolean;
}

export interface ISeriesGenre {
	id: string;
	name: string;
	slug: string;
}

export interface ISeriesBook {
	id: string;
	title: string;
	author: string;
	authorId?: string;
	coverUrl?: string;
	seriesTitle?: string;
	orderInSeries?: number;
	bookCountInSeries?: number;
}

export interface ISeriesDetails extends ISeriesPreview {
	genres: ISeriesGenre[];
	books: ISeriesBook[];
}

export interface ISeriesListParams {
	genre?: string;
	genreIds?: string[];
	page?: number;
	limit?: number;
	sort?: ISeriesSort;
}

export type ISeriesSort = "popular" | "newest" | "title";

export interface ISeriesListResponse {
	items: ISeriesPreview[];
	total: number;
	page: number;
	limit: number;
}

export interface ICreateSeriesPayload {
	authorIds: string[];
	bookIds: string[];
	coverUrl?: string;
	title: string;
}

export type IUpdateSeriesPayload = Partial<ICreateSeriesPayload>;

const getSeriesQuery = (params: ISeriesListParams = {}) => {
	const query = new URLSearchParams();

	if (params.genre) query.set("genre", params.genre);
	if (params.genreIds?.length) query.set("genreIds", params.genreIds.join(","));
	if (params.page && params.page > 1) query.set("page", String(params.page));
	if (params.limit && params.limit > 0)
		query.set("limit", String(params.limit));
	if (params.sort) query.set("sort", params.sort);

	const queryString = query.toString();
	return queryString ? `?${queryString}` : "";
};

export const getMySeries = (
	params: ISeriesListParams = {},
): Promise<ISeriesListResponse> =>
	requestAuth<ISeriesListResponse>(`/series/mine${getSeriesQuery(params)}`);

export const getPublicSeries = (
	params: ISeriesListParams = {},
): Promise<ISeriesListResponse> =>
	requestOptionalAuth<ISeriesListResponse>(`/series${getSeriesQuery(params)}`);

export const getSeriesDetails = (id: string): Promise<ISeriesDetails> =>
	requestOptionalAuth<ISeriesDetails>(`/series/${id}`);

export const createSeries = (
	payload: ICreateSeriesPayload,
): Promise<ISeriesDetails> =>
	requestAuth<ISeriesDetails>("/series", {
		body: JSON.stringify(payload),
		method: "POST",
	});

export const updateSeries = (
	id: string,
	payload: IUpdateSeriesPayload,
): Promise<ISeriesDetails> =>
	requestAuth<ISeriesDetails>(`/series/${id}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});

export const deleteSeries = (id: string): Promise<ISeriesDetails> =>
	requestAuth<ISeriesDetails>(`/series/${id}`, { method: "DELETE" });

export const saveSeries = (id: string): Promise<unknown> =>
	requestAuth(`/series/${id}/save`, { method: "POST" });

export const unsaveSeries = (id: string): Promise<unknown> =>
	requestAuth(`/series/${id}/save`, { method: "DELETE" });
