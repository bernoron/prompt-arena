/**
 * PATCH /api/admin/feedback/suggestions/[id] – Update suggestion status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SuggestionStatusSchema, PathId, validationError } from '@/lib/validation';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/route-auth';
import { logger, serializeError } from '@/lib/logger';

// @spec AC-11-016
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  const ip = getClientIp(req);
  if (!writeLimiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const idResult = PathId.safeParse((await params).id);
  if (!idResult.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const result = SuggestionStatusSchema.safeParse(body);
  if (!result.success) {
    const { status, body: errBody } = validationError(result.error);
    return NextResponse.json(errBody, { status });
  }

  try {
    await prisma.topicSuggestion.update({
      where: { id: idResult.data },
      data: { status: result.data.status },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('suggestion status update failed', serializeError(err));
    return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 });
  }
}
