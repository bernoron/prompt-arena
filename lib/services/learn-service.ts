/**
 * Shared learning-path listing logic for GET /api/learn and Server
 * Components (Dashboard) that need module/lesson progress directly.
 */

import { prisma } from '@/lib/prisma';
import type { LearningModuleWithProgress } from '@/lib/types';

export async function getLearnModules(userId: number): Promise<LearningModuleWithProgress[]> {
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

  return modules.map((mod) => ({
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
}
