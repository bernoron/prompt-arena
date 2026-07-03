/**
 * DELETE /api/admin/prompts/[id]  – Remove a prompt and all related data
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PathId } from '@/lib/validation';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/route-auth';

// @spec AC-07-005
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  if (!writeLimiter.check(getClientIp(req)))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const idResult = PathId.safeParse((await params).id);
  if (!idResult.success) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const id = idResult.data;
  await prisma.$transaction(async (tx) => {
    await tx.challengeSubmission.deleteMany({ where: { promptId: id } });
    await tx.vote.deleteMany({ where: { promptId: id } });
    await tx.favorite.deleteMany({ where: { promptId: id } });
    await tx.usageEvent.deleteMany({ where: { promptId: id } });
    await tx.prompt.delete({ where: { id } }).catch(() => null);
  });
  return new NextResponse(null, { status: 204 });
}
