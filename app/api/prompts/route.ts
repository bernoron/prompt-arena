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
import { awardPoints, calcAvgRating } from '@/lib/db-helpers';
import { POINTS } from '@/lib/points';
import { CreatePromptSchema, PathId, validationError } from '@/lib/validation';
import { readLimiter, writeLimiter, getClientIp } from '@/lib/rate-limit';
import { resolveUserId, USER_COOKIE } from '@/lib/user-auth';
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

  // Clamp page size: default 20, max 50 (search results always capped at 50)
  const take = Math.min(parseInt(takeRaw ?? '20', 10) || 20, search ? 50 : 50);
  const cursor = cursorRaw ? parseInt(cursorRaw, 10) : undefined;

  // Validate optional userId query param
  let parsedUserId: number | null = null;
  if (userId) {
    const idResult = PathId.safeParse(userId);
    if (!idResult.success) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }
    parsedUserId = idResult.data;
  }

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
        author: { select: { id: true, name: true, avatarColor: true, department: true } },
        votes: { select: { value: true, userId: true } }, // @fix N+1: load only needed fields
      },
      orderBy: sortBy === 'most-used' ? { usageCount: 'desc' } : { createdAt: 'desc' },
      take: take + 1, // fetch one extra to determine if there's a next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    // Determine pagination state
    const hasNextPage = prompts.length > take;
    const page = hasNextPage ? prompts.slice(0, take) : prompts;
    const nextCursor = hasNextPage ? page[page.length - 1]?.id : null;

    // Pre-fetch the user's favorites set for O(1) lookup per prompt
    const favSet = parsedUserId
      ? new Set(
          (await prisma.favorite.findMany({
            where: { userId: parsedUserId, isActive: true },
            select: { promptId: true },
          })).map((f) => f.promptId)
        )
      : new Set<number>();

    const items = page.map((p) => ({
      ...p,
      votes:        undefined, // Remove raw vote rows from the response
      avgRating:    calcAvgRating(p.votes),
      voteCount:    p.votes.length,
      userVote:     parsedUserId ? (p.votes.find((v) => v.userId === parsedUserId)?.value ?? null) : null,
      userFavorite: parsedUserId ? favSet.has(p.id) : undefined,
      createdAt:    p.createdAt.toISOString(),
    }));

    // Only cache when response is not user-specific (no userVote personalisation)
    const cacheHeaders: HeadersInit = parsedUserId
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

    const prompt = await prisma.prompt.create({
      data: { title, titleEn: titleEn ?? title, content, contentEn: contentEn ?? content, category, difficulty, authorId },
      include: { author: true },
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
