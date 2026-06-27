/**
 * User session authentication helpers.
 *
 * Strategy (mirrors admin-auth.ts but for end-users):
 *   - On user selection via UserPicker, POST /api/auth/login sets a signed
 *     HttpOnly cookie containing the userId.
 *   - Cookie value: `{userId}.{HMAC-SHA256(userId + ':' + USER_SECRET)}`
 *   - Write API routes call getUserIdFromCookie() to verify the session and
 *     obtain the authoritative userId — the body's userId is then validated
 *     against it, preventing impersonation.
 *   - USER_SECRET must be set in .env; a missing secret disables session auth.
 */

import { cookies } from 'next/headers';

export const USER_COOKIE = 'user_session';

/** Compute HMAC-SHA256 of a message using the USER_SECRET. */
async function hmac(message: string): Promise<string> {
  const secret = process.env.USER_SECRET ?? '';
  const keyData = new TextEncoder().encode(secret);
  const msgData = new TextEncoder().encode(message);

  const key = await crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, msgData);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Create a signed cookie value for the given userId. */
export async function signUserId(userId: number): Promise<string> {
  const sig = await hmac(String(userId));
  return `${userId}.${sig}`;
}

/**
 * Verify a cookie value and return the userId, or null if invalid.
 * Returns null when USER_SECRET is not configured (auth disabled).
 */
export async function verifyUserCookie(cookieValue: string | undefined): Promise<number | null> {
  if (!process.env.USER_SECRET || !cookieValue) return null;

  const dotIdx = cookieValue.indexOf('.');
  if (dotIdx === -1) return null;

  const userIdStr = cookieValue.slice(0, dotIdx);
  const receivedSig = cookieValue.slice(dotIdx + 1);
  const userId = parseInt(userIdStr, 10);
  if (!Number.isFinite(userId) || userId <= 0) return null;

  const expectedSig = await hmac(userIdStr);

  // Timing-safe comparison
  const a = new TextEncoder().encode(receivedSig);
  const b = new TextEncoder().encode(expectedSig);
  if (a.length !== b.length) return null;

  const match = await crypto.subtle.verify(
    'HMAC',
    await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(process.env.USER_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    ),
    new Uint8Array(b.buffer),
    new TextEncoder().encode(userIdStr),
  );

  return match ? userId : null;
}

/**
 * Read and verify the user session from the current request's cookies.
 * Returns the verified userId, or null if no valid session exists.
 *
 * For use in Server Components and Server Actions.
 */
export async function getSessionUserId(): Promise<number | null> {
  const cookieStore = cookies();
  const value = cookieStore.get(USER_COOKIE)?.value;
  return verifyUserCookie(value);
}

/**
 * Resolves the authoritative userId for an API route.
 *
 * When USER_SECRET is configured:
 *   - A valid session cookie is required.
 *   - The cookie's userId must match bodyUserId (prevents impersonation).
 *   - Returns { error: Response } if either check fails.
 *
 * When USER_SECRET is NOT configured (auth disabled / dev mode):
 *   - Falls back to bodyUserId from the request body (legacy behaviour).
 *
 * @param cookieHeader - The raw value of the user_session cookie.
 * @param bodyUserId   - The userId from the validated request body.
 * @returns The verified userId, or a NextResponse error to return immediately.
 */
export async function resolveUserId(
  cookieHeader: string | undefined,
  bodyUserId: number,
): Promise<number | { error: string; status: number }> {
  if (!process.env.USER_SECRET) {
    // Auth disabled — trust the body (backward-compatible dev mode)
    return bodyUserId;
  }

  const sessionUserId = await verifyUserCookie(cookieHeader);

  if (!sessionUserId) {
    return { error: 'Not authenticated — please select a user', status: 401 };
  }

  if (sessionUserId !== bodyUserId) {
    return { error: 'Forbidden — userId does not match your session', status: 403 };
  }

  return sessionUserId;
}
