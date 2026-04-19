/**
 * GET  /api/users   – List all users ordered by points (for Leaderboard / UserPicker)
 * POST /api/users   – Register a new user (self-registration)
 *
 * POST body: { name: string, department: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AVATAR_COLORS } from '@/lib/constants';
import { CreateUserSchema, validationError } from '@/lib/validation';
import { readLimiter, writeLimiter, getClientIp } from '@/lib/rate-limit';

// ─── GET /api/users ───────────────────────────────────────────────────────────

// @spec AC-01-002
export async function GET(req: NextRequest) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { totalPoints: 'desc' },
    });
    return NextResponse.json(users, {
      headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// ─── POST /api/users ──────────────────────────────────────────────────────────

// @spec AC-01-001
export async function POST(req: NextRequest) {
  if (!writeLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const result = CreateUserSchema.safeParse(body);
  if (!result.success) {
    const { status, body: errBody } = validationError(result.error);
    return NextResponse.json(errBody, { status });
  }

  const { name, department } = result.data;

  try {
    // Assign avatar colour round-robin based on current user count
    const count = await prisma.user.count();
    const avatarColor = AVATAR_COLORS[count % AVATAR_COLORS.length];

    const user = await prisma.user.create({
      data: {
        name,
        department,
        avatarColor,
        totalPoints: 0,
        level:       'Prompt-Lehrling',
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Registrierung fehlgeschlagen' }, { status: 500 });
  }
}
