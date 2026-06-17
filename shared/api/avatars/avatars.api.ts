import { API_BASE_URL, request } from "../base";
import type { IAvatar } from "./avatars.types";

type IAvatarsResponse = IAvatar[] | { avatars?: unknown };

const normalizeAvatars = (response: IAvatarsResponse): IAvatar[] => {
	const list = Array.isArray(response) ? response : response.avatars;
	if (!Array.isArray(list)) return [];

	return list.flatMap((avatar) => {
		if (!avatar || typeof avatar !== "object") return [];
		const candidate = avatar as { id?: unknown; url?: unknown };
		if (typeof candidate.id !== "string" || typeof candidate.url !== "string") {
			return [];
		}
		return [{ id: candidate.id, url: candidate.url }];
	});
};

export const getAvatarAssetUrl = (url?: string): string | undefined => {
	if (!url) return undefined;
	if (/^https?:\/\//i.test(url)) return url;
	return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

export const getAvatars = async (): Promise<IAvatar[]> => {
	const response = await request<IAvatarsResponse>("/avatars/options");
	return normalizeAvatars(response);
};
