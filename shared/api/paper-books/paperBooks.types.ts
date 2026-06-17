import type { IPaperBookStatus } from "../books";

export type { IPaperBookStatus };

export interface IPaperBookPreview {
	id: string;
	title: string;
	author: string;
	coverUrl?: string;
}

export interface IPaperBookState {
	id: string;
	status: IPaperBookStatus;
	note?: string | null;
	book: IPaperBookPreview;
	updatedAt: string;
}

export interface IPaperBooksParams {
	limit?: number;
	page?: number;
	status?: IPaperBookStatus;
}

export interface IPaperBooksResponse {
	items: IPaperBookState[];
	total: number;
	page: number;
	limit: number;
	pages: number;
}

export interface IUpsertPaperBookPayload {
	status?: IPaperBookStatus;
	note?: string | null;
}

export type IPaperBookStatusCounts = Record<IPaperBookStatus | "total", number>;
