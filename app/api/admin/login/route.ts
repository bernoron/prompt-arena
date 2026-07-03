/**
 * POST /api/admin/login
 *
 * Body: { password: string }
 *
 * On success sets an HttpOnly `admin_session` cookie and returns { ok: true }.
 * On failure returns 401.
 */
import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession, ADMIN_COOKIE } from '@/lib/admin-auth';
import { authLimiter, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// @spec AC-07-001
export async function POST(req: NextRequest) {
  // Rate-limit login attempts to slow brute-force
  if (!authLimiter.check(`admin-login:${getClientIp(req)}`)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    logger.error('ADMIN_SECRET is not set — admin login disabled');
    return NextResponse.json(
      { error: 'Admin authentication is not configured on this server' },
      { status: 503 },
    );
  }

  let password: string;
  try {
    const body = await req.json();
    password   = String(body?.password ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Timing-safe comparison prevents brute-force timing attacks.
  // Both buffers must be the same byte length for timingSafeEqual;
  // length mismatch itself reveals nothing beyond "wrong password".
  const passwordBuf = Buffer.from(password);
  const secretBuf   = Buffer.from(secret);
  const matches =
    passwordBuf.length === secretBuf.length &&
    timingSafeEqual(passwordBuf, secretBuf);

  if (!matches) {
    logger.warn('Admin login failed', { ip: getClientIp(req) });
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const session = await createAdminSession();
  const res = NextResponse.json({ ok: true });

  res.cookies.set(ADMIN_COOKIE, session, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'strict',
    maxAge:    60 * 60 * 24, // 24h — matches ADMIN_SESSION_MAX_AGE_MS server-side expiry
    path:      '/',
  });

  logger.info('Admin login successful', { ip: getClientIp(req) });
  return res;
}
