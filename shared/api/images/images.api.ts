import { API_BASE_URL, getStoredAccessToken } from "../base";
import type { IImageUploadPurpose, IImageUploadResponse } from "./images.types";

const handleUploadResponse = async <T>(response: Response): Promise<T> => {
	if (!response.ok) {
		let message = `Request failed: ${response.status}`;
		try {
			const body = (await response.json()) as {
				error?: unknown;
				message?: unknown;
			};
			message =
				typeof body.message === "string"
					? body.message
					: typeof body.error === "string"
						? body.error
						: message;
		} catch {
			message = (await response.text()) || message;
		}
		throw new Error(message);
	}

	return response.json() as Promise<T>;
};

export const uploadImage = async ({
	file,
	purpose,
}: {
	file: Blob;
	purpose: IImageUploadPurpose;
}): Promise<IImageUploadResponse> => {
	const token = getStoredAccessToken();
	if (!token) throw new Error("Authorization is required");

	const formData = new FormData();
	formData.append("file", file, `${purpose}.webp`);

	const response = await fetch(
		`${API_BASE_URL}/images/upload?purpose=${encodeURIComponent(purpose)}`,
		{
			body: formData,
			headers: {
				Authorization: `Bearer ${token}`,
			},
			method: "POST",
		},
	);

	return handleUploadResponse<IImageUploadResponse>(response);
};
