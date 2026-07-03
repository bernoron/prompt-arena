/**
 * POST /api/learn/[moduleSlug]/[lessonSlug]/complete
 *
 * No body fields — the user comes from the session cookie.
 * Marks a lesson as complete for the user and awards points (idempotent).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { CompleteLessonSchema, validationError } from '@/lib/validation';
import { requireUser } from '@/lib/route-auth';
import { awardPoints } from '@/lib/db-helpers';
import { POINTS } from '@/lib/points';

// @spec AC-08-003
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ moduleSlug: string; lessonSlug: string }> },
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

  const auth = await requireUser(req);
  if ('response' in auth) return auth.response;
  const userId = auth.userId;
  const { moduleSlug, lessonSlug } = await params;

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

  // Create progress record + award points atomically. The ledger key
  // (not just the `existing` check above) is what actually prevents a
  // double-award if two requests race past the check simultaneously.
  const result = await prisma.$transaction(async (tx) => {
    await tx.lessonProgress.create({ data: { userId, lessonId: lesson.id } });
    return awardPoints(userId, POINTS.COMPLETE_LESSON, tx, { action: 'LESSON_COMPLETE', refId: lesson.id });
  });

  return NextResponse.json({
    ok:              true,
    alreadyCompleted: false,
    pointsAwarded:   result.awarded ? POINTS.COMPLETE_LESSON : 0,
  });
}
