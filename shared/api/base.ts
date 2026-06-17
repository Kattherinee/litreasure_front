import {
	cacheApiResponse,
	isOfflineError,
	readCachedApiResponse,
	shouldCacheApiPath,
} from "@/shared/pwa/offlineStorage";

const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL ?? "https://litreasure-back.fly.dev";
const AUTH_STORAGE_KEY = "litreasure-auth";

export { API_BASE_URL };

export const getStoredAccessToken = (): string | null => {
	if (typeof window === "undefined") return null;
	try {
		const rawAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);
		if (!rawAuth) return null;
		const parsed = JSON.parse(rawAuth) as {
			state?: { session?: { accessToken?: unknown } };
		};
		const token = parsed.state?.session?.accessToken;
		return typeof token === "string" && token.trim() ? token : null;
	} catch {
		return null;
	}
};

const handleResponse = async <T>(response: Response): Promise<T> => {
	if (!response.ok) {
		let message: string;
		try {
			const body = (await response.json()) as {
				message?: unknown;
				error?: unknown;
			};
			message =
				typeof body.message === "string"
					? body.message
					: typeof body.error === "string"
						? body.error
						: `Request failed: ${response.status}`;
		} catch {
			message = (await response.text()) || `Request failed: ${response.status}`;
		}
		throw new Error(message);
	}
	if (response.status === 204) return undefined as T;
	return response.json() as Promise<T>;
};

const buildHeaders = (options: RequestInit, authHeader?: string): Headers => {
	const headers = new Headers(options.headers);
	const hasBody = typeof options.body !== "undefined";
	const isFormData =
		typeof FormData !== "undefined" && options.body instanceof FormData;

	if (hasBody && !isFormData && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}

	if (authHeader) {
		headers.set("Authorization", authHeader);
	}

	return headers;
};

/** Public request — no Authorization header. */
export const request = async <T>(
	path: string,
	options: RequestInit = {},
): Promise<T> => {
	try {
		const response = await fetch(`${API_BASE_URL}${path}`, {
			...options,
			headers: buildHeaders(options),
		});
		const data = await handleResponse<T>(response);

		if (!options.method || options.method === "GET") {
			await cacheApiResponse(path, data);
		}

		return data;
	} catch (error) {
		if (isOfflineError(error) && shouldCacheApiPath(path)) {
			const cached = await readCachedApiResponse<T>(path);
			if (cached) return cached;
		}

		throw error;
	}
};

/** Public request that attaches Authorization only when a token exists. */
export const requestOptionalAuth = async <T>(
	path: string,
	options: RequestInit = {},
): Promise<T> => {
	const token = getStoredAccessToken();
	try {
		const response = await fetch(`${API_BASE_URL}${path}`, {
			...options,
			headers: buildHeaders(options, token ? `Bearer ${token}` : undefined),
		});
		const data = await handleResponse<T>(response);

		if (!options.method || options.method === "GET") {
			await cacheApiResponse(path, data);
		}

		return data;
	} catch (error) {
		if (isOfflineError(error) && shouldCacheApiPath(path)) {
			const cached = await readCachedApiResponse<T>(path);
			if (cached) return cached;
		}

		throw error;
	}
};

/**
 * Authenticated request — always attaches the Bearer token.
 * Throws if no token is stored.
 */
export const requestAuth = async <T>(
	path: string,
	options: RequestInit = {},
): Promise<T> => {
	const token = getStoredAccessToken();
	if (!token) throw new Error("Authorization is required");
	try {
		const response = await fetch(`${API_BASE_URL}${path}`, {
			...options,
			headers: buildHeaders(options, `Bearer ${token}`),
		});
		const data = await handleResponse<T>(response);

		if (!options.method || options.method === "GET") {
			await cacheApiResponse(path, data);
		}

		return data;
	} catch (error) {
		if (isOfflineError(error) && shouldCacheApiPath(path)) {
			const cached = await readCachedApiResponse<T>(path);
			if (cached) return cached;
		}

		throw error;
	}
};
