/**
 * GET /api/learn?userId=<id>
 *
 * Returns all learning modules with lessons and per-user progress.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readLimiter, getClientIp } from '@/lib/rate-limit';

// @spec AC-08-001
export async function GET(req: NextRequest) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const userId = Number(req.nextUrl.searchParams.get('userId') ?? '0');

  const modules = await prisma.learningModule.findMany({
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: {
          progress: userId > 0
            ? { where: { userId } }
            : false,
        },
      },
    },
  });

  const result = modules.map((mod) => ({
    id:               mod.id,
    slug:             mod.slug,
    title:            mod.title,
    description:      mod.description,
    icon:             mod.icon,
    order:            mod.order,
    totalLessons:     mod.lessons.length,
    completedLessons: mod.lessons.filter((l) =>
      Array.isArray(l.progress) && l.progress.length > 0,
    ).length,
    lessons: mod.lessons.map((l) => ({
      id:        l.id,
      slug:      l.slug,
      title:     l.title,
      order:     l.order,
      points:    l.points,
      completed: Array.isArray(l.progress) && l.progress.length > 0,
    })),
  }));

  return NextResponse.json(result);
}
