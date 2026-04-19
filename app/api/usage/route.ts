/**
 * POST /api/usage
 *
 * Records that the current user copied and used a prompt.
 * Increments the prompt's usageCount and awards PROMPT_USED points
 * to the prompt's author (not the user pressing the button).
 *
 * Body: { promptId: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { awardPoints } from '@/lib/db-helpers';
import { POINTS } from '@/lib/points';
import { UsageSchema, validationError } from '@/lib/validation';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { logger, serializeError } from '@/lib/logger';

// @spec AC-04-008
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!writeLimiter.check(ip)) {
    logger.warn('rate limit hit', { route: 'POST /api/usage', ip });
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const result = UsageSchema.safeParse(body);
  if (!result.success) {
    const { status, body: errBody } = validationError(result.error);
    return NextResponse.json(errBody, { status });
  }

  const { promptId } = result.data;
  const reqId = req.headers.get('x-request-id') ?? undefined;

  try {
    const prompt = await prisma.prompt.update({
      where: { id: promptId },
      data:  { usageCount: { increment: 1 } },
    });

    // Reward the author, not the user who clicked the button
    await awardPoints(prompt.authorId, POINTS.PROMPT_USED);

    logger.info('prompt used', { promptId, authorId: prompt.authorId, usageCount: prompt.usageCount, reqId });
    return NextResponse.json({ usageCount: prompt.usageCount });
  } catch (err) {
    logger.error('usage record failed', { promptId, reqId, ...serializeError(err) });
    return NextResponse.json({ error: 'Failed to record usage' }, { status: 500 });
  }
}
