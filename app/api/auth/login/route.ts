/**
 * POST /api/auth/login
 *
 * Body: { userId: number }
 *
 * Sets a signed HttpOnly `user_session` cookie for the given user.
 * Called by UserPicker when the user selects or creates a profile.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signUserId, USER_COOKIE } from '@/lib/user-auth';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { PathId } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  if (!writeLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  if (!process.env.USER_SECRET && process.env.NODE_ENV === 'production') {
    logger.error('USER_SECRET is not set - user login disabled');
    return NextResponse.json(
      { error: 'User authentication is not configured on this server' },
      { status: 503 },
    );
  }

  let userId: number;
  try {
    const body = await req.json();
    const parsed = PathId.safeParse(String(body?.userId ?? ''));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }
    userId = parsed.data;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Ensure the user actually exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const cookieValue = await signUserId(userId);
  const res = NextResponse.json({ ok: true, userId });

  res.cookies.set(USER_COOKIE, cookieValue, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   60 * 60 * 24 * 30, // 30 days
    path:     '/',
  });

  logger.info('user session created', { userId, name: user.name });
  return res;
}
