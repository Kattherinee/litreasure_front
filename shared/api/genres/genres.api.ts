import { request, requestAuth, requestOptionalAuth } from "../base";
import type {
	ICreateGenrePayload,
	IGenre,
	IGenresByCategoryResponse,
	IUpdateGenrePayload,
} from "./genres.types";

export const getGenres = (): Promise<IGenre[]> => request<IGenre[]>("/genres");

interface IGenresByCategoryParams {
	includeCounts?: boolean;
	selected?: string[];
}

export const getGenresByCategory = ({
	includeCounts,
	selected,
}: IGenresByCategoryParams = {}): Promise<IGenresByCategoryResponse> => {
	const searchParams = new URLSearchParams();

	if (includeCounts) {
		searchParams.set("includeCounts", "true");
	}

	const selectedGenres = selected?.filter(Boolean);
	if (selectedGenres?.length) {
		searchParams.set("selected", selectedGenres.join(","));
	}

	const query = searchParams.toString();

	return requestOptionalAuth<IGenresByCategoryResponse>(
		`/genres/byCategory${query ? `?${query}` : ""}`,
	);
};

export const saveGenre = (userId: string, genreId: string): Promise<unknown> =>
	requestAuth(`/users/${userId}/genres`, {
		body: JSON.stringify({ genreId }),
		method: "POST",
	});

export const createGenre = (payload: ICreateGenrePayload): Promise<IGenre> =>
	requestAuth<IGenre>("/genres", {
		body: JSON.stringify(payload),
		method: "POST",
	});

export const updateGenre = (
	id: string,
	payload: IUpdateGenrePayload,
): Promise<IGenre> =>
	requestAuth<IGenre>(`/genres/${id}`, {
		body: JSON.stringify(payload),
		method: "PATCH",
	});

export const deleteGenre = (id: string): Promise<IGenre> =>
	requestAuth<IGenre>(`/genres/${id}`, { method: "DELETE" });
