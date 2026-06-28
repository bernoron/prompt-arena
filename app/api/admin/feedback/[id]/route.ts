/**
 * PATCH  /api/admin/feedback/[id] – Mark feedback as done
 * DELETE /api/admin/feedback/[id] – Delete feedback entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdminFeedbackStatusSchema, PathId, validationError } from '@/lib/validation';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/route-auth';
import { logger, serializeError } from '@/lib/logger';

// @spec AC-11-015
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  const ip = getClientIp(req);
  if (!writeLimiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const idResult = PathId.safeParse(params.id);
  if (!idResult.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const result = AdminFeedbackStatusSchema.safeParse(body);
  if (!result.success) {
    const { status, body: errBody } = validationError(result.error);
    return NextResponse.json(errBody, { status });
  }

  try {
    await prisma.feedback.update({
      where: { id: idResult.data },
      data: { status: result.data.status },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('feedback status update failed', serializeError(err));
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}

// @spec AC-11-015
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  const ip = getClientIp(req);
  if (!writeLimiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const idResult = PathId.safeParse(params.id);
  if (!idResult.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    await prisma.feedback.delete({ where: { id: idResult.data } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    logger.error('feedback delete failed', serializeError(err));
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 });
  }
}
