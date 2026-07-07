/**
 * User read logic, shared between GET /api/users and the Server Components
 * (dashboard, leaderboard) that need the points-ranked user list directly —
 * without a self-HTTP round trip.
 */

import { prisma } from '@/lib/prisma';
import type { UserWithStats, LevelName } from '@/lib/types';

/**
 * All users ordered by points (leaderboard order). Never selects credential
 * or PII columns — this feeds a public endpoint and the leaderboard UI.
 *
 * `limit` bounds the worst-case payload/query. The default is generous enough
 * that rank computation for the whole community stays correct while still
 * capping an unbounded scan.
 */
export async function listUsers(limit = 500): Promise<UserWithStats[]> {
  const users = await prisma.user.findMany({
    orderBy: { totalPoints: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      avatarColor: true,
      totalPoints: true,
      level: true,
      createdAt: true,
    },
  });

  return users.map((u) => ({
    ...u,
    level: u.level as LevelName,
    createdAt: u.createdAt.toISOString(),
  }));
}
