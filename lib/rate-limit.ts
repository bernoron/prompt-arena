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

/**
 * Hard cap on the number of tracked keys per limiter. Without a cap an
 * attacker could spray unique keys (e.g. spoofed IP headers) and grow the
 * Map without bound until the process runs out of memory.
 */
const MAX_TRACKED_KEYS = 10_000;

export function createRateLimiter({ windowMs, max }: RateLimiterOptions): RateLimiter {
  // In CI pipelines all requests share the same IP ('unknown'), which exhausts
  // the rate-limit budget within seconds. GitHub Actions sets CI=true automatically.
  if (process.env.CI === 'true') {
    return { check: () => true };
  }

  // Map<key, sorted array of timestamps>
  const store = new Map<string, number[]>();
  let lastSweep = Date.now();

  /** Drop keys whose entire window has expired; runs at most once per window. */
  function sweep(now: number): void {
    if (now - lastSweep < windowMs) return;
    lastSweep = now;
    const cutoff = now - windowMs;
    const expired: string[] = [];
    store.forEach((timestamps, key) => {
      if (timestamps.length === 0 || timestamps[timestamps.length - 1] <= cutoff) {
        expired.push(key);
      }
    });
    expired.forEach((key) => store.delete(key));
  }

  return {
    check(key: string): boolean {
      const now = Date.now();
      const cutoff = now - windowMs;

      sweep(now);

      // Emergency valve: if the sweep couldn't reclaim space (burst of unique
      // keys within one window), evict the oldest-inserted entries.
      if (store.size >= MAX_TRACKED_KEYS && !store.has(key)) {
        const evictCount = Math.ceil(MAX_TRACKED_KEYS / 10);
        const toEvict: string[] = [];
        store.forEach((_timestamps, oldKey) => {
          if (toEvict.length < evictCount) toEvict.push(oldKey);
        });
        toEvict.forEach((oldKey) => store.delete(oldKey));
      }

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

/**
 * Auth endpoints (login / register): 10 attempts per 15 minutes per IP.
 * Stricter than writeLimiter to resist credential stuffing and registration abuse.
 */
export const authLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 10 });

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Extracts the best available IP identifier from the request headers.
 *
 * Trust order matters — clients can freely send their own X-Forwarded-For,
 * which the reverse proxy then *appends to*, so the LEFTMOST entry is
 * attacker-controlled. Using it would let anyone bypass rate limiting by
 * rotating a fake header value on every request.
 *
 *   1. Platform headers set by the edge itself (Fly.io / Cloudflare) —
 *      these cannot be spoofed from outside.
 *   2. x-real-ip — set by nginx-style proxies, overwrites any client value.
 *   3. RIGHTMOST x-forwarded-for entry — appended by the trusted proxy hop.
 *   4. 'unknown' (local dev without a proxy).
 */
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  const platformIp =
    req.headers.get('fly-client-ip') ??
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip');
  if (platformIp) return platformIp.trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const hops = forwarded.split(',');
    const lastHop = hops[hops.length - 1]?.trim();
    if (lastHop) return lastHop;
  }

  return 'unknown';
}
