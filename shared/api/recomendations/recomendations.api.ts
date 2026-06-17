import { requestOptionalAuth } from "../base";
import type { IBookCardsParams, IBookCardsResponse } from "../books";
import type {
	IByBookRecomendationsParams,
	IByPromptRecomendationsParams,
	IBookRecomendation,
	IHomeSection,
	IWeekBookRecomendation,
} from "./recomendations.types";

const getBookCardsLikeQuery = (params: IBookCardsParams = {}) => {
	const searchParams = new URLSearchParams();

	if (params.genre) searchParams.set("genre", params.genre);
	if (params.genreIds?.length)
		searchParams.set("genreIds", params.genreIds.join(","));
	if (params.limit) searchParams.set("limit", String(params.limit));
	if (params.page) searchParams.set("page", String(params.page));
	if (params.search) searchParams.set("search", params.search);
	if (params.searchScope) searchParams.set("searchScope", params.searchScope);
	if (params.sort) searchParams.set("sort", params.sort);

	const query = searchParams.toString();

	return query ? `?${query}` : "";
};

export const getRecomendationsByPrompt = async ({
	params,
}: {
	params: IByPromptRecomendationsParams;
}): Promise<IBookRecomendation[]> => {
	const response = await requestOptionalAuth<IBookRecomendation[]>(
		`/recommendations/prompt`,
		{
			body: JSON.stringify(params),
			method: "POST",
		},
	);

	return response;
};

export const getRecomendationsWeekBooks = (): Promise<
	IWeekBookRecomendation[]
> =>
	requestOptionalAuth<IWeekBookRecomendation[]>("/recommendations/week-books");

export const getRecomendationsHomeSections = (): Promise<IHomeSection[]> =>
	requestOptionalAuth<IHomeSection[]>("/recommendations/home-sections");

export const getRecomendationsForYouBooks = ({
	params,
}: {
	params?: IBookCardsParams;
} = {}): Promise<IBookCardsResponse> =>
	requestOptionalAuth<IBookCardsResponse>(
		`/recommendations/for-you-books${getBookCardsLikeQuery(params)}`,
	);

export const getRecomendationsByBook = async ({
	params,
}: {
	params: IByBookRecomendationsParams;
}): Promise<IBookRecomendation[]> => {
	const response = await requestOptionalAuth<IBookRecomendation[]>(
		`/recommendations/book`,
		{
			body: JSON.stringify(params),
			method: "POST",
		},
	);

	return response;
};
