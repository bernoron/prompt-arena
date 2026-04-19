/**
 * GET /api/users/[id]
 *
 * Returns a full user profile for the Profile page, including:
 * - All prompts the user has submitted (with computed avgRating and voteCount)
 * - The user's current rank in the global leaderboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calcAvgRating } from '@/lib/db-helpers';
import { PathId } from '@/lib/validation';
import { readLimiter, getClientIp } from '@/lib/rate-limit';

// @spec AC-01-003
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Validate that the path segment is a valid positive integer
  const idResult = PathId.safeParse(params.id);
  if (!idResult.success) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }
  const id = idResult.data;

  try {
    const user = await prisma.user.findUnique({
      where:   { id },
      include: {
        prompts: {
          orderBy: { usageCount: 'desc' },
          include: { votes: true },
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Compute global rank (position in the leaderboard) via COUNT query
    const rank = await prisma.user.count({
      where: { totalPoints: { gt: user.totalPoints } },
    }) + 1;

    const prompts = user.prompts.map((p) => ({
      ...p,
      avgRating: calcAvgRating(p.votes),
      voteCount: p.votes.length,
      votes:     undefined, // Remove raw vote rows from the response
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({
      ...user,
      rank,
      prompts,
      createdAt: user.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
