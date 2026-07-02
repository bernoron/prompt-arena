/**
 * GET  /api/prompts   – Fetch prompts (cursor-based pagination)
 * POST /api/prompts   – Create a new prompt
 *
 * GET query params:
 *   category  – Filter by category name (omit or "all" = no filter)
 *   search    – Full-text search across title, titleEn, and content (max 50 results)
 *   userId    – When provided, includes the user's own vote and favorite status
 *   sortBy    – "newest" (default) | "most-used"
 *   cursor    – Prompt ID to paginate from (exclusive lower bound for newest; upper for most-used)
 *   take      – Number of results per page (default 20, max 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { awardPoints } from '@/lib/db-helpers';
import { POINTS } from '@/lib/points';
import { CreatePromptSchema, PathId, validationError } from '@/lib/validation';
import { readLimiter, writeLimiter, getClientIp } from '@/lib/rate-limit';
import { resolveUserId, USER_COOKIE } from '@/lib/user-auth';
import { optionalUser } from '@/lib/route-auth';
import { logger, serializeError } from '@/lib/logger';

// ─── GET /api/prompts ────────────────────────────────────────────────────────

// @spec AC-02-002, AC-02-003, AC-02-004, AC-02-005, AC-02-006, AC-03-002, AC-05-003
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!readLimiter.check(ip)) {
    logger.warn('rate limit hit', { route: 'GET /api/prompts', ip });
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search   = searchParams.get('search')?.slice(0, 100); // Cap search term length
  const userId   = searchParams.get('userId');
  const sortBy   = searchParams.get('sortBy') ?? 'newest';
  const cursorRaw = searchParams.get('cursor');
  const takeRaw   = searchParams.get('take');

  if (!['newest', 'most-used'].includes(sortBy)) {
    return NextResponse.json({ error: 'Invalid sortBy' }, { status: 400 });
  }

  // Clamp page size: default 20, min 1, max 50.
  const parsedTake = Number.parseInt(takeRaw ?? '20', 10);
  const take = Math.min(Math.max(Number.isFinite(parsedTake) ? parsedTake : 20, 1), 50);

  let cursor: number | undefined;
  if (cursorRaw) {
    const parsedCursor = Number.parseInt(cursorRaw, 10);
    if (!Number.isFinite(parsedCursor) || parsedCursor <= 0) {
      return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 });
    }
    cursor = parsedCursor;
  }

  // Validate optional userId query param. When present it must match the
  // signed session cookie; otherwise userVote/userFavorite would be an IDOR.
  let requestedUserId: number | null = null;
  if (userId) {
    const idResult = PathId.safeParse(userId);
    if (!idResult.success) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }
    requestedUserId = idResult.data;
  }

  const userAuth = await optionalUser(req, requestedUserId);
  if ('response' in userAuth) return userAuth.response;
  const resolvedUserId = userAuth.userId;

  try {
    const prompts = await prisma.prompt.findMany({
      where: {
        ...(category && category !== 'all' ? { category } : {}),
        ...(search ? {
          OR: [
            { title:   { contains: search } },
            { titleEn: { contains: search } },
            { content: { contains: search } },
          ],
        } : {}),
      },
      include: {
        author: { select: { id: true, name: true, avatarColor: true } },
      },
      orderBy: sortBy === 'most-used'
        ? [{ usageCount: 'desc' }, { id: 'desc' }]
        : [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1, // fetch one extra to determine if there's a next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    // Determine pagination state
    const hasNextPage = prompts.length > take;
    const page = hasNextPage ? prompts.slice(0, take) : prompts;
    const nextCursor = hasNextPage ? page[page.length - 1]?.id : null;

    const promptIds = page.map((p) => p.id);
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

    const userVoteMap = resolvedUserId && promptIds.length
      ? new Map(
          (await prisma.vote.findMany({
            where: { userId: resolvedUserId, promptId: { in: promptIds } },
            select: { promptId: true, value: true },
          })).map((v) => [v.promptId, v.value]),
        )
      : new Map<number, number>();

    // Pre-fetch the user's favorites set for O(1) lookup per prompt
    const favSet = resolvedUserId
      ? new Set(
          (await prisma.favorite.findMany({
            where: { userId: resolvedUserId, isActive: true, promptId: { in: promptIds } },
            select: { promptId: true },
          })).map((f) => f.promptId)
        )
      : new Set<number>();

    const items = page.map((p) => {
      const rating = ratingMap.get(p.id) ?? { avgRating: 0, voteCount: 0 };
      return {
        ...p,
        avgRating:    rating.avgRating,
        voteCount:    rating.voteCount,
        userVote:     resolvedUserId ? (userVoteMap.get(p.id) ?? null) : null,
        userFavorite: resolvedUserId ? favSet.has(p.id) : undefined,
        createdAt:    p.createdAt.toISOString(),
      };
    });

    // Only cache when response is not user-specific (no userVote personalisation)
    const cacheHeaders: HeadersInit = resolvedUserId
      ? {}
      : { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60' };

    return NextResponse.json({ items, nextCursor, hasNextPage }, { headers: cacheHeaders });
  } catch (err) {
    logger.error('failed to fetch prompts', serializeError(err));
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

// ─── POST /api/prompts ───────────────────────────────────────────────────────

// @spec AC-02-001, AC-06-002, AC-06-003
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!writeLimiter.check(ip)) {
    logger.warn('rate limit hit', { route: 'POST /api/prompts', ip });
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const result = CreatePromptSchema.safeParse(body);
  if (!result.success) {
    const { status, body: errBody } = validationError(result.error);
    return NextResponse.json(errBody, { status });
  }

  const reqId = req.headers.get('x-request-id') ?? undefined;

  const resolved = await resolveUserId(req.cookies.get(USER_COOKIE)?.value, result.data.authorId);
  if (typeof resolved === 'object' && 'error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const { title, titleEn, content, contentEn, category, difficulty, challengeId } = result.data;
  const authorId = resolved;

  try {
    // Validate challenge if provided: must exist and still be active
    if (challengeId !== undefined) {
      const challenge = await prisma.weeklyChallenge.findUnique({
        where: { id: challengeId },
      });
      if (!challenge) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
      }
      if (!challenge.isActive) {
        return NextResponse.json({ error: 'Challenge is no longer active' }, { status: 400 });
      }
    }

    const categoryExists = await prisma.promptCategory.findUnique({
      where: { slug: category },
      select: { id: true },
    });
    if (!categoryExists) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }

    const prompt = await prisma.prompt.create({
      data: { title, titleEn: titleEn ?? title, content, contentEn: contentEn ?? content, category, difficulty, authorId },
      include: {
        author: {
          select: { id: true, name: true, avatarColor: true },
        },
      },
    });

    await awardPoints(authorId, POINTS.SUBMIT_PROMPT);

    // Optionally link to the active weekly challenge
    if (challengeId !== undefined) {
      await prisma.challengeSubmission.create({
        data: { challengeId, promptId: prompt.id, userId: authorId },
      });
      await awardPoints(authorId, POINTS.CHALLENGE_SUBMIT);
    }

    logger.info('prompt created', { promptId: prompt.id, authorId, category, difficulty, challengeId, reqId });
    return NextResponse.json({ ...prompt, createdAt: prompt.createdAt.toISOString() }, { status: 201 });
  } catch (err) {
    logger.error('prompt creation failed', { authorId, reqId, ...serializeError(err) });
    return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
  }
}
