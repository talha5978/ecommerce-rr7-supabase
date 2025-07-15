type CacheValue<T = any> = {
	value: T;
	cachedAt: number;
	ttl: number; // in milliseconds
};

const cache = new Map<string, CacheValue>();

// Default TTL = 60 minutes
const DEFAULT_TTL = 60 * 60 * 1000;

/**
 * Set a cache value for a key with optional TTL (in ms)
 */
export function setCache<T>(key: string, value: T, ttl: number = DEFAULT_TTL) {
	cache.set(key, {
		value,
		cachedAt: Date.now(),
		ttl,
	});
}

/**
 * Get a cache value by key, returns null if not found or expired
 */
export function getCache<T = any>(key: string): T | null {
	const item = cache.get(key);
	if (!item) return null;

	const isExpired = Date.now() - item.cachedAt > item.ttl;
	if (isExpired) {
		cache.delete(key);
		return null;
	}

	return item.value;
}

/**
 * Delete a specific cache entry by key
 */
export function deleteCache(key: string): void {
	cache.delete(key);
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
	cache.clear();
}

/**
 * Debug view (optional)
 */
export function debugCache(): Record<string, any> {
	return Object.fromEntries(cache.entries());
}
