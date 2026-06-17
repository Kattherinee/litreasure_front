"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authorsQueryKeys } from "../authors";
import { booksQueryKeys } from "../books";
import {
	deleteSeries,
	createSeries,
	getPublicSeries,
	getMySeries,
	getSeriesDetails,
	saveSeries,
	unsaveSeries,
	type ICreateSeriesPayload,
	type ISeriesListParams,
	type IUpdateSeriesPayload,
	updateSeries,
} from "./series.api";

export const seriesQueryKeys = {
	all: ["series"] as const,
	byId: (id: string) => ["series", id] as const,
	mine: (params: ISeriesListParams = {}) => ["series", "mine", params] as const,
	public: (params: ISeriesListParams = {}) =>
		["series", "public", params] as const,
};

export const usePublicSeriesQuery = (
	params: ISeriesListParams = {},
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: options?.enabled ?? true,
		queryFn: () => getPublicSeries(params),
		queryKey: seriesQueryKeys.public(params),
	});

export const useMySeriesQuery = (
	params: ISeriesListParams = {},
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: options?.enabled ?? true,
		queryFn: () => getMySeries(params),
		queryKey: seriesQueryKeys.mine(params),
	});

export const useSeriesQuery = (id: string, options?: { enabled?: boolean }) =>
	useQuery({
		enabled: Boolean(id) && (options?.enabled ?? true),
		queryFn: () => getSeriesDetails(id),
		queryKey: seriesQueryKeys.byId(id),
	});

export const useCreateSeriesMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: ICreateSeriesPayload) => createSeries(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: seriesQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: ["series", "mine"] });
			queryClient.invalidateQueries({ queryKey: ["books"] });
			queryClient.invalidateQueries({ queryKey: ["authors"] });
		},
	});
};

export const useUpdateSeriesMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: IUpdateSeriesPayload;
		}) => updateSeries(id, payload),
		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({ queryKey: seriesQueryKeys.byId(id) });
			queryClient.invalidateQueries({ queryKey: seriesQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: ["series", "mine"] });
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: authorsQueryKeys.all });
		},
	});
};

export const useDeleteSeriesMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteSeries(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: seriesQueryKeys.byId(id) });
			queryClient.invalidateQueries({ queryKey: seriesQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: ["series", "mine"] });
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: authorsQueryKeys.all });
		},
	});
};

export const useSaveSeriesMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => saveSeries(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: seriesQueryKeys.byId(id) });
			queryClient.invalidateQueries({ queryKey: seriesQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: ["series", "mine"] });
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: authorsQueryKeys.all });
		},
	});
};

export const useUnsaveSeriesMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => unsaveSeries(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: seriesQueryKeys.byId(id) });
			queryClient.invalidateQueries({ queryKey: seriesQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: ["series", "mine"] });
			queryClient.invalidateQueries({ queryKey: booksQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: authorsQueryKeys.all });
		},
	});
};
