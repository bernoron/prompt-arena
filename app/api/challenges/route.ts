/**
 * GET /api/challenges
 *
 * Returns all currently active weekly challenges (multiple can be active
 * simultaneously). Includes submission counts per challenge.
 * Returns an empty array when none are active.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readLimiter, getClientIp } from '@/lib/rate-limit';
import { getActiveChallenges } from '@/lib/services/challenge-service';

// @spec AC-06-001
export async function GET(req: NextRequest) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const challenges = await getActiveChallenges();

    return NextResponse.json(challenges, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}
