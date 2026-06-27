/**
 * Server-side database helpers for PromptArena.
 *
 * These utilities encapsulate multi-step Prisma operations that are reused
 * across several API routes so the logic lives in exactly one place.
 *
 * All functions in this file are server-only (no 'use client' directive).
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getLevel } from '@/lib/points';
import { logger } from '@/lib/logger';

/**
 * Prisma interactive-transaction client type.
 * Allows awardPoints to run either standalone (own transaction) or
 * inside a caller-managed transaction (pass the tx object).
 */
type TxClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

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
 * @param txClient - Optional Prisma transaction client. When provided the
 *                   caller is responsible for the transaction boundary; no
 *                   nested transaction is created.
 */
// @spec AC-04-001
export async function awardPoints(
  userId: number,
  points: number,
  txClient?: TxClient,
): Promise<void> {
  const run = async (tx: TxClient) => {
    const user = await tx.user.update({
      where: { id: userId },
      data:  { totalPoints: { increment: points } },
    });
    const newLevel = getLevel(user.totalPoints);
    // Only write level to DB when it actually changed (PERF-002)
    if (user.level !== newLevel) {
      await tx.user.update({
        where: { id: userId },
        data:  { level: newLevel },
      });
    }
    return { ...user, level: newLevel };
  };

  const updatedUser = txClient
    ? await run(txClient)
    : await prisma.$transaction(run);

  logger.info('points awarded', { userId, points, total: updatedUser.totalPoints });

  if (updatedUser.level !== getLevel(updatedUser.totalPoints - points)) {
    logger.info('level up', {
      userId,
      from: getLevel(updatedUser.totalPoints - points),
      to:   updatedUser.level,
      total: updatedUser.totalPoints,
    });
  }
}

// Re-export Prisma for convenience in files that import from here
export type { Prisma };

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
