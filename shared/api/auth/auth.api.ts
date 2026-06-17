import type { IAuthSession, IAuthUser } from "@/shared/store/auth-store";

import { request } from "../base";
import type {
	ILoginPayload,
	IRawAuthResponse,
	IRegisterPayload,
} from "./auth.types";

const normalizeUser = (source: unknown, fallbackEmail: string): IAuthUser => {
	const user =
		source && typeof source === "object" ? (source as IRawAuthResponse) : {};

	return {
		id: typeof user.id === "string" ? user.id : undefined,
		email: typeof user.email === "string" ? user.email : fallbackEmail,
		name: typeof user.name === "string" ? user.name : undefined,
		username: typeof user.username === "string" ? user.username : undefined,
		avatarUrl: typeof user.avatarUrl === "string" ? user.avatarUrl : undefined,
	};
};

const normalizeAuthResponse = (
	response: IRawAuthResponse,
	fallbackEmail: string,
): IAuthSession => {
	const rawUser = response.user ?? response;
	const user = normalizeUser(rawUser, fallbackEmail);
	const accessToken =
		typeof response.accessToken === "string"
			? response.accessToken
			: typeof response.token === "string"
				? response.token
				: undefined;

	return {
		accessToken,
		refreshToken:
			typeof response.refreshToken === "string"
				? response.refreshToken
				: undefined,
		user,
	};
};

export const register = async (
	payload: IRegisterPayload,
): Promise<IAuthSession> => {
	const response = await request<IRawAuthResponse>("/auth/register", {
		body: JSON.stringify(payload),
		method: "POST",
	});
	return normalizeAuthResponse(response, payload.email);
};

export const login = async (payload: ILoginPayload): Promise<IAuthSession> => {
	const response = await request<IRawAuthResponse>("/auth/login", {
		body: JSON.stringify(payload),
		method: "POST",
	});
	return normalizeAuthResponse(response, payload.email);
};

export const checkUsernameAvailability = async (
	username: string,
): Promise<boolean> => {
	try {
		const result = await request<{ available?: boolean }>(
			`/users/check-username?username=${encodeURIComponent(username)}`,
		);
		return result.available !== false;
	} catch {
		return true;
	}
};
