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
import { CreatePromptSchema, PathId, validationError } from '@/lib/validation';
import { readLimiter, writeLimiter, getClientIp } from '@/lib/rate-limit';
import { optionalUser, requireUser } from '@/lib/route-auth';
import { logger, serializeError } from '@/lib/logger';
import { listPrompts, createPrompt } from '@/lib/services/prompt-service';

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
    const { items, nextCursor, hasNextPage } = await listPrompts({
      category, search, sortBy: sortBy as 'newest' | 'most-used', cursor, take, resolvedUserId,
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

  const auth = await requireUser(req);
  if ('response' in auth) return auth.response;
  const { title, titleEn, content, contentEn, category, difficulty, challengeId } = result.data;
  const authorId = auth.userId;

  try {
    const created = await createPrompt({ title, titleEn, content, contentEn, category, difficulty, authorId, challengeId });
    if (!created.ok) {
      return NextResponse.json({ error: created.error }, { status: created.status });
    }

    const { prompt } = created;
    logger.info('prompt created', { promptId: prompt.id, authorId, category, difficulty, challengeId, reqId });
    return NextResponse.json({ ...prompt, createdAt: prompt.createdAt.toISOString() }, { status: 201 });
  } catch (err) {
    logger.error('prompt creation failed', { authorId, reqId, ...serializeError(err) });
    return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
  }
}
