/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user from the session cookie.
 * Used by Server Components to bootstrap the user identity server-side.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserCookie, USER_COOKIE } from '@/lib/user-auth';
import { readLimiter, getClientIp } from '@/lib/rate-limit';

// @spec AC-01-009, AC-01-012
export async function GET(req: NextRequest) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const cookieValue = req.cookies.get(USER_COOKIE)?.value;
  const userId = await verifyUserCookie(cookieValue);

  if (!userId) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, avatarColor: true, totalPoints: true, level: true, deletedAt: true },
  });

  // A still-valid cookie for a since-deleted account resolves to no user.
  if (!user || user.deletedAt) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: { id: user.id, name: user.name, avatarColor: user.avatarColor, totalPoints: user.totalPoints, level: user.level } });
}
