/**
 * Shared user-listing logic for GET /api/users, GET /api/admin/users, and
 * Server Components (Dashboard, Leaderboard) that need the ranked user list
 * without a self-HTTP round trip.
 */

import { prisma } from '@/lib/prisma';
import { MAX_USERS_LIST } from '@/lib/constants';
import type { UserWithStats, LevelName } from '@/lib/types';

export async function getRankedUsers(): Promise<UserWithStats[]> {
  const users = await prisma.user.findMany({
    orderBy: { totalPoints: 'desc' },
    take: MAX_USERS_LIST,
    // Never expose credential or PII columns on a public endpoint.
    select: { id: true, name: true, avatarColor: true, totalPoints: true, level: true, createdAt: true },
  });

  return users.map((u) => ({
    ...u,
    level:     u.level as LevelName,
    createdAt: u.createdAt.toISOString(),
  }));
}
