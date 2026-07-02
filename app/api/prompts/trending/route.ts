/**
 * GET /api/prompts/trending
 *
 * Returns two lists for the Dashboard Trending widget:
 *   - hot: top 5 prompts by usageCount (most-used)
 *   - newest: top 5 prompts by createdAt (most-recent)
 *
 * Both lists include computed avgRating. Not user-specific (no userId param)
 * so the response is publicly cacheable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { readLimiter, getClientIp } from '@/lib/rate-limit';
import { logger, serializeError } from '@/lib/logger';

async function enrichWithRatings(prompts: Awaited<ReturnType<typeof fetchPrompts>>) {
  const ids = prompts.map((p) => p.id);
  if (!ids.length) return [];

  const ratingRows = await prisma.vote.groupBy({
    by: ['promptId'],
    where: { promptId: { in: ids } },
    _avg: { value: true },
    _count: { value: true },
  });
  const ratingMap = new Map(
    ratingRows.map((r) => [
      r.promptId,
      {
        avgRating: r._avg.value ? Math.round(r._avg.value * 10) / 10 : 0,
        voteCount: r._count.value,
      },
    ]),
  );

  return prompts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    ...( ratingMap.get(p.id) ?? { avgRating: 0, voteCount: 0 }),
  }));
}

async function fetchPrompts(orderBy: Prisma.PromptOrderByWithRelationInput[]) {
  return prisma.prompt.findMany({
    take: 5,
    orderBy,
    include: {
      author: { select: { id: true, name: true, avatarColor: true } },
    },
  });
}

// @spec AC-02-011
export async function GET(req: NextRequest) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const [hot, newest] = await Promise.all([
      fetchPrompts([{ usageCount: 'desc' }, { id: 'desc' }]),
      fetchPrompts([{ createdAt: 'desc' }, { id: 'desc' }]),
    ]);

    const [hotEnriched, newestEnriched] = await Promise.all([
      enrichWithRatings(hot),
      enrichWithRatings(newest),
    ]);

    // Merge both lists, deduplicating by id, hot first
    const seen = new Set<number>();
    const merged = [...hotEnriched, ...newestEnriched].filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    return NextResponse.json(merged, {
      headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60' },
    });
  } catch (err) {
    logger.error('failed to fetch trending prompts', serializeError(err));
    return NextResponse.json({ error: 'Failed to fetch trending prompts' }, { status: 500 });
  }
}
