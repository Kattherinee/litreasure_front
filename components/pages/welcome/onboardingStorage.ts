"use client";

import type { IAuthUser } from "@/shared/store/auth-store";

const PENDING_KEY = "litreasure-welcome-pending";
const COMPLETED_KEY = "litreasure-welcome-completed";

const getUserKey = (user?: IAuthUser | null) => user?.id ?? user?.email ?? "";

const readList = (key: string) => {
	if (typeof window === "undefined") return [];

	try {
		const value = window.localStorage.getItem(key);
		const parsed = value ? JSON.parse(value) : [];
		return Array.isArray(parsed)
			? parsed.filter((item): item is string => typeof item === "string")
			: [];
	} catch {
		return [];
	}
};

const writeList = (key: string, values: string[]) => {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(key, JSON.stringify(Array.from(new Set(values))));
};

const addUserKey = (storageKey: string, user: IAuthUser) => {
	const userKey = getUserKey(user);
	if (!userKey) return;
	writeList(storageKey, [...readList(storageKey), userKey]);
};

const removeUserKey = (storageKey: string, user: IAuthUser) => {
	const userKey = getUserKey(user);
	if (!userKey) return;
	writeList(
		storageKey,
		readList(storageKey).filter((item) => item !== userKey),
	);
};

const hasUserKey = (storageKey: string, user?: IAuthUser | null) => {
	const userKey = getUserKey(user);
	return Boolean(userKey && readList(storageKey).includes(userKey));
};

export const markWelcomeOnboardingPending = (user: IAuthUser) => {
	addUserKey(PENDING_KEY, user);
};

export const clearWelcomeOnboardingPending = (user: IAuthUser) => {
	removeUserKey(PENDING_KEY, user);
};

export const markWelcomeOnboardingCompleted = (user: IAuthUser) => {
	addUserKey(COMPLETED_KEY, user);
	clearWelcomeOnboardingPending(user);
};

export const canOpenWelcomeOnboarding = (user?: IAuthUser | null) =>
	hasUserKey(PENDING_KEY, user) && !hasUserKey(COMPLETED_KEY, user);
