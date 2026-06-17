import type {
	IAuthorShort,
	IBookSeriesRelationType,
	IBookSort,
} from "../books";
import type { IUserBookStatus } from "../user-books";

export interface IByPromptRecomendationsParams {
	prompt: string;
	limit?: number;
}

export interface IByBookRecomendationsParams {
	bookId: string;
	limit?: number;
}

export type IHomeSectionEntity = "books" | "collections" | "authors" | "series";

export interface IHomeSectionQuery {
	genre?: string;
	genres?: string[];
	genreIds?: string[];
	limit?: number;
	page?: number;
	sort?: IBookSort;
}

export interface IHomeSection {
	entity: IHomeSectionEntity;
	endpoint: string;
	key: string;
	query: IHomeSectionQuery;
	title: string;
}

export interface IWeekBookRecomendation {
	id: string;
	title: string;
	author?: string;
	authors?: IAuthorShort[];
	searchMatches?: Array<{ field: string; value: string }>;
	coverUrl?: string;
	description?: string;
	relationType?: IBookSeriesRelationType | null;
	seriesLabel?: string | null;
	seriesTitle?: string | null;
	orderInSeries?: number | null;
	bookCountInSeries?: number | null;
}

export interface IBookRecomendation {
	id: string;
	title: string;
	author?: string;
	authors?: IAuthorShort[];
	authorId?: string;
	coverUrl?: string;
	description?: string;
	searchMatches?: Array<{ field: string; value: string }>;
	publisher?: string;
	isTracked?: boolean;
	myStatus?: IUserBookStatus | null;
	relationType?: IBookSeriesRelationType;
	seriesLabel?: string;
	seriesTitle?: string;
	orderInSeries?: number;
	bookCountInSeries?: number;
}
