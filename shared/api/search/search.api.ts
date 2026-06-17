import { requestOptionalAuth } from "../base";
import type {
	ISearchAllResponse,
	ISearchAuthor,
	ISearchBook,
	ISearchCollection,
	ISearchGenre,
	ISearchSeries,
	ISearchTabResponse,
} from "./search.types";

const buildSearchQueryString = ({
	genreIds,
	limit,
	page,
	query,
}: {
	genreIds?: string[];
	limit?: number;
	page?: number;
	query: string;
}) => {
	const params = new URLSearchParams({ query });

	if (genreIds?.length) params.set("genreIds", genreIds.join(","));
	if (limit && limit > 0) params.set("limit", String(limit));
	if (page && page > 1) params.set("page", String(page));

	return params.toString();
};

export const searchAll = (
	query: string,
	limit?: number,
): Promise<ISearchAllResponse> =>
	requestOptionalAuth<ISearchAllResponse>(
		`/search/all?${buildSearchQueryString({ limit, query })}`,
	);

export const searchBooks = (
	query: string,
	page = 1,
	limit?: number,
): Promise<ISearchTabResponse<ISearchBook>> =>
	requestOptionalAuth<ISearchTabResponse<ISearchBook>>(
		`/search/books?${buildSearchQueryString({ limit, page, query })}`,
	);

export const searchAuthors = (
	query: string,
	page = 1,
	limit?: number,
): Promise<ISearchTabResponse<ISearchAuthor>> =>
	requestOptionalAuth<ISearchTabResponse<ISearchAuthor>>(
		`/search/authors?${buildSearchQueryString({ limit, page, query })}`,
	);

export const searchSeries = (
	query: string,
	page = 1,
	limit?: number,
	genreIds?: string[],
): Promise<ISearchTabResponse<ISearchSeries>> =>
	requestOptionalAuth<ISearchTabResponse<ISearchSeries>>(
		`/search/series?${buildSearchQueryString({ genreIds, limit, page, query })}`,
	);

export const searchGenres = (
	query: string,
	page = 1,
	limit?: number,
): Promise<ISearchTabResponse<ISearchGenre>> =>
	requestOptionalAuth<ISearchTabResponse<ISearchGenre>>(
		`/search/genres?${buildSearchQueryString({ limit, page, query })}`,
	);

export const searchCollections = (
	query: string,
	page = 1,
	limit?: number,
): Promise<ISearchTabResponse<ISearchCollection>> =>
	requestOptionalAuth<ISearchTabResponse<ISearchCollection>>(
		`/search/collections?${buildSearchQueryString({ limit, page, query })}`,
	);
