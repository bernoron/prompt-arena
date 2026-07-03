/**
 * POST /api/feedback – Submit general or context-aware feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FeedbackSchema, validationError } from '@/lib/validation';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { requireUser } from '@/lib/route-auth';
import { logger, serializeError } from '@/lib/logger';

// @spec AC-11-003, AC-11-004, AC-11-005
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!writeLimiter.check(ip)) {
    logger.warn('rate limit hit', { route: 'POST /api/feedback', ip });
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const result = FeedbackSchema.safeParse(body);
  if (!result.success) {
    const { status, body: errBody } = validationError(result.error);
    return NextResponse.json(errBody, { status });
  }

  const auth = await requireUser(req);
  if ('response' in auth) return auth.response;
  const userId = auth.userId;

  const { category, text, contextType, contextId, contextPath } = result.data;

  try {
    await prisma.feedback.create({
      data: {
        userId,
        category,
        text,
        contextType: contextType ?? 'GENERAL',
        contextId: contextId ?? null,
        contextPath: contextPath ?? null,
      },
    });

    logger.info('feedback submitted', { userId, category, contextType });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('feedback submit failed', serializeError(err));
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
