/**
 * Server-side database helpers for PromptArena.
 *
 * These utilities encapsulate multi-step Prisma operations that are reused
 * across several API routes so the logic lives in exactly one place.
 *
 * All functions in this file are server-only (no 'use client' directive).
 */

import { prisma } from '@/lib/prisma';
import { getLevel } from '@/lib/points';
import { logger } from '@/lib/logger';

/**
 * Awards points to a user and re-evaluates their level.
 *
 * Every user action (submit prompt, vote, usage recorded, challenge entry)
 * follows the same two-step pattern:
 *   1. Increment `totalPoints`
 *   2. Recalculate and persist the `level` label
 *
 * Extracting this into a helper ensures the pattern is applied consistently.
 *
 * @param userId - Database ID of the user receiving the points
 * @param points - Number of points to award (use constants from lib/points.ts)
 */
export async function awardPoints(userId: number, points: number): Promise<void> {
  const user = await prisma.user.update({
    where: { id: userId },
    data:  { totalPoints: { increment: points } },
  });

  const newLevel = getLevel(user.totalPoints);
  const prevLevel = user.level; // level before increment

  await prisma.user.update({
    where: { id: userId },
    data:  { level: newLevel },
  });

  logger.info('points awarded', { userId, points, total: user.totalPoints });

  if (prevLevel !== newLevel) {
    logger.info('level up', { userId, from: prevLevel, to: newLevel, total: user.totalPoints });
  }
}

/**
 * Computes the average rating for a list of vote values.
 *
 * @param votes - Array of vote records (must have a `value: number` field)
 * @returns Average rating rounded to one decimal place, or 0 if no votes.
 */
export function calcAvgRating(votes: { value: number }[]): number {
  if (votes.length === 0) return 0;
  const sum = votes.reduce((acc, v) => acc + v.value, 0);
  return Math.round((sum / votes.length) * 10) / 10;
}
