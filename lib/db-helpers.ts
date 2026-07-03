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
 * Identifies a one-time point award for PointsLedger deduplication.
 * `refId` meaning depends on `action` — see call sites (vote: promptId,
 * favorite: the Favorite row's own id, lesson completion: lessonId).
 */
export interface AwardIdempotencyKey {
  action: 'VOTE' | 'FAVORITE' | 'LESSON_COMPLETE';
  refId: number;
}

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
 * When `idempotencyKey` is supplied, the award is additionally guarded by a
 * unique row in PointsLedger: a duplicate (userId, action, refId) hits a DB
 * constraint violation and the award is skipped instead of double-counted.
 * This closes the check-then-act race a plain "does a row already exist?"
 * pre-check has under real concurrency — the caller's own pre-check (if any)
 * can stay for the common case; this is the actual guarantee.
 *
 * @param userId - Database ID of the user receiving the points
 * @param points - Number of points to award (use constants from lib/points.ts)
 * @param txClient - Optional Prisma transaction client. When provided the
 *                   caller is responsible for the transaction boundary; no
 *                   nested transaction is created.
 * @param idempotencyKey - Optional one-time-award guard (see above).
 */
// @spec AC-04-001
export async function awardPoints(
  userId: number,
  points: number,
  txClient?: TxClient,
  idempotencyKey?: AwardIdempotencyKey,
): Promise<{ awarded: boolean }> {
  const run = async (tx: TxClient) => {
    if (idempotencyKey) {
      try {
        await tx.pointsLedger.create({
          data: { userId, action: idempotencyKey.action, refId: idempotencyKey.refId, delta: points },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          return { awarded: false as const };
        }
        throw err;
      }
    }

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
    return { awarded: true as const, user: { ...user, level: newLevel } };
  };

  const result = txClient ? await run(txClient) : await prisma.$transaction(run);

  if (!result.awarded) {
    logger.debug('points award skipped (already awarded)', { userId, ...idempotencyKey });
    return { awarded: false };
  }

  logger.info('points awarded', { userId, points, total: result.user.totalPoints });

  if (result.user.level !== getLevel(result.user.totalPoints - points)) {
    logger.info('level up', {
      userId,
      from: getLevel(result.user.totalPoints - points),
      to:   result.user.level,
      total: result.user.totalPoints,
    });
  }

  return { awarded: true };
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
