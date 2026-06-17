"use client";

import { useQuery } from "@tanstack/react-query";

import { getAvatars } from "./avatars.api";
import type { IAvatar } from "./avatars.types";

export const useAvatarsQuery = (options?: { enabled?: boolean }) =>
	useQuery<IAvatar[]>({
		enabled: options?.enabled,
		queryFn: getAvatars,
		queryKey: ["avatars"],
	});
