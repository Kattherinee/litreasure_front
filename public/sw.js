const CACHE_VERSION = "litreasure-pwa-v1";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const APP_SHELL_ASSETS = [
	"/",
	"/offline.html",
	"/favicon.ico",
	"/icons/logoSvg.svg",
	"/images/welcomePage/dracoWitch1.png",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS)),
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => !key.startsWith(CACHE_VERSION))
						.map((key) => caches.delete(key)),
				),
			),
	);
	self.clients.claim();
});

const isStaticAsset = (requestUrl) =>
	requestUrl.pathname.startsWith("/_next/static") ||
	requestUrl.pathname.startsWith("/images/") ||
	requestUrl.pathname.startsWith("/icons/") ||
	requestUrl.pathname === "/favicon.ico";

self.addEventListener("fetch", (event) => {
	const { request } = event;
	const requestUrl = new URL(request.url);

	if (request.method !== "GET" || requestUrl.origin !== self.location.origin) {
		return;
	}

	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((response) => {
					const responseClone = response.clone();
					caches.open(APP_SHELL_CACHE).then((cache) => {
						cache.put(request, responseClone);
					});
					return response;
				})
				.catch(async () => {
					const cachedPage = await caches.match(request);
					return cachedPage ?? caches.match("/offline.html");
				}),
		);
		return;
	}

	if (isStaticAsset(requestUrl)) {
		event.respondWith(
			caches.match(request).then(
				(cached) =>
					cached ??
					fetch(request).then((response) => {
						const responseClone = response.clone();
						caches.open(STATIC_CACHE).then((cache) => {
							cache.put(request, responseClone);
						});
						return response;
					}),
			),
		);
	}
});
