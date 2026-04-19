/**
 * GET  /api/admin/challenges  – List all challenges
 * POST /api/admin/challenges  – Create a new challenge
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';

const CreateChallengeSchema = z.object({
  title:       z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  startDate:   z.string().datetime(),
  endDate:     z.string().datetime(),
});

// @spec AC-06-004, AC-06-005, AC-06-006, AC-07-006
export async function GET() {
  const challenges = await prisma.weeklyChallenge.findMany({
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { submissions: true } } },
  });
  return NextResponse.json(challenges.map((c) => ({
    ...c,
    submissionCount: c._count.submissions,
    startDate: c.startDate.toISOString(),
    endDate:   c.endDate.toISOString(),
  })));
}

export async function POST(req: NextRequest) {
  if (!writeLimiter.check(getClientIp(req)))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const body = await req.json().catch(() => null);
  const result = CreateChallengeSchema.safeParse(body);
  if (!result.success)
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

  const { title, description, startDate, endDate } = result.data;
  if (new Date(endDate) <= new Date(startDate))
    return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 });

  const challenge = await prisma.weeklyChallenge.create({
    data: { title, description, startDate: new Date(startDate), endDate: new Date(endDate), isActive: true },
  });
  return NextResponse.json({ ...challenge, startDate: challenge.startDate.toISOString(), endDate: challenge.endDate.toISOString() }, { status: 201 });
}
