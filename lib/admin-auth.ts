/**
 * Admin authentication helpers (Edge-compatible).
 *
 * Strategy:
 *   - ADMIN_SECRET env var is the shared password.
 *   - On login, a random session payload is HMAC-signed with ADMIN_SECRET.
 *   - Middleware verifies the signature and the max session age.
 *
 * This is safe for a single-admin setup:
 *   - The raw secret never leaves the server or appears in logs.
 *   - The cookie does not contain a reusable hash of the admin password.
 *   - The cookie cannot be read by JS (httpOnly).
 *   - Brute-force is mitigated by the rate limiter on the login API.
 */

// 24h stolen-cookie window (was 7 days). The admin is a single operator who
// can simply log in again; a shorter lifetime bounds the damage of a leaked
// admin_session cookie without an added session store.
export const ADMIN_SESSION_MAX_AGE_MS = 60 * 60 * 24 * 1000; // 24 hours

/**
 * Optional hard revocation switch. Set ADMIN_SESSION_EPOCH to a millisecond
 * timestamp (e.g. `node -e "console.log(Date.now())"`) to instantly invalidate
 * every admin session issued before that moment — without rotating ADMIN_SECRET
 * (which would also break signed URLs / require redeploying the secret).
 */
function issuedBeforeEpoch(issuedAt: number): boolean {
  const raw = process.env.ADMIN_SESSION_EPOCH;
  if (!raw) return false;
  const epoch = Number(raw);
  return Number.isFinite(epoch) && issuedAt < epoch;
}

async function hmac(payload: string, secret: string): Promise<string> {
  const keyData = new TextEncoder().encode(secret);
  const msgData = new TextEncoder().encode(payload);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, msgData);
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(aValue: string, bValue: string): boolean {
  const a = new TextEncoder().encode(aValue);
  const b = new TextEncoder().encode(bValue);
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** SHA-256 of a string, returned as a lowercase hex string. */
export async function hashSecret(secret: string): Promise<string> {
  const data   = new TextEncoder().encode(secret);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createAdminSession(): Promise<string> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error('ADMIN_SECRET is not configured');

  const issuedAt = String(Date.now());
  const nonce = crypto.randomUUID();
  const payload = `${issuedAt}.${nonce}`;
  const sig = await hmac(payload, secret);
  return `${payload}.${sig}`;
}

/** Returns true when the cookie value is a valid, unexpired admin session token. */
export async function isAdminAuthorised(cookieValue: string | undefined): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !cookieValue) return false;

  const parts = cookieValue.split('.');
  if (parts.length !== 3) return false;

  const [issuedAtRaw, nonce, receivedSig] = parts;
  if (!/^\d+$/.test(issuedAtRaw) || !nonce || !receivedSig) return false;

  const issuedAt = Number.parseInt(issuedAtRaw, 10);
  if (!Number.isSafeInteger(issuedAt)) return false;

  const age = Date.now() - issuedAt;
  if (age < 0 || age > ADMIN_SESSION_MAX_AGE_MS) return false;
  if (issuedBeforeEpoch(issuedAt)) return false;

  const payload = `${issuedAtRaw}.${nonce}`;
  const expected = await hmac(payload, secret);
  return constantTimeEqual(receivedSig, expected);
}

export const ADMIN_COOKIE = 'admin_session';
