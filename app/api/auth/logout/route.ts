/**
 * POST /api/auth/logout
 *
 * Clears the user session cookie. Rate-limited like every other route
 * handler to prevent request-flooding abuse.
 */
import { NextRequest, NextResponse } from 'next/server';
import { USER_COOKIE } from '@/lib/user-auth';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';

// @spec AC-01-008
export async function POST(req: NextRequest) {
  if (!writeLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(USER_COOKIE);
  return res;
}
