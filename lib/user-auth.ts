/**
 * User session authentication helpers.
 *
 * Strategy:
 *   - On login/register, POST /api/auth/login or /api/auth/register sets a
 *     signed HttpOnly cookie containing the userId.
 *   - Cookie value: `{userId}.{issuedAt}.{HMAC-SHA256("{userId}.{issuedAt}", key=USER_SECRET)}`
 *   - Tokens expire server-side after 30 days (USER_SESSION_MAX_AGE_MS).
 *   - Write API routes call resolveUserId() to verify the session and obtain
 *     the authoritative userId — preventing impersonation.
 *   - USER_SECRET must be set in production.
 *
 * Edge-safe primitives (USER_COOKIE, signUserId, verifyUserCookie) live in
 * lib/user-session.ts so middleware can import them without next/headers.
 */

import { cookies } from 'next/headers';
export { USER_COOKIE, signUserId, verifyUserCookie } from './user-session';
import { USER_COOKIE, verifyUserCookie } from './user-session';

export const USER_COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge:   60 * 60 * 24 * 30, // 30 days
  path:     '/',
};

/**
 * Read and verify the user session from the current request's cookies.
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
 *
 * When USER_SECRET is NOT configured in development:
 *   - Falls back to bodyUserId (legacy backward compat).
 *
 * When USER_SECRET is NOT configured in production:
 *   - Returns 503.
 */
export async function resolveUserId(
  cookieHeader: string | undefined,
  bodyUserId: number,
): Promise<number | { error: string; status: number }> {
  if (!process.env.USER_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      return { error: 'User authentication is not configured on this server', status: 503 };
    }
    return bodyUserId;
  }

  const sessionUserId = await verifyUserCookie(cookieHeader);

  if (!sessionUserId) {
    return { error: 'Not authenticated', status: 401 };
  }

  if (sessionUserId !== bodyUserId) {
    return { error: 'Forbidden - userId does not match your session', status: 403 };
  }

  return sessionUserId;
}
