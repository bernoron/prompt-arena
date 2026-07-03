/**
 * GET  /api/feedback/lesson?userId=&lessonId= – Get own lesson feedback
 * POST /api/feedback/lesson                   – Submit lesson helpful vote
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LessonFeedbackSchema, PathId, validationError } from '@/lib/validation';
import { writeLimiter, readLimiter, getClientIp } from '@/lib/rate-limit';
import { requireUser } from '@/lib/route-auth';
import { logger, serializeError } from '@/lib/logger';

// @spec AC-11-008
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!readLimiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const params = new URL(req.url).searchParams;
  const userIdResult = PathId.safeParse(params.get('userId'));
  const lessonIdResult = PathId.safeParse(params.get('lessonId'));

  if (!userIdResult.success || !lessonIdResult.success) {
    return NextResponse.json({ error: 'userId and lessonId are required' }, { status: 400 });
  }

  const auth = await requireUser(req, userIdResult.data);
  if ('response' in auth) return auth.response;

  try {
    const feedback = await prisma.lessonFeedback.findUnique({
      where: {
        userId_lessonId: {
          userId: userIdResult.data,
          lessonId: lessonIdResult.data,
        },
      },
      select: { id: true, helpful: true, text: true },
    });

    return NextResponse.json(feedback ?? null);
  } catch (err) {
    logger.error('lesson feedback fetch failed', serializeError(err));
    return NextResponse.json({ error: 'Failed to fetch lesson feedback' }, { status: 500 });
  }
}

// @spec AC-11-007
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!writeLimiter.check(ip)) {
    logger.warn('rate limit hit', { route: 'POST /api/feedback/lesson', ip });
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const result = LessonFeedbackSchema.safeParse(body);
  if (!result.success) {
    const { status, body: errBody } = validationError(result.error);
    return NextResponse.json(errBody, { status });
  }

  const auth = await requireUser(req);
  if ('response' in auth) return auth.response;
  const userId = auth.userId;

  const { lessonId, helpful, text } = result.data;

  try {
    const record = await prisma.lessonFeedback.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { helpful, text: text ?? null },
      create: { userId, lessonId, helpful, text: text ?? null },
    });

    return NextResponse.json({ ok: true, id: record.id });
  } catch (err) {
    logger.error('lesson feedback submit failed', serializeError(err));
    return NextResponse.json({ error: 'Failed to submit lesson feedback' }, { status: 500 });
  }
}
