export interface IRegisterPayload {
	email: string;
	password: string;
}

export interface ILoginPayload {
	email: string;
	password: string;
}

export interface IRawAuthResponse {
	accessToken?: unknown;
	avatarUrl?: unknown;
	email?: unknown;
	id?: unknown;
	name?: unknown;
	refreshToken?: unknown;
	token?: unknown;
	user?: unknown;
	username?: unknown;
}
