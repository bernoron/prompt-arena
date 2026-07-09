/**
 * POST /api/auth/password-reset/request — start a password reset (CR-003).
 *
 * Body: { email: string }
 *
 * ALWAYS returns the same neutral response, whether or not an account exists,
 * so the endpoint can't be used to discover which addresses are registered
 * (@spec AC-01-016, BAC-01-013). If a (non-deleted) account matches, a
 * single-use, time-limited token is created and a reset e-mail is dispatched.
 *
 * In dev/CI/E2E only, the reset URL is echoed back as `devResetUrl` so
 * automated tests can follow the link. In production this field is never set.
 *
 * @spec AC-01-014, AC-01-016
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashEmail, decryptEmail } from '@/lib/email-crypto';
import { authLimiter, getClientIp } from '@/lib/rate-limit';
import { PasswordResetRequestSchema, validationError } from '@/lib/validation';
import { generateResetToken, hashResetToken, resetTokenExpiry, isTestOrDevEnv } from '@/lib/reset-token';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { logger } from '@/lib/logger';

const NEUTRAL = {
  ok: true,
  message: 'Falls ein Konto mit dieser E-Mail existiert, haben wir einen Link zum Zurücksetzen gesendet.',
};

export async function POST(req: NextRequest) {
  if (!authLimiter.check(`pwreset-request:${getClientIp(req)}`)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = PasswordResetRequestSchema.safeParse(body);
  if (!parsed.success) {
    const { status, body: errBody } = validationError(parsed.error);
    return NextResponse.json(errBody, { status });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({
    where:  { emailHash: hashEmail(email) },
    select: { id: true, deletedAt: true, emailEncrypted: true },
  });

  // Deleted accounts have their emailHash nulled, so they can't be found here.
  if (!user || user.deletedAt) {
    logger.info('password reset requested for unknown/deleted address');
    return NextResponse.json(NEUTRAL);
  }

  // Invalidate any earlier outstanding tokens, then issue a fresh one.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

  const rawToken = generateResetToken();
  await prisma.passwordResetToken.create({
    data: {
      userId:    user.id,
      tokenHash: hashResetToken(rawToken),
      expiresAt: resetTokenExpiry(),
    },
  });

  const origin = req.nextUrl.origin;
  const resetUrl = `${origin}/reset-password?token=${rawToken}`;

  // Send to the account's real (decrypted) address. Failure to send must not
  // crash the request or leak account existence — degrade gracefully.
  try {
    const recipient = user.emailEncrypted ? decryptEmail(user.emailEncrypted) : email;
    await sendPasswordResetEmail(recipient, resetUrl);
  } catch (err) {
    logger.error('password reset email dispatch failed', { userId: user.id, err: String(err) });
  }

  logger.info('password reset token issued', { userId: user.id });

  // Dev/CI/E2E convenience only — never in production.
  if (isTestOrDevEnv()) {
    return NextResponse.json({ ...NEUTRAL, devResetUrl: resetUrl });
  }
  return NextResponse.json(NEUTRAL);
}
