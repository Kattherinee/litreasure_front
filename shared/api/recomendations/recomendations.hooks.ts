"use client";

import { useQuery } from "@tanstack/react-query";

import {
	getRecomendationsByBook,
	getRecomendationsForYouBooks,
	getRecomendationsHomeSections,
	getRecomendationsByPrompt,
	getRecomendationsWeekBooks,
} from "./recomendations.api";
import type {
	IByBookRecomendationsParams,
	IByPromptRecomendationsParams,
} from "./recomendations.types";
import type { IBookCardsParams } from "../books";

export const recomendationsQueryKeys = {
	byPrompt: (params: IByPromptRecomendationsParams) =>
		["recomendations", "prompt", params] as const,
	byBook: (params: IByBookRecomendationsParams) =>
		["recomendations", "book", params] as const,
	forYouBooks: (params: IBookCardsParams = {}) =>
		["recomendations", "for-you-books", params] as const,
	homeSections: () => ["recomendations", "home-sections"] as const,
	weekBooks: () => ["recomendations", "week-books"] as const,
};

export const useRecomendationsByPromptQuery = (
	params: IByPromptRecomendationsParams,
	options?: { enabled?: boolean },
) => {
	return useQuery({
		enabled: options?.enabled,
		queryFn: () => getRecomendationsByPrompt({ params }),
		queryKey: recomendationsQueryKeys.byPrompt(params),
		refetchOnMount: false,
		staleTime: 5 * 60_000,
	});
};

export const useRecomendationsWeekBooksQuery = (options?: {
	enabled?: boolean;
}) => {
	return useQuery({
		enabled: options?.enabled,
		queryFn: getRecomendationsWeekBooks,
		queryKey: recomendationsQueryKeys.weekBooks(),
		refetchOnMount: false,
		staleTime: 10 * 60_000,
	});
};

export const useRecomendationsByBookQuery = (
	params: IByBookRecomendationsParams,
	options?: { enabled?: boolean },
) => {
	return useQuery({
		enabled: options?.enabled,
		queryFn: () => getRecomendationsByBook({ params }),
		queryKey: recomendationsQueryKeys.byBook(params),
		refetchOnMount: false,
		staleTime: 5 * 60_000,
	});
};

export const useRecomendationsHomeSectionsQuery = (options?: {
	enabled?: boolean;
}) => {
	return useQuery({
		enabled: options?.enabled,
		queryFn: getRecomendationsHomeSections,
		queryKey: recomendationsQueryKeys.homeSections(),
		refetchOnMount: false,
		staleTime: 10 * 60_000,
	});
};

export const useRecomendationsForYouBooksQuery = (
	params: IBookCardsParams = {},
	options?: { enabled?: boolean },
) => {
	return useQuery({
		enabled: options?.enabled,
		queryFn: () => getRecomendationsForYouBooks({ params }),
		queryKey: recomendationsQueryKeys.forYouBooks(params),
		refetchOnMount: false,
		gcTime: 0,
		staleTime: 0,
	});
};
