/**
 * POST /api/usage
 *
 * Records that the current user copied and used a prompt.
 * The first use per user/prompt increments usageCount and awards PROMPT_USED
 * points to the prompt author. Repeated uses by the same user are idempotent.
 *
 * Body: { promptId: number, userId: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { awardPoints } from '@/lib/db-helpers';
import { POINTS } from '@/lib/points';
import { UsageSchema, validationError } from '@/lib/validation';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { resolveUserId, USER_COOKIE } from '@/lib/user-auth';
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

  const resolved = await resolveUserId(req.cookies.get(USER_COOKIE)?.value, result.data.userId);
  if (typeof resolved === 'object' && 'error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const userId = resolved;

  try {
    const prompt = await prisma.$transaction(async (tx) => {
      await tx.usageEvent.create({
        data: { promptId, userId },
      });

      const updated = await tx.prompt.update({
        where: { id: promptId },
        data: { usageCount: { increment: 1 } },
      });

      await awardPoints(updated.authorId, POINTS.PROMPT_USED, tx);
      return updated;
    });

    logger.info('prompt used', {
      promptId,
      userId,
      authorId: prompt.authorId,
      usageCount: prompt.usageCount,
      reqId,
    });
    return NextResponse.json({ usageCount: prompt.usageCount, alreadyRecorded: false });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
        select: { usageCount: true },
      });
      if (!prompt) {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
      }

      logger.debug('usage already recorded', { promptId, userId, reqId });
      return NextResponse.json({ usageCount: prompt.usageCount, alreadyRecorded: true });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    logger.error('usage record failed', { promptId, userId, reqId, ...serializeError(err) });
    return NextResponse.json({ error: 'Failed to record usage' }, { status: 500 });
  }
}
