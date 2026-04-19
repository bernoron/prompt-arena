/**
 * GET /api/challenges
 *
 * Returns all currently active weekly challenges (multiple can be active
 * simultaneously). Includes submission counts per challenge.
 * Returns an empty array when none are active.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readLimiter, getClientIp } from '@/lib/rate-limit';

// @spec AC-06-001
export async function GET(req: NextRequest) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const challenges = await prisma.weeklyChallenge.findMany({
      where:   { isActive: true },
      orderBy: { startDate: 'asc' },
      include: { _count: { select: { submissions: true } } },
    });

    return NextResponse.json(challenges.map((c) => ({
      ...c,
      submissionCount: c._count.submissions,
      startDate: c.startDate.toISOString(),
      endDate:   c.endDate.toISOString(),
    })));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}
