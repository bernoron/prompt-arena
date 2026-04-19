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

  const { promptId, userId, value } = result.data;
  const reqId = req.headers.get('x-request-id') ?? undefined;

  try {
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
