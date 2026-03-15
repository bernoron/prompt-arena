/**
 * PATCH  /api/admin/challenges/[id]  – Toggle isActive, update fields, or award a winner
 * DELETE /api/admin/challenges/[id]  – Delete a challenge
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { awardPoints } from '@/lib/db-helpers';
import { POINTS } from '@/lib/points';
import { PathId } from '@/lib/validation';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!writeLimiter.check(getClientIp(req)))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const idResult = PathId.safeParse(params.id);
  if (!idResult.success) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));

  // Award winner action: give CHALLENGE_WIN points and deactivate the challenge
  if (body.action === 'award-winner' && typeof body.winnerId === 'number') {
    await awardPoints(body.winnerId, POINTS.CHALLENGE_WIN);
    await prisma.weeklyChallenge.update({ where: { id: idResult.data }, data: { isActive: false } });
    return NextResponse.json({ message: 'Winner awarded' });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
  if (typeof body.description === 'string' && body.description.trim()) data.description = body.description.trim();

  const challenge = await prisma.weeklyChallenge.update({ where: { id: idResult.data }, data }).catch(() => null);
  if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...challenge, startDate: challenge.startDate.toISOString(), endDate: challenge.endDate.toISOString() });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!writeLimiter.check(getClientIp(req)))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const idResult = PathId.safeParse(params.id);
  if (!idResult.success) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  await prisma.challengeSubmission.deleteMany({ where: { challengeId: idResult.data } });
  await prisma.weeklyChallenge.delete({ where: { id: idResult.data } }).catch(() => null);
  return new NextResponse(null, { status: 204 });
}
