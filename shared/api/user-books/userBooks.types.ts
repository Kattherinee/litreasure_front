export type IUserBookStatus =
	| "planned"
	| "reading"
	| "finished"
	| "dropped"
	| "paused"
	| "rereading";

export interface IUserBook {
	id: string;
	userId: string;
	bookId: string;
	status: IUserBookStatus;
	currentPage?: number;
	startedAt?: string;
	finishedAt?: string;
	updatedAt: string;
	readCount: number;
	isRereading: boolean;
}

export interface ITrackingBookCard {
	id: string;
	title: string;
	author: string;
	coverUrl?: string;
}

export interface IUpdateBookTrackingPayload {
	status: IUserBookStatus;
	currentPage?: number;
	startedAt?: string;
	finishedAt?: string;
	readCount?: number;
	isRereading?: boolean;
}

export interface IUserBookTracking extends Omit<IUserBook, "bookId" | "userId"> {
	book: ITrackingBookCard;
}

export interface IUserBooksParams {
	status?: IUserBookStatus;
	page?: number;
	limit?: number;
}

export interface IUserBooksResponse {
	items: IUserBookTracking[];
	total: number;
	page: number;
	limit: number;
	pages: number;
}

export type IUserBookStatusCounts = Record<IUserBookStatus | "total", number>;
