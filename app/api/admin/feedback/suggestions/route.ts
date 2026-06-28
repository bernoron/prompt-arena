/**
 * GET /api/admin/feedback/suggestions – List all topic suggestions (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readLimiter, getClientIp } from '@/lib/rate-limit';
import { logger, serializeError } from '@/lib/logger';

// @spec AC-11-012
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!readLimiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const suggestions = await prisma.topicSuggestion.findMany({
      include: { user: { select: { name: true, department: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      suggestions.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        user: s.user,
      })),
    );
  } catch (err) {
    logger.error('suggestions fetch failed', serializeError(err));
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
