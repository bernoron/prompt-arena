/**
 * GET  /api/admin/categories  – List all categories
 * POST /api/admin/categories  – Create a new category
 *
 * Protected by admin-session middleware.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readLimiter, writeLimiter, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';

const CategorySchema = z.object({
  slug:  z.string().trim().min(1).max(40).regex(/^[a-zA-Z0-9_-]+$/, 'Slug darf nur Buchstaben, Zahlen, - und _ enthalten'),
  label: z.string().trim().min(1).max(60),
  icon:  z.string().trim().min(1).max(10),
  color: z.string().trim().min(1).max(30),
  order: z.number().int().min(0).optional(),
});

// @spec AC-07-009
export async function GET(req: NextRequest) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const categories = await prisma.promptCategory.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  if (!writeLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CategorySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: `${first.path.join('.')}: ${first.message}` }, { status: 400 });
  }

  const { slug, label, icon, color, order = 0 } = parsed.data;

  try {
    const category = await prisma.promptCategory.create({ data: { slug, label, icon, color, order } });
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Slug bereits vergeben' }, { status: 409 });
  }
}
