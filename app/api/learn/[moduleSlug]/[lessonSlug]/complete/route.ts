/**
 * POST /api/learn/[moduleSlug]/[lessonSlug]/complete
 *
 * Body: { userId: number }
 *
 * Marks a lesson as complete for the user and awards points (idempotent).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { CompleteLessonSchema, validationError } from '@/lib/validation';
import { POINTS, getLevel } from '@/lib/points';

// @spec AC-08-003
export async function POST(
  req: NextRequest,
  { params }: { params: { moduleSlug: string; lessonSlug: string } },
) {
  if (!writeLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CompleteLessonSchema.safeParse(body);
  if (!parsed.success) {
    const { status, body: errBody } = validationError(parsed.error);
    return NextResponse.json(errBody, { status });
  }

  const { userId } = parsed.data;
  const { moduleSlug, lessonSlug } = params;

  // Find the lesson
  const lesson = await prisma.lesson.findFirst({
    where: { slug: lessonSlug, module: { slug: moduleSlug } },
  });
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  // Check if already completed (idempotent)
  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, alreadyCompleted: true, pointsAwarded: 0 });
  }

  // Create progress record + award points atomically
  await prisma.$transaction(async (tx) => {
    await tx.lessonProgress.create({ data: { userId, lessonId: lesson.id } });
    const user = await tx.user.update({
      where: { id: userId },
      data:  { totalPoints: { increment: POINTS.COMPLETE_LESSON } },
    });
    await tx.user.update({
      where: { id: userId },
      data:  { level: getLevel(user.totalPoints) },
    });
  });

  return NextResponse.json({
    ok:              true,
    alreadyCompleted: false,
    pointsAwarded:   POINTS.COMPLETE_LESSON,
  });
}
