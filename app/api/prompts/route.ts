/**
 * GET  /api/prompts   – Fetch all prompts (with optional filters)
 * POST /api/prompts   – Create a new prompt
 *
 * GET query params:
 *   category  – Filter by category name (omit or "all" = no filter)
 *   search    – Full-text search across title, titleEn, and content
 *   userId    – When provided, includes the user's own vote on each prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { awardPoints, calcAvgRating } from '@/lib/db-helpers';
import { POINTS } from '@/lib/points';
import { CreatePromptSchema, PathId, validationError } from '@/lib/validation';
import { readLimiter, writeLimiter, getClientIp } from '@/lib/rate-limit';
import { logger, serializeError } from '@/lib/logger';

// ─── GET /api/prompts ────────────────────────────────────────────────────────

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
        votes: true,
      },
      orderBy: sortBy === 'most-used' ? { usageCount: 'desc' } : { createdAt: 'desc' },
    });

    const result = prompts.map((p) => ({
      ...p,
      votes:     undefined, // Remove raw vote rows from the response
      avgRating: calcAvgRating(p.votes),
      voteCount: p.votes.length,
      userVote:  parsedUserId ? (p.votes.find((v) => v.userId === parsedUserId)?.value ?? null) : null,
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (err) {
    logger.error('failed to fetch prompts', serializeError(err));
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

// ─── POST /api/prompts ───────────────────────────────────────────────────────

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

  const { title, titleEn, content, contentEn, category, difficulty, authorId, challengeId } = result.data;
  const reqId = req.headers.get('x-request-id') ?? undefined;

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
