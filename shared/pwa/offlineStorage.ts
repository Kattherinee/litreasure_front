import type { IBook } from "@/shared/api/books";
import type {
	IUserBooksParams,
	IUserBooksResponse,
	IUserBookTracking,
} from "@/shared/api/user-books";

const DB_NAME = "litreasure-offline";
const DB_VERSION = 1;
const API_CACHE_STORE = "api-cache";
const USER_LIBRARY_STORE = "user-library";
const BOOK_STORE = "books";
const MUTATION_QUEUE_STORE = "mutation-queue";
const CACHE_TTL = 1000 * 60 * 60 * 24 * 14;

type StoreName =
	| typeof API_CACHE_STORE
	| typeof USER_LIBRARY_STORE
	| typeof BOOK_STORE
	| typeof MUTATION_QUEUE_STORE;

interface IApiCacheEntry<T> {
	key: string;
	data: T;
	updatedAt: number;
}

interface IQueuedMutation {
	id: string;
	body?: string;
	method: string;
	path: string;
	queuedAt: number;
}

const canUseIndexedDB = () =>
	typeof window !== "undefined" && "indexedDB" in window;

const openOfflineDb = (): Promise<IDBDatabase> =>
	new Promise((resolve, reject) => {
		if (!canUseIndexedDB()) {
			reject(new Error("IndexedDB is not available"));
			return;
		}

		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;

			for (const storeName of [
				API_CACHE_STORE,
				USER_LIBRARY_STORE,
				BOOK_STORE,
				MUTATION_QUEUE_STORE,
			]) {
				if (!db.objectStoreNames.contains(storeName)) {
					db.createObjectStore(storeName, { keyPath: "key" });
				}
			}
		};

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
	});

const withStore = async <T>(
	storeName: StoreName,
	mode: IDBTransactionMode,
	callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
	const db = await openOfflineDb();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, mode);
		const store = transaction.objectStore(storeName);
		const request = callback(store);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
		transaction.oncomplete = () => db.close();
		transaction.onerror = () => {
			db.close();
			reject(transaction.error);
		};
	});
};

const getCacheKey = (path: string) => path;

export const isOfflineError = (error: unknown) =>
	error instanceof TypeError ||
	(typeof navigator !== "undefined" && navigator.onLine === false);

export const shouldCacheApiPath = (path: string) =>
	path.startsWith("/books") || path.startsWith("/user-books");

export const cacheApiResponse = async <T>(
	path: string,
	data: T,
): Promise<void> => {
	if (!canUseIndexedDB() || !shouldCacheApiPath(path)) return;

	const entry: IApiCacheEntry<T> = {
		data,
		key: getCacheKey(path),
		updatedAt: Date.now(),
	};

	await withStore(API_CACHE_STORE, "readwrite", (store) => store.put(entry));

	if (path.startsWith("/books/") && !path.includes("/collections")) {
		const book = data as IBook;
		if (book?.id) {
			await withStore(BOOK_STORE, "readwrite", (store) =>
				store.put({ ...entry, key: book.id }),
			);
		}
	}

	if (path.startsWith("/user-books")) {
		await withStore(USER_LIBRARY_STORE, "readwrite", (store) =>
			store.put(entry),
		);
	}
};

export const readCachedApiResponse = async <T>(
	path: string,
): Promise<T | null> => {
	if (!canUseIndexedDB()) return null;

	try {
		const entry = await withStore<IApiCacheEntry<T> | undefined>(
			API_CACHE_STORE,
			"readonly",
			(store) => store.get(getCacheKey(path)),
		);

		if (!entry || Date.now() - entry.updatedAt > CACHE_TTL) return null;

		return entry.data;
	} catch {
		return null;
	}
};

export const readCachedBook = async (bookId: string): Promise<IBook | null> => {
	if (!canUseIndexedDB()) return null;

	try {
		const entry = await withStore<IApiCacheEntry<IBook> | undefined>(
			BOOK_STORE,
			"readonly",
			(store) => store.get(bookId),
		);

		return entry?.data ?? null;
	} catch {
		return null;
	}
};

export const queueUserBookMutation = async (
	mutation: Omit<IQueuedMutation, "id" | "queuedAt">,
): Promise<void> => {
	if (!canUseIndexedDB()) return;

	await withStore(MUTATION_QUEUE_STORE, "readwrite", (store) =>
		store.put({
			...mutation,
			id: `${Date.now()}-${crypto.randomUUID()}`,
			key: `${Date.now()}-${mutation.method}-${mutation.path}`,
			queuedAt: Date.now(),
		}),
	);
};

export const applyLocalUserBookTracking = async (
	bookId: string,
	tracking: IUserBookTracking,
): Promise<void> => {
	await cacheApiResponse(`/user-books/${bookId}`, tracking);

	const listPath = "/user-books?limit=27&page=1";
	const list = await readCachedApiResponse<IUserBooksResponse>(listPath);
	if (!list) return;

	const existingIndex = list.items.findIndex((item) => item.book.id === bookId);
	const items =
		existingIndex >= 0
			? list.items.map((item, index) =>
					index === existingIndex ? tracking : item,
				)
			: [tracking, ...list.items];

	await cacheApiResponse(listPath, {
		...list,
		items,
		total: existingIndex >= 0 ? list.total : list.total + 1,
	});
};

export const removeLocalUserBookTracking = async (
	bookId: string,
	params: IUserBooksParams = { limit: 27, page: 1 },
): Promise<void> => {
	const searchParams = new URLSearchParams();
	if (params.status) searchParams.set("status", params.status);
	if (params.page) searchParams.set("page", String(params.page));
	if (params.limit) searchParams.set("limit", String(params.limit));

	const path = `/user-books${searchParams.toString() ? `?${searchParams}` : ""}`;
	const list = await readCachedApiResponse<IUserBooksResponse>(path);
	if (!list) return;

	await cacheApiResponse(path, {
		...list,
		items: list.items.filter((item) => item.book.id !== bookId),
		total: Math.max(0, list.total - 1),
	});
};

export const syncQueuedUserBookMutations = async ({
	apiBaseUrl,
	token,
}: {
	apiBaseUrl: string;
	token: string | null;
}): Promise<number> => {
	if (!canUseIndexedDB() || !token || navigator.onLine === false) return 0;

	const queued = await withStore<Array<IQueuedMutation & { key: string }>>(
		MUTATION_QUEUE_STORE,
		"readonly",
		(store) => store.getAll(),
	);

	let syncedCount = 0;

	for (const mutation of queued.sort((a, b) => a.queuedAt - b.queuedAt)) {
		const response = await fetch(`${apiBaseUrl}${mutation.path}`, {
			body: mutation.body,
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			method: mutation.method,
		});

		if (!response.ok) break;

		await withStore(MUTATION_QUEUE_STORE, "readwrite", (store) =>
			store.delete(mutation.key),
		);
		syncedCount += 1;
	}

	return syncedCount;
};
