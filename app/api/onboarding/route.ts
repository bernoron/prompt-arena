/**
 * POST /api/onboarding
 *
 * Marks the first-login onboarding funnel as done (completed or skipped —
 * both are treated the same way) for the current session user.
 *
 * No body: the user comes from the session cookie, like POST /api/usage.
 * Idempotent — calling it again just refreshes the timestamp.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { requireUser } from '@/lib/route-auth';
import { logger } from '@/lib/logger';

// @spec AC-14-007
export async function POST(req: NextRequest) {
  if (!writeLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const auth = await requireUser(req);
  if ('response' in auth) return auth.response;

  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: { onboardingCompletedAt: new Date() },
    select: { onboardingCompletedAt: true },
  });

  logger.info('onboarding completed', { userId: auth.userId });
  return NextResponse.json({ ok: true, onboardingCompletedAt: user.onboardingCompletedAt });
}
