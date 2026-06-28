/**
 * POST /api/feedback – Submit general or context-aware feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FeedbackSchema, validationError } from '@/lib/validation';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { resolveUserId, USER_COOKIE } from '@/lib/user-auth';
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

  const resolved = await resolveUserId(req.cookies.get(USER_COOKIE)?.value, result.data.userId);
  if (typeof resolved === 'object' && 'error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const { category, text, contextType, contextId, contextPath } = result.data;

  try {
    await prisma.feedback.create({
      data: {
        userId: resolved,
        category,
        text,
        contextType: contextType ?? 'GENERAL',
        contextId: contextId ?? null,
        contextPath: contextPath ?? null,
      },
    });

    logger.info('feedback submitted', { userId: resolved, category, contextType });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('feedback submit failed', serializeError(err));
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
