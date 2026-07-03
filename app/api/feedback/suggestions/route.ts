/**
 * POST /api/feedback/suggestions – Submit a topic suggestion
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TopicSuggestionSchema, validationError } from '@/lib/validation';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { requireUser } from '@/lib/route-auth';
import { logger, serializeError } from '@/lib/logger';

// @spec AC-11-011
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!writeLimiter.check(ip)) {
    logger.warn('rate limit hit', { route: 'POST /api/feedback/suggestions', ip });
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const result = TopicSuggestionSchema.safeParse(body);
  if (!result.success) {
    const { status, body: errBody } = validationError(result.error);
    return NextResponse.json(errBody, { status });
  }

  const auth = await requireUser(req);
  if ('response' in auth) return auth.response;
  const userId = auth.userId;

  const { title, description } = result.data;

  try {
    await prisma.topicSuggestion.create({
      data: { userId, title, description: description ?? null },
    });

    logger.info('topic suggestion submitted', { userId, title });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('topic suggestion submit failed', serializeError(err));
    return NextResponse.json({ error: 'Failed to submit suggestion' }, { status: 500 });
  }
}
