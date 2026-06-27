/**
 * GET /api/categories
 *
 * Returns all active prompt categories ordered by display order.
 * Used by the Library filter, Submit form, and Admin panel.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readLimiter, getClientIp } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const categories = await prisma.promptCategory.findMany({
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(categories, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
