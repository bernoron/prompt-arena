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
import { hashPassword, verifyPassword } from '@/lib/password';
import { USER_COOKIE_OPTS } from '@/lib/user-auth';
import { authLimiter, getClientIp } from '@/lib/rate-limit';
import { LoginSchema, validationError } from '@/lib/validation';
import { logger } from '@/lib/logger';

// Pre-computed once per cold-start: ensures verifyPassword always does real scrypt work
// even when the user does not exist, preventing timing-based user enumeration.
const DUMMY_HASH_PROMISE = hashPassword('__sentinel__');

// @spec AC-01-007
// Note: Feature 12 login behaviour (passwordHash verification, null-hash edge case) — no dedicated AC-12 criterion defined
export async function POST(req: NextRequest) {
  if (!authLimiter.check(`login:${getClientIp(req)}`)) {
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

  // Always run verifyPassword regardless of whether the user exists.
  // DUMMY_HASH is a valid scrypt hash so the full derivation always runs,
  // preventing user-enumeration via response-time differences.
  const DUMMY_HASH = await DUMMY_HASH_PROMISE;
  const hashToCheck = user?.passwordHash ?? DUMMY_HASH;
  const passwordOk = await verifyPassword(password, hashToCheck);

  if (!user || !passwordOk) {
    return NextResponse.json(
      { error: 'Ungültiger Benutzername oder Passwort' },
      { status: 401 },
    );
  }

  const cookieValue = await signUserId(user.id);
  const res = NextResponse.json({
    ok: true,
    userId:      user.id,
    name:        user.name,
    avatarColor: user.avatarColor,
  });

  res.cookies.set(USER_COOKIE, cookieValue, USER_COOKIE_OPTS);

  logger.info('user login', { userId: user.id, name: user.name });
  return res;
}
