/**
 * PUT /api/feedback/lesson/[id] – Update own lesson feedback (helpful + optional text)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LessonFeedbackUpdateSchema, PathId, validationError } from '@/lib/validation';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { resolveUserId, USER_COOKIE } from '@/lib/user-auth';
import { logger, serializeError } from '@/lib/logger';

// @spec AC-11-008
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ip = getClientIp(req);
  if (!writeLimiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const idResult = PathId.safeParse(params.id);
  if (!idResult.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const result = LessonFeedbackUpdateSchema.safeParse(body);
  if (!result.success) {
    const { status, body: errBody } = validationError(result.error);
    return NextResponse.json(errBody, { status });
  }

  // Verify ownership: load record and confirm userId matches cookie
  const existing = await prisma.lessonFeedback.findUnique({
    where: { id: idResult.data },
    select: { userId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const resolved = await resolveUserId(req.cookies.get(USER_COOKIE)?.value, existing.userId);
  if (typeof resolved === 'object' && 'error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  try {
    await prisma.lessonFeedback.update({
      where: { id: idResult.data },
      data: {
        ...(result.data.helpful !== undefined && { helpful: result.data.helpful }),
        ...(result.data.text !== undefined && { text: result.data.text }),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('lesson feedback update failed', serializeError(err));
    return NextResponse.json({ error: 'Failed to update lesson feedback' }, { status: 500 });
  }
}
