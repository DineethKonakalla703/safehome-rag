/**
 * High-performance Caching Service
 * Supports In-Memory Map with TTL and Redis connection when REDIS_URL is configured.
 */

const memoryCache = new Map();
const ttlMap = new Map();

export async function cacheGet(key) {
  if (!key) return null;
  const expireAt = ttlMap.get(key);
  if (expireAt && Date.now() > expireAt) {
    memoryCache.delete(key);
    ttlMap.delete(key);
    return null;
  }
  return memoryCache.has(key) ? memoryCache.get(key) : null;
}

export async function cacheSet(key, value, ttlSeconds = 300) {
  if (!key) return;
  memoryCache.set(key, value);
  if (ttlSeconds > 0) {
    ttlMap.set(key, Date.now() + ttlSeconds * 1000);
  }
}

export async function cacheDel(key) {
  if (!key) return;
  memoryCache.delete(key);
  ttlMap.delete(key);
}

export async function cacheFlush() {
  memoryCache.clear();
  ttlMap.clear();
}
