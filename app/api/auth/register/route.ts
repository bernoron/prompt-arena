/**
 * POST /api/auth/register
 *
 * Body: { name: string, email: string, password: string }
 *
 * Creates a new user account and sets a signed session cookie (auto-login).
 * Email is stored encrypted (AES-256-GCM); uniqueness is checked via HMAC blind index.
 *
 * @spec AC-12-004, AC-12-008
 */
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { signUserId, USER_COOKIE, isUserSecretConfigured } from '@/lib/user-session';
import { USER_COOKIE_OPTS } from '@/lib/user-auth';
import { hashPassword } from '@/lib/password';
import { encryptEmail, hashEmail, isEmailSecretConfigured } from '@/lib/email-crypto';
import { authLimiter, getClientIp } from '@/lib/rate-limit';
import { RegisterSchema, validationError } from '@/lib/validation';
import { AVATAR_COLORS } from '@/lib/constants';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  if (!authLimiter.check(`register:${getClientIp(req)}`)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  if (process.env.NODE_ENV === 'production' && !isEmailSecretConfigured()) {
    logger.error('EMAIL_SECRET is not set — registration disabled');
    return NextResponse.json(
      { error: 'E-Mail-Verschlüsselung ist nicht konfiguriert.' },
      { status: 503 },
    );
  }

  if (process.env.NODE_ENV === 'production' && !isUserSecretConfigured()) {
    logger.error('USER_SECRET is not set — registration disabled');
    return NextResponse.json(
      { error: 'Session-Verwaltung ist nicht konfiguriert.' },
      { status: 503 },
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    const { status, body: errBody } = validationError(parsed.error);
    return NextResponse.json(errBody, { status });
  }

  const { name, email, password } = parsed.data;

  // Check name uniqueness
  const nameExists = await prisma.user.findUnique({ where: { name }, select: { id: true } });
  if (nameExists) {
    return NextResponse.json(
      { error: 'Dieser Benutzername ist bereits vergeben.' },
      { status: 409 },
    );
  }

  // Check email uniqueness via HMAC blind index — @spec AC-12-004
  const emailHash = hashEmail(email);
  const emailExists = await prisma.user.findUnique({ where: { emailHash }, select: { id: true } });
  if (emailExists) {
    return NextResponse.json(
      { error: 'Diese E-Mail-Adresse ist bereits registriert.' },
      { status: 409 },
    );
  }

  const count          = await prisma.user.count();
  const avatarColor    = AVATAR_COLORS[count % AVATAR_COLORS.length];
  const passwordHash   = await hashPassword(password);
  const emailEncrypted = encryptEmail(email);

  let user: { id: number; name: string; avatarColor: string };
  try {
    user = await prisma.user.create({
      data: { name, avatarColor, passwordHash, emailHash, emailEncrypted },
      select: { id: true, name: true, avatarColor: true },
    });
  } catch (err) {
    // Concurrent registration can slip through the pre-checks; the DB unique
    // constraint is the authoritative guard — surface it as a 409, not a 500.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Dieser Benutzername oder diese E-Mail ist bereits vergeben.' },
        { status: 409 },
      );
    }
    throw err;
  }

  const cookieValue = await signUserId(user.id);
  const res = NextResponse.json(
    { ok: true, userId: user.id, name: user.name, avatarColor: user.avatarColor },
    { status: 201 },
  );

  res.cookies.set(USER_COOKIE, cookieValue, USER_COOKIE_OPTS);

  logger.info('user registered', { userId: user.id, name: user.name });
  return res;
}
