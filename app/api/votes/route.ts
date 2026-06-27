/**
 * POST /api/votes
 *
 * Records or updates a star rating (1–5) for a prompt.
 * Uses an upsert so a user can change their vote at any time.
 * Awards VOTE_ON_PROMPT points only for the FIRST vote (not for updates).
 *
 * Body: { promptId: number, userId: number, value: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { awardPoints } from '@/lib/db-helpers';
import { POINTS } from '@/lib/points';
import { VoteSchema, validationError } from '@/lib/validation';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { resolveUserId, USER_COOKIE } from '@/lib/user-auth';
import { logger, serializeError } from '@/lib/logger';

// @spec AC-03-001
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!writeLimiter.check(ip)) {
    logger.warn('rate limit hit', { route: 'POST /api/votes', ip });
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const result = VoteSchema.safeParse(body);
  if (!result.success) {
    const { status, body: errBody } = validationError(result.error);
    return NextResponse.json(errBody, { status });
  }

  const { promptId, value } = result.data;
  const reqId = req.headers.get('x-request-id') ?? undefined;

  const resolved = await resolveUserId(req.cookies.get(USER_COOKIE)?.value, result.data.userId);
  if (typeof resolved === 'object' && 'error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const userId = resolved;

  try {
    // The prompt must exist; voting on your own prompt is forbidden.
    // @spec AC-03-006 — enforced server-side, not only via the disabled UI button.
    const target = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { authorId: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }
    if (target.authorId === userId) {
      return NextResponse.json({ error: 'Cannot vote on your own prompt' }, { status: 403 });
    }

    // Check if a vote already exists BEFORE the upsert so we can decide
    // whether to award points. Points are only earned once per (prompt, user) pair.
    const existing = await prisma.vote.findUnique({
      where: { promptId_userId: { promptId, userId } },
    });

    const vote = await prisma.vote.upsert({
      where:  { promptId_userId: { promptId, userId } },
      update: { value },
      create: { promptId, userId, value },
    });

    // Award points only for the first vote, not for changes
    if (!existing) {
      await awardPoints(userId, POINTS.VOTE_ON_PROMPT);
      logger.info('vote cast', { promptId, userId, value, reqId });
    } else {
      logger.debug('vote updated', { promptId, userId, value, reqId });
    }

    return NextResponse.json(vote);
  } catch (err) {
    logger.error('vote failed', { promptId, userId, reqId, ...serializeError(err) });
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }
}
