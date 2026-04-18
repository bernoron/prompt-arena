/**
 * GET /api/learn/[moduleSlug]/[lessonSlug]?userId=<id>
 *
 * Returns lesson content, completion status, and prev/next navigation.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readLimiter, getClientIp } from '@/lib/rate-limit';

export async function GET(
  req: NextRequest,
  { params }: { params: { moduleSlug: string; lessonSlug: string } },
) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const userId = Number(req.nextUrl.searchParams.get('userId') ?? '0');
  const { moduleSlug, lessonSlug } = params;

  // Load the module with all its lessons (for prev/next)
  const mod = await prisma.learningModule.findUnique({
    where: { slug: moduleSlug },
    include: {
      lessons: { orderBy: { order: 'asc' } },
    },
  });

  if (!mod) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 });
  }

  const lessonIndex = mod.lessons.findIndex((l) => l.slug === lessonSlug);
  if (lessonIndex === -1) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  const lesson = mod.lessons[lessonIndex];

  // Check completion for this user
  const completed = userId > 0
    ? (await prisma.lessonProgress.count({ where: { userId, lessonId: lesson.id } })) > 0
    : false;

  // Prev / next (stay within module for now)
  const prevLesson = lessonIndex > 0 ? mod.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < mod.lessons.length - 1 ? mod.lessons[lessonIndex + 1] : null;

  // If at the last lesson of the module, find the first lesson of the next module
  let nextInfo: { slug: string; title: string; moduleSlug: string } | null = null;
  if (nextLesson) {
    nextInfo = { slug: nextLesson.slug, title: nextLesson.title, moduleSlug };
  } else {
    const nextMod = await prisma.learningModule.findFirst({
      where:   { order: { gt: mod.order } },
      orderBy: { order: 'asc' },
      include: { lessons: { orderBy: { order: 'asc' }, take: 1 } },
    });
    if (nextMod && nextMod.lessons.length > 0) {
      nextInfo = {
        slug:       nextMod.lessons[0].slug,
        title:      nextMod.lessons[0].title,
        moduleSlug: nextMod.slug,
      };
    }
  }

  return NextResponse.json({
    id:        lesson.id,
    slug:      lesson.slug,
    title:     lesson.title,
    order:     lesson.order,
    points:    lesson.points,
    content:   JSON.parse(lesson.content),
    completed,
    module: {
      slug:         mod.slug,
      title:        mod.title,
      icon:         mod.icon,
      totalLessons: mod.lessons.length,
    },
    prev: prevLesson
      ? { slug: prevLesson.slug, title: prevLesson.title, moduleSlug }
      : null,
    next: nextInfo,
  });
}
