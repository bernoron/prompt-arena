/**
 * Shared weekly-challenge logic for GET /api/challenges and Server
 * Components (Dashboard) that need the active challenge list directly.
 */

import { prisma } from '@/lib/prisma';
import type { WeeklyChallengeData } from '@/lib/types';

export async function getActiveChallenges(): Promise<WeeklyChallengeData[]> {
  const challenges = await prisma.weeklyChallenge.findMany({
    where:   { isActive: true },
    orderBy: { startDate: 'asc' },
    include: { _count: { select: { submissions: true } } },
  });

  return challenges.map((c) => ({
    ...c,
    submissionCount: c._count.submissions,
    startDate:       c.startDate.toISOString(),
    endDate:         c.endDate.toISOString(),
  }));
}
