import { requestAuth } from "../base";
import type {
	IAverageBookChallenge,
	IBookChallenge,
	IChallengePeriodType,
	ICreateBookChallengePayload,
	IUpdateBookChallengePayload,
} from "./bookChallenge.types";

export const createChallenge = (
	payload: ICreateBookChallengePayload,
): Promise<IBookChallenge> =>
	requestAuth<IBookChallenge>("/book-challenge", {
		body: JSON.stringify(payload),
		method: "POST",
	});

export const getChallenges = (): Promise<IBookChallenge[]> =>
	requestAuth<IBookChallenge[]>("/book-challenge");

export const getAverageChallenge = (
	period: IChallengePeriodType,
): Promise<IAverageBookChallenge> => {
	const params = new URLSearchParams({ period });

	return requestAuth<IAverageBookChallenge>(
		`/book-challenge/average?${params.toString()}`,
	);
};

export const getChallengeById = (id: string): Promise<IBookChallenge> =>
	requestAuth<IBookChallenge>(`/book-challenge/${id}`);

export const updateChallenge = (
	id: string,
	payload: IUpdateBookChallengePayload,
): Promise<IBookChallenge> =>
	requestAuth<IBookChallenge>(`/book-challenge/${id}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});

export const deleteChallenge = (id: string): Promise<IBookChallenge> =>
	requestAuth<IBookChallenge>(`/book-challenge/${id}`, { method: "DELETE" });
