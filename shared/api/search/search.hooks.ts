"use client";

import { useQuery } from "@tanstack/react-query";

import {
	searchAll,
	searchAuthors,
	searchBooks,
	searchCollections,
	searchGenres,
	searchSeries,
} from "./search.api";
import type {
	ISearchAllResponse,
	ISearchAuthor,
	ISearchBook,
	ISearchCollection,
	ISearchGenre,
	ISearchSeries,
	ISearchTabResponse,
} from "./search.types";

export const searchQueryKeys = {
	all: ["search"] as const,
	allSections: (query: string, limit: number) =>
		["search", "all", query, limit] as const,
	authors: (query: string, page: number, limit: number) =>
		["search", "authors", query, page, limit] as const,
	books: (query: string, page: number, limit: number) =>
		["search", "books", query, page, limit] as const,
	collections: (query: string, page: number, limit: number) =>
		["search", "collections", query, page, limit] as const,
	genres: (query: string, page: number, limit: number) =>
		["search", "genres", query, page, limit] as const,
	series: (query: string, page: number, limit: number, genreIds?: string[]) =>
		[
			"search",
			"series",
			query,
			page,
			limit,
			genreIds?.join(",") ?? "",
		] as const,
};

export const useSearchAllQuery = (
	query: string,
	limit: number,
	options?: { enabled?: boolean },
) =>
	useQuery<ISearchAllResponse>({
		enabled: options?.enabled,
		queryFn: () => searchAll(query, limit),
		queryKey: searchQueryKeys.allSections(query, limit),
	});

export const useSearchBooksQuery = (
	query: string,
	page: number,
	limit: number,
	options?: { enabled?: boolean },
) =>
	useQuery<ISearchTabResponse<ISearchBook>>({
		enabled: options?.enabled,
		queryFn: () => searchBooks(query, page, limit),
		queryKey: searchQueryKeys.books(query, page, limit),
	});

export const useSearchAuthorsQuery = (
	query: string,
	page: number,
	limit: number,
	options?: { enabled?: boolean },
) =>
	useQuery<ISearchTabResponse<ISearchAuthor>>({
		enabled: options?.enabled,
		queryFn: () => searchAuthors(query, page, limit),
		queryKey: searchQueryKeys.authors(query, page, limit),
	});

export const useSearchSeriesQuery = (
	query: string,
	page: number,
	limit: number,
	genreIdsOrOptions?: string[] | { enabled?: boolean },
	options?: { enabled?: boolean },
) => {
	const genreIds = Array.isArray(genreIdsOrOptions)
		? genreIdsOrOptions
		: undefined;
	const resolvedOptions = Array.isArray(genreIdsOrOptions)
		? options
		: (genreIdsOrOptions ?? options);

	return useQuery<ISearchTabResponse<ISearchSeries>>({
		enabled: resolvedOptions?.enabled,
		queryFn: () => searchSeries(query, page, limit, genreIds),
		queryKey: searchQueryKeys.series(query, page, limit, genreIds),
	});
};

export const useSearchGenresQuery = (
	query: string,
	page: number,
	limit: number,
	options?: { enabled?: boolean },
) =>
	useQuery<ISearchTabResponse<ISearchGenre>>({
		enabled: options?.enabled,
		queryFn: () => searchGenres(query, page, limit),
		queryKey: searchQueryKeys.genres(query, page, limit),
	});

export const useSearchCollectionsQuery = (
	query: string,
	page: number,
	limit: number,
	options?: { enabled?: boolean },
) =>
	useQuery<ISearchTabResponse<ISearchCollection>>({
		enabled: options?.enabled,
		queryFn: () => searchCollections(query, page, limit),
		queryKey: searchQueryKeys.collections(query, page, limit),
	});
