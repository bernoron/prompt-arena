/**
 * Learning-path read logic, shared between GET /api/learn and the dashboard
 * Server Component (Next-lesson widget).
 */

import { prisma } from '@/lib/prisma';
import type { LearningModuleWithProgress } from '@/lib/types';

/**
 * All learning modules with their lessons and — when `userId > 0` — the
 * signed-in user's completion state per lesson.
 */
export async function getLearningModules(userId: number): Promise<LearningModuleWithProgress[]> {
  const modules = await prisma.learningModule.findMany({
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: {
          progress: userId > 0 ? { where: { userId } } : false,
        },
      },
    },
  });

  return modules.map((mod) => ({
    id:               mod.id,
    slug:             mod.slug,
    title:            mod.title,
    description:      mod.description,
    icon:             mod.icon,
    order:            mod.order,
    totalLessons:     mod.lessons.length,
    completedLessons: mod.lessons.filter(
      (l) => Array.isArray(l.progress) && l.progress.length > 0,
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
}
