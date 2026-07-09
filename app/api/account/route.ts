/**
 * DELETE /api/account — self-service account deletion (CR-002).
 *
 * Body: { password: string }
 *
 * Flow:
 *   1. Require a valid user session (you can only delete your OWN account).
 *   2. Re-authenticate with the current password (deliberate confirmation).
 *   3. Anonymise the account (tombstone): keep the row so authored prompts/votes
 *      stay referentially valid, but strip name → "Gelöschter Nutzer #<id>" and
 *      null all credential/PII columns; stamp deletedAt.
 *   4. Clear the session cookie → the user is logged out and, with credentials
 *      and emailHash removed, can never log in again.
 *
 * @spec AC-01-010, AC-01-011
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/route-auth';
import { verifyPassword } from '@/lib/password';
import { USER_COOKIE } from '@/lib/user-auth';
import { authLimiter, getClientIp } from '@/lib/rate-limit';
import { DeleteAccountSchema, validationError } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function DELETE(req: NextRequest) {
  // Stricter auth limiter: deletion is a sensitive, credential-checked action.
  if (!authLimiter.check(`account-delete:${getClientIp(req)}`)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const auth = await requireUser(req);
  if ('response' in auth) return auth.response;
  const { userId } = auth;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = DeleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    const { status, body: errBody } = validationError(parsed.error);
    return NextResponse.json(errBody, { status });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, deletedAt: true },
  });

  // No usable credential (already deleted, or a legacy account without a
  // password) → cannot confirm ownership → reject.
  if (!user || user.deletedAt || !user.passwordHash) {
    return NextResponse.json({ error: 'Konto konnte nicht bestätigt werden.' }, { status: 401 });
  }

  const passwordOk = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!passwordOk) {
    return NextResponse.json({ error: 'Passwort ist nicht korrekt.' }, { status: 401 });
  }

  // Anonymise (tombstone). Contributions remain, attributed to "Gelöschter Nutzer".
  await prisma.user.update({
    where: { id: userId },
    data: {
      name:           `Gelöschter Nutzer #${userId}`,
      passwordHash:   null,
      emailHash:      null,
      emailEncrypted: null,
      deletedAt:      new Date(),
    },
  });

  // Best-effort: drop any outstanding reset tokens for the gone account.
  await prisma.passwordResetToken.deleteMany({ where: { userId } });

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(USER_COOKIE);

  logger.info('account self-deleted', { userId });
  return res;
}
