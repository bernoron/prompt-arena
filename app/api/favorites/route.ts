/**
 * GET  /api/favorites?userId=<id>  – Fetch all favorited prompts for a user
 * POST /api/favorites               – Toggle a prompt as favorite (add / remove)
 *
 * POST body: { promptId: number, userId: number }
 *
 * The first time a user favorites a prompt the prompt author receives
 * FAVORITE_PROMPT points. Removing and re-adding a favorite does NOT
 * award points again (idempotent point distribution).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { awardPoints, calcAvgRating } from '@/lib/db-helpers';
import { POINTS } from '@/lib/points';
import { FavoriteSchema, PathId, validationError } from '@/lib/validation';
import { writeLimiter, readLimiter, getClientIp } from '@/lib/rate-limit';
import { logger, serializeError } from '@/lib/logger';

// ─── GET /api/favorites ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!readLimiter.check(ip)) {
    logger.warn('rate limit hit', { route: 'GET /api/favorites', ip });
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const userId = new URL(req.url).searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const idResult = PathId.safeParse(userId);
  if (!idResult.success) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  }
  const parsedUserId = idResult.data;

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: parsedUserId },
      include: {
        prompt: {
          include: {
            author: { select: { id: true, name: true, avatarColor: true, department: true } },
            votes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = favorites.map(({ prompt }) => ({
      ...prompt,
      votes:       undefined,
      avgRating:   calcAvgRating(prompt.votes),
      voteCount:   prompt.votes.length,
      userVote:    prompt.votes.find((v) => v.userId === parsedUserId)?.value ?? null,
      userFavorite: true,
      createdAt:   prompt.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (err) {
    logger.error('failed to fetch favorites', serializeError(err));
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// ─── POST /api/favorites ─────────────────────────────────────────────────────

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

  const { promptId, userId } = result.data;
  const reqId = req.headers.get('x-request-id') ?? undefined;

  try {
    const existing = await prisma.favorite.findUnique({
      where: { promptId_userId: { promptId, userId } },
    });

    if (existing) {
      // Remove favorite – no points deducted
      await prisma.favorite.delete({ where: { promptId_userId: { promptId, userId } } });
      logger.debug('favorite removed', { promptId, userId, reqId });
      return NextResponse.json({ favorited: false });
    }

    // Add favorite
    await prisma.favorite.create({ data: { promptId, userId } });

    // Award author points (only on first-ever favorite — never on re-adding)
    const prompt = await prisma.prompt.findUnique({ where: { id: promptId }, select: { authorId: true } });
    if (prompt && prompt.authorId !== userId) {
      await awardPoints(prompt.authorId, POINTS.FAVORITE_PROMPT);
    }

    logger.info('favorite added', { promptId, userId, reqId });
    return NextResponse.json({ favorited: true });
  } catch (err) {
    logger.error('favorite toggle failed', { promptId, userId, reqId, ...serializeError(err) });
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}
