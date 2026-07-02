/**
 * Server-side session lookup.
 *
 * Single source of truth for "who is the current user" — every Server
 * Component that needs identity calls getSessionUser() once; the result is
 * handed to <SessionProvider> so client components read it via context
 * instead of mirroring the cookie into localStorage.
 */

import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/user-auth';
import type { UserWithStats, LevelName } from '@/lib/types';

export async function getSessionUser(): Promise<UserWithStats | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, avatarColor: true, totalPoints: true, level: true, createdAt: true },
  });
  if (!user) return null;

  return {
    ...user,
    level:     user.level as LevelName,
    createdAt: user.createdAt.toISOString(),
  };
}
