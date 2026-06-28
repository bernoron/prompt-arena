/**
 * GET /api/admin/feedback – List all feedback entries (admin only)
 *
 * Query params:
 *   contextType – filter by GENERAL | LESSON | PROMPT
 *   status      – filter by OPEN | DONE
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readLimiter, getClientIp } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/route-auth';
import { logger, serializeError } from '@/lib/logger';

// @spec AC-11-013, AC-11-014
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  const ip = getClientIp(req);
  if (!readLimiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const params = new URL(req.url).searchParams;
  const contextType = params.get('contextType');
  const status = params.get('status');

  try {
    const rows = await prisma.feedback.findMany({
      where: {
        ...(contextType && { contextType }),
        ...(status && { status }),
      },
      include: {
        user: { select: { name: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Resolve context labels for LESSON and PROMPT entries
    const lessonIds = rows
      .filter((r) => r.contextType === 'LESSON' && r.contextId)
      .map((r) => r.contextId!);
    const promptIds = rows
      .filter((r) => r.contextType === 'PROMPT' && r.contextId)
      .map((r) => r.contextId!);

    const [lessons, prompts] = await Promise.all([
      lessonIds.length
        ? prisma.lesson.findMany({
            where: { id: { in: lessonIds } },
            select: { id: true, title: true, module: { select: { title: true } } },
          })
        : [],
      promptIds.length
        ? prisma.prompt.findMany({
            where: { id: { in: promptIds } },
            select: { id: true, title: true },
          })
        : [],
    ]);

    const lessonMap = new Map(lessons.map((l) => [l.id, l]));
    const promptMap = new Map(prompts.map((p) => [p.id, p]));

    const result = rows.map((row) => {
      let contextLabel: string | null = row.contextPath ?? null;
      if (row.contextType === 'LESSON' && row.contextId) {
        const lesson = lessonMap.get(row.contextId);
        contextLabel = lesson ? `${lesson.module.title} › ${lesson.title}` : null;
      } else if (row.contextType === 'PROMPT' && row.contextId) {
        const prompt = promptMap.get(row.contextId);
        contextLabel = prompt?.title ?? null;
      }

      return {
        id: row.id,
        category: row.category,
        text: row.text,
        contextType: row.contextType,
        contextId: row.contextId,
        contextLabel,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        user: row.user,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error('admin feedback fetch failed', serializeError(err));
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}
