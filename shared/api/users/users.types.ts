import type { IGenre } from "../genres";

export interface IAddUserGenrePayload {
	genreId: string;
}

export interface IUpdateUserGenresPayload {
	genreIds: string[];
}

export type IUserGenre = Pick<IGenre, "id" | "name" | "slug">;

export interface IUpdateUserProfilePayload {
	email?: string;
	name?: string;
	username?: string;
	avatarUrl?: string;
}

export interface IUpdateUserPasswordPayload {
	newPassword: string;
}
