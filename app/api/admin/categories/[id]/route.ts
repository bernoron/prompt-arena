/**
 * PATCH  /api/admin/categories/[id]  – Update a category
 * DELETE /api/admin/categories/[id]  – Delete a category (only if no prompts reference it)
 *
 * Protected by admin-session middleware.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';
import { requireAdmin } from '@/lib/route-auth';

const PatchSchema = z.object({
  label: z.string().trim().min(1).max(60).optional(),
  icon:  z.string().trim().min(1).max(10).optional(),
  color: z.string().trim().min(1).max(30).optional(),
  order: z.number().int().min(0).optional(),
});

// @spec AC-07-010
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  if (!writeLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const id = parseInt((await params).id, 10);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body   = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: `${first.path.join('.')}: ${first.message}` }, { status: 400 });
  }

  try {
    const category = await prisma.promptCategory.update({ where: { id }, data: parsed.data });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  if (!writeLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const id = parseInt((await params).id, 10);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  // Refuse deletion if any prompts still reference this category slug
  const category = await prisma.promptCategory.findUnique({ where: { id } });
  if (!category) return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 404 });

  const promptCount = await prisma.prompt.count({ where: { category: category.slug } });
  if (promptCount > 0) {
    return NextResponse.json(
      { error: `Kann nicht gelöscht werden — ${promptCount} Prompt(s) verwenden diese Kategorie` },
      { status: 409 },
    );
  }

  await prisma.promptCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
