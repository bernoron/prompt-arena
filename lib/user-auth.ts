/**
 * User session authentication helpers.
 *
 * Strategy:
 *   - On login/register, POST /api/auth/login or /api/auth/register sets a
 *     signed HttpOnly cookie containing the userId.
 *   - Cookie value: `{userId}.{issuedAt}.{HMAC-SHA256("{userId}.{issuedAt}", key=USER_SECRET)}`
 *   - Tokens expire server-side after 30 days (USER_SESSION_MAX_AGE_MS).
 *   - Write API routes call requireUser() (lib/route-auth.ts) to derive the
 *     authoritative userId from the session cookie — the client never sends
 *     its own userId in a write request body.
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

