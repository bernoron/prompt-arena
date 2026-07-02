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
import { readLimiter, getClientIp } from '@/lib/rate-limit';
import { logger, serializeError } from '@/lib/logger';
import { getTrendingPrompts } from '@/lib/services/prompt-service';

// @spec AC-02-011
export async function GET(req: NextRequest) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const merged = await getTrendingPrompts();
    return NextResponse.json(merged, {
      headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60' },
    });
  } catch (err) {
    logger.error('failed to fetch trending prompts', serializeError(err));
    return NextResponse.json({ error: 'Failed to fetch trending prompts' }, { status: 500 });
  }
}
