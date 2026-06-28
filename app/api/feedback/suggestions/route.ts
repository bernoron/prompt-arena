/**
 * POST /api/feedback/suggestions – Submit a topic suggestion
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TopicSuggestionSchema, validationError } from '@/lib/validation';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { resolveUserId, USER_COOKIE } from '@/lib/user-auth';
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

  const resolved = await resolveUserId(req.cookies.get(USER_COOKIE)?.value, result.data.userId);
  if (typeof resolved === 'object' && 'error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const { title, description } = result.data;

  try {
    await prisma.topicSuggestion.create({
      data: { userId: resolved, title, description: description ?? null },
    });

    logger.info('topic suggestion submitted', { userId: resolved, title });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('topic suggestion submit failed', serializeError(err));
    return NextResponse.json({ error: 'Failed to submit suggestion' }, { status: 500 });
  }
}
