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

async function hmac(message: string): Promise<string> {
  const secret = process.env.USER_SECRET ?? '';
  const keyData = new TextEncoder().encode(secret);
  const msgData = new TextEncoder().encode(message);
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, msgData);
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function signUserId(userId: number): Promise<string> {
  const sig = await hmac(String(userId));
  return `${userId}.${sig}`;
}

export async function verifyUserCookie(cookieValue: string | undefined): Promise<number | null> {
  if (!process.env.USER_SECRET || !cookieValue) return null;

  const dotIdx = cookieValue.indexOf('.');
  if (dotIdx === -1) return null;

  const userIdStr = cookieValue.slice(0, dotIdx);
  const receivedSig = cookieValue.slice(dotIdx + 1);
  const userId = parseInt(userIdStr, 10);
  if (!Number.isFinite(userId) || userId <= 0) return null;

  const expectedSig = await hmac(userIdStr);
  const a = new TextEncoder().encode(receivedSig);
  const b = new TextEncoder().encode(expectedSig);
  if (a.length !== b.length) return null;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0 ? userId : null;
}
