/**
 * GET  /api/favorites?userId=<id>  – Fetch all favorited prompts for a user
 * POST /api/favorites               – Toggle a prompt as favorite (add / remove)
 *
 * POST body: { promptId: number, userId: number }
 *
 * Idempotent point distribution:
 *   The FIRST time a user favorites a prompt the prompt author receives
 *   FAVORITE_PROMPT points. Removing and re-adding a favorite does NOT
 *   award points again. We track this via the `pointsAwarded` flag on the
 *   Favorite row, which persists even after soft-deletion (isActive = false).
 *
 * Soft-delete pattern:
 *   Favorites are never hard-deleted. "Remove" sets isActive = false so the
 *   pointsAwarded history is preserved. "Add" sets isActive = true (upsert).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { awardPoints } from '@/lib/db-helpers';
import { POINTS } from '@/lib/points';
import { FavoriteSchema, validationError } from '@/lib/validation';
import { writeLimiter, readLimiter, getClientIp } from '@/lib/rate-limit';
import { resolveUserId, USER_COOKIE } from '@/lib/user-auth';
import { parseOptionalPositiveInt, requireUser } from '@/lib/route-auth';
import { logger, serializeError } from '@/lib/logger';

// ─── GET /api/favorites ──────────────────────────────────────────────────────

// @spec AC-05-002
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!readLimiter.check(ip)) {
    logger.warn('rate limit hit', { route: 'GET /api/favorites', ip });
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const requestedUserId = parseOptionalPositiveInt(
    new URL(req.url).searchParams.get('userId'),
    'userId',
  );
  if (requestedUserId instanceof NextResponse) return requestedUserId;

  const auth = await requireUser(req, requestedUserId);
  if ('response' in auth) return auth.response;
  const parsedUserId = auth.userId;

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: parsedUserId, isActive: true },
      include: {
        prompt: {
          include: {
            author: { select: { id: true, name: true, avatarColor: true, department: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const promptIds = favorites.map(({ prompt }) => prompt.id);
    const ratingRows = promptIds.length
      ? await prisma.vote.groupBy({
          by: ['promptId'],
          where: { promptId: { in: promptIds } },
          _avg: { value: true },
          _count: { value: true },
        })
      : [];
    const ratingMap = new Map(
      ratingRows.map((row) => [
        row.promptId,
        {
          avgRating: row._avg.value ? Math.round(row._avg.value * 10) / 10 : 0,
          voteCount: row._count.value,
        },
      ]),
    );

    const userVoteMap = promptIds.length
      ? new Map(
          (await prisma.vote.findMany({
            where: { userId: parsedUserId, promptId: { in: promptIds } },
            select: { promptId: true, value: true },
          })).map((v) => [v.promptId, v.value]),
        )
      : new Map<number, number>();

    const result = favorites.map(({ prompt }) => {
      const rating = ratingMap.get(prompt.id) ?? { avgRating: 0, voteCount: 0 };
      return {
        ...prompt,
        avgRating:   rating.avgRating,
        voteCount:   rating.voteCount,
        userVote:    userVoteMap.get(prompt.id) ?? null,
        userFavorite: true,
        createdAt:   prompt.createdAt.toISOString(),
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error('failed to fetch favorites', serializeError(err));
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// ─── POST /api/favorites ─────────────────────────────────────────────────────

// @spec AC-05-001, AC-05-007
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!writeLimiter.check(ip)) {
    logger.warn('rate limit hit', { route: 'POST /api/favorites', ip });
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const result = FavoriteSchema.safeParse(body);
  if (!result.success) {
    const { status, body: errBody } = validationError(result.error);
    return NextResponse.json(errBody, { status });
  }

  const reqId = req.headers.get('x-request-id') ?? undefined;

  const resolved = await resolveUserId(req.cookies.get(USER_COOKIE)?.value, result.data.userId);
  if (typeof resolved === 'object' && 'error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const { promptId } = result.data;
  const userId = resolved;

  try {
    // Look up any existing record (active OR soft-deleted) for this pair
    const existing = await prisma.favorite.findUnique({
      where: { promptId_userId: { promptId, userId } },
    });

    if (existing?.isActive) {
      // ── Remove favorite (soft-delete) ─────────────────────────────────────
      // pointsAwarded is preserved so re-adding won't trigger another payout.
      await prisma.favorite.update({
        where: { promptId_userId: { promptId, userId } },
        data:  { isActive: false },
      });
      logger.debug('favorite removed', { promptId, userId, reqId });
      return NextResponse.json({ favorited: false });
    }

    if (existing && !existing.isActive) {
      // ── Re-add favorite (un-soft-delete) ──────────────────────────────────
      // Points were already awarded on the first-ever favorite — skip award.
      await prisma.favorite.update({
        where: { promptId_userId: { promptId, userId } },
        data:  { isActive: true },
      });
      logger.debug('favorite re-added (no points — already awarded)', { promptId, userId, reqId });
      return NextResponse.json({ favorited: true });
    }

    // ── First-ever favorite ────────────────────────────────────────────────
    // Create the record and — atomically — award points to the author.
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { authorId: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.favorite.create({
        data: { promptId, userId, isActive: true, pointsAwarded: true },
      });
      // Only award if the author isn't the same user who favorited
      if (prompt && prompt.authorId !== userId) {
        await awardPoints(prompt.authorId, POINTS.FAVORITE_PROMPT, tx);
      }
    });

    logger.info('favorite added (points awarded)', { promptId, userId, reqId });
    return NextResponse.json({ favorited: true });
  } catch (err) {
    logger.error('favorite toggle failed', { promptId, userId, reqId, ...serializeError(err) });
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}
