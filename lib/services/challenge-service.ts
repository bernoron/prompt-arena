/**
 * Weekly-challenge read logic, shared between GET /api/challenges and the
 * dashboard Server Component.
 */

import { prisma } from '@/lib/prisma';
import type { WeeklyChallengeData } from '@/lib/types';

/**
 * All currently active weekly challenges (multiple can be active at once),
 * ordered by start date, each with its submission count.
 */
export async function getActiveChallenges(): Promise<WeeklyChallengeData[]> {
  const challenges = await prisma.weeklyChallenge.findMany({
    where:   { isActive: true },
    orderBy: { startDate: 'asc' },
    include: { _count: { select: { submissions: true } } },
  });

  return challenges.map((c) => ({
    id:              c.id,
    title:           c.title,
    description:     c.description,
    isActive:        c.isActive,
    submissionCount: c._count.submissions,
    startDate:       c.startDate.toISOString(),
    endDate:         c.endDate.toISOString(),
  }));
}
