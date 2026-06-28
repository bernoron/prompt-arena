/**
 * GET  /api/users   - List all users ordered by points.
 * POST /api/users   - Legacy self-registration endpoint (disabled).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readLimiter, writeLimiter, getClientIp } from '@/lib/rate-limit';

// @spec AC-01-002
export async function GET(req: NextRequest) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { totalPoints: 'desc' },
      // Never expose credential or PII columns on a public endpoint.
      select: {
        id: true,
        name: true,
        department: true,
        avatarColor: true,
        totalPoints: true,
        level: true,
        createdAt: true,
      },
    });

    return NextResponse.json(users, {
      headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// @spec AC-01-001
export async function POST(req: NextRequest) {
  if (!writeLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  return NextResponse.json(
    { error: 'Legacy registration is disabled. Use /api/auth/register.' },
    { status: 410 },
  );
}
