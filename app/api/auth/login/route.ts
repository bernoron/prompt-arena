/**
 * POST /api/auth/login
 *
 * Body: { name: string, password: string }
 *
 * Verifies the user's password and sets a signed HttpOnly `user_session` cookie.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signUserId, USER_COOKIE } from '@/lib/user-session';
import { verifyPassword } from '@/lib/password';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { LoginSchema, validationError } from '@/lib/validation';
import { logger } from '@/lib/logger';

// @spec AC-01-007
export async function POST(req: NextRequest) {
  if (!writeLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    const { status, body: errBody } = validationError(parsed.error);
    return NextResponse.json(errBody, { status });
  }

  const { name, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { name },
    select: { id: true, name: true, avatarColor: true, passwordHash: true },
  });

  // Constant-time: always run verifyPassword even when user is not found,
  // to prevent user-enumeration via timing.
  const DUMMY_HASH = '$2a$10$dummy.hash.to.prevent.timing.enumeration.attack.XXXXXXX';
  const hashToCheck = user?.passwordHash ?? DUMMY_HASH;
  const passwordOk  = user?.passwordHash
    ? await verifyPassword(password, hashToCheck)
    : false;

  if (!user || !passwordOk) {
    return NextResponse.json(
      { error: 'Ungültiger Benutzername oder Passwort' },
      { status: 401 },
    );
  }

  const cookieValue = await signUserId(user.id);
  const res = NextResponse.json({
    ok: true,
    userId:     user.id,
    name:       user.name,
    avatarColor: user.avatarColor,
  });

  res.cookies.set(USER_COOKIE, cookieValue, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   60 * 60 * 24 * 30,
    path:     '/',
  });

  logger.info('user login', { userId: user.id, name: user.name });
  return res;
}
