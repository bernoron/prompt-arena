/**
 * DELETE /api/admin/prompts/[id]  – Remove a prompt and all related data
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PathId } from '@/lib/validation';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';

// @spec AC-07-005
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!writeLimiter.check(getClientIp(req)))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const idResult = PathId.safeParse(params.id);
  if (!idResult.success) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const id = idResult.data;
  await prisma.challengeSubmission.deleteMany({ where: { promptId: id } });
  await prisma.vote.deleteMany({ where: { promptId: id } });
  await prisma.prompt.delete({ where: { id } }).catch(() => null);
  return new NextResponse(null, { status: 204 });
}
