import { IGenre } from "../genres";
import type { IUserBookStatus } from "../user-books";

export interface IBook {
	id: string;
	title: string;
	author: string;
	authors?: IAuthorShort[];
	description?: string;
	coverUrl?: string;
	isbns?: string[];
	pagesCount?: number;
	genres: IGenre[];
	setting: string[];
	publishedYear?: number;
	firstPublishDate?: string;
	publisher?: string;
	rating?: number;
	ratingAvg?: number;
	ratingsCount?: number;
	ratingsByStars: number[];
	language?: string;
	openLibraryWorkKey?: string;
	orderInSeries?: number;
	relationType?: IBookSeriesRelationType;
	searchMatches?: IBookSearchMatch[];
	seriesBookCount?: number;
	seriesLabel?: string;
	seriesRelationType?: IBookSeriesRelationType;
	seriesTitle?: string;

	series?: {
		id?: string;
		title?: string;
		isSaved?: boolean;
		openLibrarySeriesKey?: string;
		seriesId: string;
		orderInSeries?: number;
		relationType?: IBookSeriesRelationType;
		seriesLabel?: string;
		books?: Array<{
			id: string;
			title: string;
			author?: string;
			coverUrl?: string;
			orderInSeries?: number;
			relationType?: IBookSeriesRelationType;
			seriesBookCount?: number;
			seriesLabel?: string;
		}>;
	};
	myTracking?: {
		status: IUserBookStatus;
		currentPage?: number;
		readCount?: number;
	} | null;
	hasPaperBook?: boolean;
	myPaperBook?: {
		id: string;
		status: IPaperBookStatus;
		note?: string | null;
	} | null;
	isTracked?: boolean;
	myStatus?: IUserBookStatus | null;
	myCollectionIds?: string[];
	isPublic?: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface IAuthorShort {
	id: string;
	name: string;
	photoUrl?: string;
}

export interface IBookSearchMatch {
	field: string;
	value: string;
}

export type IBookSeriesRelationType =
	| "collection"
	| "main"
	| "omnibus"
	| "spin_off"
	| "unknown";

export interface ICreateBookPayload {
	title: string;
	authorIds: string[];
	description?: string;
	coverUrl?: string;
	genres: string[];
	pagesCount?: number;
	publishedYear?: number;
	publisher?: string;
	language?: string;
	rating?: number;
}

export type IUpdateBookPayload = Partial<ICreateBookPayload>;

export type IBookSort = "newest" | "popular" | "rating";

export type IBookSearchScope =
	| "authors"
	| "books"
	| "collections"
	| "genres"
	| "publishers"
	| "series";

export interface IBookCardsParams {
	genre?: string;
	genreIds?: string[];
	limit?: number;
	onlyMine?: boolean;
	page?: number;
	search?: string;
	searchScope?: IBookSearchScope;
	sort?: IBookSort;
}

export interface IBookCardsResponse {
	items: IBook[];
	limit: number;
	page: number;
	pages: number;
	total: number;
}

export interface IRateBookPayload {
	rating: number;
}

export interface IRateBookResponse {
	bookId: string;
	userRating: number;
	ratingAvg: number;
	ratingsCount: number;
	ratingsByStars: number[];
}

export type IPaperBookStatus = "given_away" | "owned" | "wanted_to_buy";
