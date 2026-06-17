import type { IGenre } from "../genres/genres.types";

export interface ICollectionBookCard {
	id: string;
	title: string;
	author: string;
	coverUrl?: string;
	seriesTitle?: string;
	orderInSeries?: number;
}

export interface ICollectionTagSuggestion {
	label: string;
	source: "default" | "user";
	usageCount: number;
}

export interface ICollectionOwner {
	id: string;
	name: string;
	username?: string;
	avatarUrl?: string;
}

export type ICollectionSource = "open_library" | "user";
export type ICollectionFilterMode = "all" | "any";
export type ICollectionSort =
	| "books_asc"
	| "books_desc"
	| "newest"
	| "oldest"
	| "popular";

export interface ICollectionPreview {
	id: string;
	title: string;
	description: string;
	coverUrl?: string;
	tags?: string[];
	isPublic: boolean;
	isSaved?: boolean;
	topGenres: IGenre[];
	owner: ICollectionOwner;
	bookCount: number;
	subscriberCount: number;
	previewBooks: ICollectionBookCard[];
	source: ICollectionSource;
	sourceUrl?: string;
	createdAt: string;
	updatedAt: string;
}

export interface IBookCollectionPreview {
	id: string;
	title: string;
	description: string;
	isPublic: boolean;
	isSaved?: boolean;
	owner: ICollectionOwner;
	bookCount: number;
	subscriberCount: number;
	source: ICollectionSource;
	sourceUrl?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ICollectionsListParams {
	genreMode?: ICollectionFilterMode;
	genres?: string[];
	sort?: ICollectionSort;
	tagMode?: ICollectionFilterMode;
	tags?: string;
	page?: number;
	limit?: number;
}

export interface ICollectionsListResponse {
	items: ICollectionPreview[];
	total: number;
	page: number;
	limit: number;
	pages: number;
}

export interface ICollectionDetails extends ICollectionPreview {
	books: ICollectionBookCard[];
}

export interface ICreateCollectionPayload {
	title: string;
	description?: string;
	coverUrl?: string;
	tags?: string[];
	isPublic?: boolean;
	bookIds?: string[];
}

export type IUpdateCollectionPayload = Partial<ICreateCollectionPayload>;
