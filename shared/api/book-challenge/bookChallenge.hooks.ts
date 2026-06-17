"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
	createChallenge,
	deleteChallenge,
	getAverageChallenge,
	getChallengeById,
	getChallenges,
	updateChallenge,
} from "./bookChallenge.api";
import type {
	IChallengePeriodType,
	ICreateBookChallengePayload,
	IUpdateBookChallengePayload,
} from "./bookChallenge.types";

export const challengeQueryKeys = {
	all: ["book-challenge"] as const,
	average: (period: IChallengePeriodType, refreshKey?: number) =>
		["book-challenge", "average", period, refreshKey] as const,
	byId: (id: string) => ["book-challenge", id] as const,
};

export const useChallengesQuery = (options?: { enabled?: boolean }) =>
	useQuery({
		enabled: options?.enabled ?? true,
		queryFn: getChallenges,
		queryKey: challengeQueryKeys.all,
	});

export const useChallengeByIdQuery = (id: string) =>
	useQuery({
		enabled: Boolean(id),
		queryFn: () => getChallengeById(id),
		queryKey: challengeQueryKeys.byId(id),
	});

export const useAverageChallengeQuery = (
	period: IChallengePeriodType,
	refreshKey?: number,
	options?: { enabled?: boolean },
) =>
	useQuery({
		enabled: options?.enabled ?? true,
		queryFn: () => getAverageChallenge(period),
		queryKey: challengeQueryKeys.average(period, refreshKey),
	});

export const useCreateChallengeMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: ICreateBookChallengePayload) =>
			createChallenge(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: challengeQueryKeys.all });
		},
	});
};

export const useUpdateChallengeMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: IUpdateBookChallengePayload;
		}) => updateChallenge(id, payload),
		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({ queryKey: challengeQueryKeys.byId(id) });
			queryClient.invalidateQueries({ queryKey: challengeQueryKeys.all });
		},
	});
};

export const useDeleteChallengeMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteChallenge(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: challengeQueryKeys.all });
		},
	});
};
