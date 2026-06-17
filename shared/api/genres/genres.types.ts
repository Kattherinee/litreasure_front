export interface IGenre {
	id: string;
	name: string;
	slug: string;
	bookCount?: number;
	category?: string;
	subcategory?: string;
	group?: string;
	isSaved?: boolean;
	isPublic?: boolean;
}

export interface IGenreGroup {
	key: string;
	name: string;
	category: string;
	bookCount: number;
	genres: IGenre[];
}

export interface IGenresByCategoryResponse {
	groups: IGenreGroup[];
	recommendations: IGenre[];
}

export interface ICreateGenrePayload {
	name: string;
	category?: string;
	subcategory?: string;
	isPublic?: boolean;
}

export type IUpdateGenrePayload = Partial<ICreateGenrePayload>;
