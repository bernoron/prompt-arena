/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * No external dependencies — uses a Map keyed by an arbitrary identifier
 * (typically IP address or user ID string).
 *
 * How it works:
 *   A sliding window of `windowMs` milliseconds is maintained per key.
 *   Each call records the current timestamp; calls older than the window
 *   are discarded. If the remaining call count exceeds `max`, the request
 *   is rejected.
 *
 * Limitations:
 *   State lives in the Node.js process. In a multi-replica deployment each
 *   replica has its own counter, so the effective limit is max × replicas.
 *   For this single-server internal tool that is acceptable.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 20 });
 *   const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
 *   if (!limiter.check(ip)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

interface RateLimiterOptions {
  /** Length of the sliding window in milliseconds. */
  windowMs: number;
  /** Maximum number of requests allowed per window. */
  max: number;
}

interface RateLimiter {
  /** Returns true if the request is allowed, false if it should be rejected. */
  check: (key: string) => boolean;
}

export function createRateLimiter({ windowMs, max }: RateLimiterOptions): RateLimiter {
  // Map<key, sorted array of timestamps>
  const store = new Map<string, number[]>();

  return {
    check(key: string): boolean {
      const now = Date.now();
      const cutoff = now - windowMs;

      // Get or initialise the timestamps array for this key
      const timestamps = (store.get(key) ?? []).filter((t) => t > cutoff);

      if (timestamps.length >= max) {
        // Too many requests in the current window
        store.set(key, timestamps);
        return false;
      }

      timestamps.push(now);
      store.set(key, timestamps);
      return true;
    },
  };
}

// ─── Pre-configured limiters ──────────────────────────────────────────────────

/** Mutations (POST/PUT): 30 requests per minute per IP. */
export const writeLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });

/** Reads (GET): 120 requests per minute per IP. */
export const readLimiter = createRateLimiter({ windowMs: 60_000, max: 120 });

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Extracts the best available IP identifier from the request headers.
 * Falls back to 'unknown' if none is present (e.g. local dev without a proxy).
 */
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
