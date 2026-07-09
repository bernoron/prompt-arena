/**
 * Edge-safe user session utilities.
 *
 * No dependency on `next/headers` — safe to import from middleware (Edge runtime)
 * as well as Route Handlers and Server Components.
 *
 * The server-side helpers that need next/headers live in lib/user-auth.ts,
 * which re-exports everything from here.
 */

export const USER_COOKIE = 'user_session';

/**
 * Maximum age of a session token. Enforced server-side on every verify —
 * the browser cookie Max-Age alone is not a security boundary, because a
 * stolen token would otherwise stay valid forever.
 */
export const USER_SESSION_MAX_AGE_MS = 60 * 60 * 24 * 30 * 1000; // 30 days

// Mirrors lib/email-crypto.ts's DEV_FALLBACK: crypto.subtle.importKey() rejects a
// zero-length HMAC key, so an unset USER_SECRET must never reach it as ''. The route
// handlers (register/login) are responsible for refusing to run in production without
// a real USER_SECRET — this fallback only keeps local dev usable out of the box.
const DEV_FALLBACK_SECRET = 'dev-user-secret-NOT-FOR-PRODUCTION!';

/** Returns true when USER_SECRET is configured (required in production). */
export function isUserSecretConfigured(): boolean {
  return Boolean(process.env.USER_SECRET);
}

async function hmac(message: string): Promise<string> {
  const secret = process.env.USER_SECRET || DEV_FALLBACK_SECRET;
  const keyData = new TextEncoder().encode(secret);
  const msgData = new TextEncoder().encode(message);
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, msgData);
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Token format: `{userId}.{issuedAt}.{sig}` with sig = HMAC(`{userId}.{issuedAt}`).
 *
 * The signed issuedAt timestamp gives every token a server-enforced expiry.
 * Legacy two-part tokens (`{userId}.{sig}`) are rejected — affected users
 * simply have to log in again once.
 */
export async function signUserId(userId: number): Promise<string> {
  const payload = `${userId}.${Date.now()}`;
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifyUserCookie(cookieValue: string | undefined): Promise<number | null> {
  if (!cookieValue) return null;

  const parts = cookieValue.split('.');
  if (parts.length !== 3) return null;

  const [userIdStr, issuedAtStr, receivedSig] = parts;
  if (!/^\d+$/.test(userIdStr) || !/^\d+$/.test(issuedAtStr) || !receivedSig) return null;

  const userId = parseInt(userIdStr, 10);
  if (!Number.isSafeInteger(userId) || userId <= 0) return null;

  const issuedAt = parseInt(issuedAtStr, 10);
  if (!Number.isSafeInteger(issuedAt)) return null;

  const age = Date.now() - issuedAt;
  if (age < 0 || age > USER_SESSION_MAX_AGE_MS) return null;

  const expectedSig = await hmac(`${userIdStr}.${issuedAtStr}`);
  const a = new TextEncoder().encode(receivedSig);
  const b = new TextEncoder().encode(expectedSig);
  if (a.length !== b.length) return null;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0 ? userId : null;
}
