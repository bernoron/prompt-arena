/**
 * POST /api/admin/logout
 *
 * Clears the admin session cookie and returns { ok: true }.
 * Rate-limited to prevent cookie-clearing spam.
 */
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/admin-auth';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/route-auth';
import { logger } from '@/lib/logger';

// @spec AC-07-002
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  if (!writeLimiter.check(getClientIp(req))) {
    logger.warn('rate limit hit', { route: 'POST /api/admin/logout', ip: getClientIp(req) });
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
