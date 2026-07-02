/**
 * GET /api/admin/users
 *
 * Returns all users with decrypted email addresses.
 * Protected by the middleware admin guard AND a secondary in-handler check
 * (defence in depth — middleware can be bypassed by misconfiguration).
 *
 * @spec AC-12-006
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decryptEmail } from '@/lib/email-crypto';
import { isAdminAuthorised, ADMIN_COOKIE } from '@/lib/admin-auth';
import { readLimiter, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  // Secondary auth guard — middleware is the first line but not the only one
  const authorised = await isAdminAuthorised(req.cookies.get(ADMIN_COOKIE)?.value);
  if (!authorised) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const users = await prisma.user.findMany({
    orderBy: { totalPoints: 'desc' },
    select: {
      id: true, name: true, avatarColor: true,
      totalPoints: true, level: true, createdAt: true,
      emailEncrypted: true, // needed for decryption; stripped from response below
    },
  });

  let decryptFailures = 0;
  const result = users.map((u) => {
    let emailDecrypted: string | null = null;
    if (u.emailEncrypted) {
      try {
        emailDecrypted = decryptEmail(u.emailEncrypted);
      } catch (err) {
        decryptFailures++;
        logger.warn('email decrypt failed', { userId: u.id, err: String(err) });
      }
    }
    return {
      id: u.id, name: u.name,
      avatarColor: u.avatarColor, totalPoints: u.totalPoints,
      level: u.level, createdAt: u.createdAt, emailDecrypted,
      // emailEncrypted intentionally omitted from response
    };
  });

  if (decryptFailures > 0) {
    logger.error(`email decrypt failed for ${decryptFailures}/${users.length} users — check EMAIL_SECRET`);
  }

  return NextResponse.json(result);
}
