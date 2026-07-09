/**
 * GET  /api/users   - List all users ordered by points.
 * POST /api/users   - Legacy self-registration endpoint (disabled).
 */

import { NextRequest, NextResponse } from 'next/server';
import { readLimiter, writeLimiter, getClientIp } from '@/lib/rate-limit';
import { listUsers } from '@/lib/services/user-service';

// @spec AC-01-002, AC-01-012
export async function GET(req: NextRequest) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    // Deleted accounts are filtered inside listUsers() (deletedAt: null).
    const users = await listUsers();
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
