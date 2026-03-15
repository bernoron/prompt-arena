/**
 * PATCH  /api/admin/users/[id]  – Adjust points / reset level
 * DELETE /api/admin/users/[id]  – Delete user and all their data
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PathId } from '@/lib/validation';
import { getLevel } from '@/lib/points';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!writeLimiter.check(getClientIp(req)))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const idResult = PathId.safeParse(params.id);
  if (!idResult.success) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.totalPoints === 'number' && Number.isInteger(body.totalPoints) && body.totalPoints >= 0) {
    data.totalPoints = body.totalPoints;
    data.level = getLevel(body.totalPoints);
  }
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();

  const user = await prisma.user.update({ where: { id: idResult.data }, data }).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!writeLimiter.check(getClientIp(req)))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const idResult = PathId.safeParse(params.id);
  if (!idResult.success) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const id = idResult.data;
  // Delete in dependency order (no Usage model – usageCount is a field on Prompt)
  const userPromptIds = (await prisma.prompt.findMany({ where: { authorId: id }, select: { id: true } })).map((p) => p.id);
  await prisma.challengeSubmission.deleteMany({ where: { OR: [{ userId: id }, { promptId: { in: userPromptIds } }] } });
  await prisma.vote.deleteMany({ where: { OR: [{ userId: id }, { promptId: { in: userPromptIds } }] } });
  await prisma.prompt.deleteMany({ where: { authorId: id } });
  await prisma.user.delete({ where: { id } }).catch(() => null);
  return new NextResponse(null, { status: 204 });
}
