/**
 * Admin authentication helpers (Edge-compatible).
 *
 * Strategy:
 *   - ADMIN_SECRET env var is the shared password.
 *   - On login, SHA-256(ADMIN_SECRET) is stored in an HttpOnly cookie.
 *   - Middleware recomputes the hash and compares to the cookie value.
 *
 * This is safe for a small internal tool:
 *   - The raw secret never leaves the server or appears in logs.
 *   - The cookie cannot be read by JS (httpOnly).
 *   - Brute-force is mitigated by the rate limiter on the login API.
 */

/** SHA-256 of a string, returned as a lowercase hex string. */
export async function hashSecret(secret: string): Promise<string> {
  const data   = new TextEncoder().encode(secret);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Returns true when the cookie value matches SHA-256(ADMIN_SECRET). */
export async function isAdminAuthorised(cookieValue: string | undefined): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !cookieValue) return false;
  const expected = await hashSecret(secret);
  return cookieValue === expected;
}

export const ADMIN_COOKIE = 'admin_session';
