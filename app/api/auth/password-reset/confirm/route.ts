/**
 * POST /api/auth/password-reset/confirm — set a new password via reset token (CR-003).
 *
 * Body: { token: string, password: string }
 *
 * Validates the token (exists, not expired, not already used), sets the new
 * password, marks the token used and invalidates every other outstanding token
 * for the account. The old password stops working because its hash is replaced.
 *
 * @spec AC-01-017
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { authLimiter, getClientIp } from '@/lib/rate-limit';
import { PasswordResetConfirmSchema, validationError } from '@/lib/validation';
import { hashResetToken } from '@/lib/reset-token';
import { logger } from '@/lib/logger';

const INVALID = { error: 'Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.' };

export async function POST(req: NextRequest) {
  if (!authLimiter.check(`pwreset-confirm:${getClientIp(req)}`)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = PasswordResetConfirmSchema.safeParse(body);
  if (!parsed.success) {
    const { status, body: errBody } = validationError(parsed.error);
    return NextResponse.json(errBody, { status });
  }

  const { token, password } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({
    where:  { tokenHash: hashResetToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(INVALID, { status: 400 });
  }

  // Guard against a deleted account (defence in depth — tokens are cleared on
  // deletion, but never trust that alone).
  const user = await prisma.user.findUnique({
    where:  { id: record.userId },
    select: { id: true, deletedAt: true },
  });
  if (!user || user.deletedAt) {
    return NextResponse.json(INVALID, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  // Atomic: set the new password, mark this token used, and invalidate all
  // other outstanding tokens for the account.
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
  ]);

  logger.info('password reset completed', { userId: user.id });
  return NextResponse.json({ ok: true });
}
