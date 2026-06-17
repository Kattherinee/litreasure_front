import { requestAuth } from "../base";
import type {
	IAddUserGenrePayload,
	IUpdateUserGenresPayload,
	IUpdateUserPasswordPayload,
	IUpdateUserProfilePayload,
	IUserGenre,
} from "./users.types";

export const getUserGenres = (userId: string): Promise<IUserGenre[]> =>
	requestAuth<IUserGenre[]>(`/users/${userId}/genres`);

export const addUserGenre = (
	userId: string,
	payload: IAddUserGenrePayload,
): Promise<void> =>
	requestAuth<void>(`/users/${userId}/genres`, {
		body: JSON.stringify(payload),
		method: "POST",
	});

export const updateUserGenres = (
	userId: string,
	payload: IUpdateUserGenresPayload,
): Promise<void> =>
	requestAuth<void>(`/users/${userId}/genres`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});

export const updateUserProfile = (
	userId: string,
	payload: IUpdateUserProfilePayload,
): Promise<void> =>
	requestAuth<void>(`/users/${userId}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});

export const updateUserPassword = (
	userId: string,
	payload: IUpdateUserPasswordPayload,
): Promise<void> =>
	requestAuth<void>(`/users/${userId}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});

export const deleteUserAccount = (userId: string): Promise<void> =>
	requestAuth<void>(`/users/${userId}`, {
		method: "DELETE",
	});
