import type { IGenre } from "../genres";

export interface IAuthorBookCard {
	id: string;
	title: string;
	coverUrl?: string;
	publishedYear?: number;
	ratingsCount?: number;
	orderInSeries?: number;
	seriesRelationType?:
		| "collection"
		| "main"
		| "omnibus"
		| "spin_off"
		| "unknown";
	seriesLabel?: string;
}

export interface IAuthorSeries {
	id: string;
	title: string;
	isSaved?: boolean;
	openLibrarySeriesKey?: string;
	books: IAuthorBookCard[];
}

export interface IAuthorPreview {
	id: string;
	name: string;
	bio?: string;
	photoUrl?: string;
	isOwned?: boolean;
	isPublic: boolean;
	isSaved?: boolean;
	bookCount: number;
	mainGenre?: IGenre;
	topGenres?: IGenre[];
}

export interface IAuthorDetails extends IAuthorPreview {
	books: IAuthorBookCard[];
	series: IAuthorSeries[];
}

export interface IAuthorsListParams {
	genreMode?: IAuthorsGenreMode;
	genres?: string[];
	limit?: number;
	maxBooks?: number;
	minBooks?: number;
	page?: number;
	sort?: IAuthorsSort;
}

export interface IAuthorDetailsParams {
	bookSort?: IAuthorBookSort;
}

export type IAuthorsGenreMode = "all" | "any";

export type IAuthorBookSort =
	| "popular"
	| "series_order"
	| "title_asc"
	| "title_desc";

export type IAuthorsSort =
	| "books_asc"
	| "books_desc"
	| "name_asc"
	| "name_desc"
	| "popular";

export interface IAuthorsListResponse {
	items: IAuthorPreview[];
	total: number;
	page: number;
	limit: number;
	pages: number;
}

export interface ICreateAuthorPayload {
	name: string;
	bio?: string;
	photoUrl?: string;
}

export type IUpdateAuthorPayload = Partial<ICreateAuthorPayload>;
