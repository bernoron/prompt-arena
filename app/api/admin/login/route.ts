/**
 * POST /api/admin/login
 *
 * Body: { password: string }
 *
 * On success sets an HttpOnly `admin_session` cookie and returns { ok: true }.
 * On failure returns 401.
 */
import { NextRequest, NextResponse } from 'next/server';
import { hashSecret, ADMIN_COOKIE } from '@/lib/admin-auth';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// @spec AC-07-001
export async function POST(req: NextRequest) {
  // Rate-limit login attempts to slow brute-force
  if (!writeLimiter.check(getClientIp(req))) {
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

  if (password !== secret) {
    logger.warn('Admin login failed', { ip: getClientIp(req) });
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const hash = await hashSecret(secret);
  const res  = NextResponse.json({ ok: true });

  res.cookies.set(ADMIN_COOKIE, hash, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'strict',
    maxAge:    60 * 60 * 24 * 7, // 7 days
    path:      '/',
  });

  logger.info('Admin login successful', { ip: getClientIp(req) });
  return res;
}
