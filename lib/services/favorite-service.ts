/**
 * Favorite business logic: listing a user's favorited prompts and the
 * toggle-with-idempotent-points flow.
 *
 * Soft-delete pattern: favorites are never hard-deleted. "Remove" sets
 * isActive = false so the pointsAwarded history is preserved. "Add" sets
 * isActive = true (upsert-like via existing-row check).
 */

import { prisma } from '@/lib/prisma';
import { awardPoints } from '@/lib/db-helpers';
import { POINTS } from '@/lib/points';
import { getRatingsMap, getRating } from './rating-service';
import { getUserVoteMap } from './prompt-service';

const AUTHOR_SELECT = { id: true, name: true, avatarColor: true } as const;

export async function listFavorites(userId: number) {
  const favorites = await prisma.favorite.findMany({
    where: { userId, isActive: true },
    include: {
      prompt: { include: { author: { select: AUTHOR_SELECT } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const promptIds = favorites.map(({ prompt }) => prompt.id);
  const [ratings, userVoteMap] = await Promise.all([
    getRatingsMap(promptIds),
    getUserVoteMap(userId, promptIds),
  ]);

  return favorites.map(({ prompt }) => {
    const rating = getRating(ratings, prompt.id);
    return {
      ...prompt,
      avgRating:    rating.avgRating,
      voteCount:    rating.voteCount,
      userVote:     userVoteMap.get(prompt.id) ?? null,
      userFavorite: true,
      createdAt:    prompt.createdAt.toISOString(),
    };
  });
}

export interface ToggleFavoriteResult {
  favorited: boolean;
}

/**
 * Toggles a prompt's favorite status for a user.
 *
 *   - No row yet              → create (active) + award points to the author
 *   - Active row exists       → soft-delete (remove), no point change
 *   - Soft-deleted row exists  → reactivate, no point change (already awarded once)
 */
export async function toggleFavorite(promptId: number, userId: number): Promise<ToggleFavoriteResult> {
  const existing = await prisma.favorite.findUnique({
    where: { promptId_userId: { promptId, userId } },
  });

  if (existing?.isActive) {
    await prisma.favorite.update({
      where: { promptId_userId: { promptId, userId } },
      data:  { isActive: false },
    });
    return { favorited: false };
  }

  if (existing && !existing.isActive) {
    await prisma.favorite.update({
      where: { promptId_userId: { promptId, userId } },
      data:  { isActive: true },
    });
    return { favorited: true };
  }

  // First-ever favorite: create the record and — atomically — award points.
  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    select: { authorId: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.favorite.create({
      data: { promptId, userId, isActive: true, pointsAwarded: true },
    });
    if (prompt && prompt.authorId !== userId) {
      await awardPoints(prompt.authorId, POINTS.FAVORITE_PROMPT, tx);
    }
  });

  return { favorited: true };
}
