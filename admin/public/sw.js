self.addEventListener("install", (event) => {
	console.log("Service worker installing...");
	event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
	console.log("Service worker activating...");
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) =>
				Promise.all(
					cacheNames
						.filter((name) => name.startsWith("osm-tiles") && name !== "osm-tiles")
						.map((name) => caches.delete(name)),
				),
			)
			.then(() => {
				console.log("Old caches cleaned up");
			})
			.catch((error) => {
				console.error("Failed to clean up old caches:", error);
			}),
	);
	self.clients.claim();
});

async function registerTileCaching() {
	try {
		const { registerRoute } = await import("workbox-routing");
		const { CacheFirst } = await import("workbox-strategies");
		const { ExpirationPlugin } = await import("workbox-expiration");
		const { CacheableResponsePlugin } = await import("workbox-cacheable-response");

		registerRoute(
			({ url }) => {
				const matches =
					url.origin.includes("tile.openstreetmap.org") && url.pathname.endsWith(".png");
				console.log(
					`Checking tile URL: ${url.href}, Origin: ${url.origin}, Path: ${url.pathname}, Matches: ${matches}`,
				);
				return matches;
			},
			new CacheFirst({
				cacheName: "osm-tiles",
				plugins: [
					new CacheableResponsePlugin({
						statuses: [0, 200],
					}),
					new ExpirationPlugin({
						maxEntries: 10000,
						maxAgeSeconds: 30 * 24 * 60 * 60,
						purgeOnQuotaError: true,
					}),
				],
			}),
		);

		console.log("OSM tile caching registered");
	} catch (error) {
		console.error("Failed to register tile caching:", error);
	}
}

self.addEventListener("fetch", (event) => {
	if (event.request.url.includes("tile.openstreetmap.org") && event.request.url.endsWith(".png")) {
		console.log(`Fetch intercepted for tile: ${event.request.url}`);
		event.respondWith(
			caches.match(event.request).then((cachedResponse) => {
				if (cachedResponse) {
					console.log(`Serving from cache: ${event.request.url}`);
					return cachedResponse;
				}
				console.log(`Fetching from network: ${event.request.url}`);
				return fetch(event.request).then((response) => {
					if (response.ok) {
						return caches.open("osm-tiles").then((cache) => {
							cache.put(event.request, response.clone());
							console.log(`Cached tile: ${event.request.url}`);
							return response;
						});
					}
					console.error(`Fetch failed for ${event.request.url}: ${response.status}`);
					return response;
				});
			}),
		);
	}
});

self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "KEEP_ALIVE") {
		console.log("Service worker received keep-alive message");
	}
});

registerTileCaching();
