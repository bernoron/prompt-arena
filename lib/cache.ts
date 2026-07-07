/**
 * Tiny in-process TTL cache for hot, non-personalised reads.
 *
 * Several endpoints already advertise short public cacheability via
 * `Cache-Control: s-maxage=…` headers (trending, categories, leaderboard).
 * This module gives the *origin* the same short-lived memoisation so that a
 * burst of requests within one TTL window collapses to a single DB round-trip
 * instead of re-running the same aggregation per request.
 *
 * Scope rules — only ever cache data that is NOT user-specific. Personalised
 * reads (anything that depends on the signed-in user's votes/favorites) must
 * never pass through here.
 *
 * State lives in the Node.js process, exactly like lib/rate-limit.ts. That is
 * fine for the single-machine deployment; a future multi-replica setup would
 * swap this for a shared store behind the same `cached()` signature.
 */

interface Entry<T> {
  value: T;
  expires: number;
}

const store = new Map<string, Entry<unknown>>();

// Disabled under test/CI so unit tests never observe cross-test staleness and
// e2e assertions always see fresh data. Mirrors the rate-limiter's CI bypass.
const DISABLED = process.env.NODE_ENV === 'test' || process.env.CI === 'true';

/**
 * Returns the cached value for `key` when still fresh, otherwise runs
 * `loader`, stores the result for `ttlMs`, and returns it.
 *
 * Concurrent callers within the same tick each run the loader once on a cold
 * key; this is acceptable for the small TTLs used here and avoids the
 * complexity of an in-flight promise registry.
 */
export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  if (DISABLED) return loader();

  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) {
    return hit.value as T;
  }

  const value = await loader();
  store.set(key, { value, expires: now + ttlMs });
  return value;
}

/** Drops a cached entry so the next read recomputes. Call after a write that
 *  invalidates the cached view (e.g. a new prompt affects trending). */
export function invalidate(key: string): void {
  store.delete(key);
}

/** Test/maintenance helper — clears the entire cache. */
export function clearCache(): void {
  store.clear();
}
