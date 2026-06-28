/**
 * POST /api/auth/register
 *
 * Body: { name: string, department: string, password: string }
 *
 * Creates a new user account and sets a signed session cookie (auto-login).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signUserId, USER_COOKIE } from '@/lib/user-session';
import { hashPassword } from '@/lib/password';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { RegisterSchema, validationError } from '@/lib/validation';
import { AVATAR_COLORS } from '@/lib/constants';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  if (!writeLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
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

  const { name, department: rawDept, password } = parsed.data;
  const department = rawDept === '__other__' ? '' : rawDept;

  // Check if name already taken (User.name has a unique index)
  const existing = await prisma.user.findUnique({
    where: { name },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Dieser Benutzername ist bereits vergeben.' },
      { status: 409 },
    );
  }

  const count        = await prisma.user.count();
  const avatarColor  = AVATAR_COLORS[count % AVATAR_COLORS.length];
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, department, avatarColor, passwordHash },
    select: { id: true, name: true, avatarColor: true },
  });

  const cookieValue = await signUserId(user.id);
  const res = NextResponse.json(
    { ok: true, userId: user.id, name: user.name, avatarColor: user.avatarColor },
    { status: 201 },
  );

  res.cookies.set(USER_COOKIE, cookieValue, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   60 * 60 * 24 * 30,
    path:     '/',
  });

  logger.info('user registered', { userId: user.id, name: user.name });
  return res;
}
