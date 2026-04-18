import { memo } from 'react';
import Link from 'next/link';
import type { LearningModuleWithProgress } from '@/lib/types';

interface NextLessonWidgetProps {
  modules: LearningModuleWithProgress[];
}

const NextLessonWidget = memo(function NextLessonWidget({ modules }: NextLessonWidgetProps) {
  // Find the first incomplete lesson across all modules
  let nextModule: LearningModuleWithProgress | null = null;
  let nextLessonSlug: string | null = null;
  let nextLessonTitle: string | null = null;

  for (const mod of modules) {
    const lesson = mod.lessons.find((l) => !l.completed);
    if (lesson) {
      nextModule = mod;
      nextLessonSlug = lesson.slug;
      nextLessonTitle = lesson.title;
      break;
    }
  }

  const totalLessons   = modules.reduce((s, m) => s + m.totalLessons, 0);
  const totalCompleted = modules.reduce((s, m) => s + m.completedLessons, 0);
  const allDone        = totalLessons > 0 && totalCompleted === totalLessons;

  if (totalLessons === 0) return null;

  if (allDone) {
    return (
      <div className="rounded-2xl border border-emerald-200 p-4 bg-gradient-to-br from-emerald-50 to-teal-50">
        <p className="text-sm font-extrabold text-emerald-800 mb-1">🎓 Lernpfad abgeschlossen!</p>
        <p className="text-xs text-emerald-700">
          Du hast alle {totalLessons} Lektionen absolviert.
        </p>
      </div>
    );
  }

  if (!nextModule || !nextLessonSlug) return null;

  const pct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <div className="rounded-2xl border border-violet-200 p-4 bg-gradient-to-br from-violet-50 to-indigo-50">
      <p className="text-sm font-extrabold text-violet-800 mb-1">🧠 Nächste Lektion</p>
      <p className="text-xs text-violet-600 mb-3">
        {nextModule.icon} {nextModule.title} · {totalCompleted}/{totalLessons} abgeschlossen
      </p>

      {/* Progress bar */}
      <div className="w-full bg-violet-100 rounded-full h-1.5 mb-3">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }}
        />
      </div>

      <Link
        href={`/learn/${nextModule.slug}/${nextLessonSlug}`}
        className="flex items-center gap-2 bg-white/80 hover:bg-white rounded-xl px-3 py-2 transition-colors group"
      >
        <span className="text-base">▶️</span>
        <span className="text-xs text-slate-700 flex-1 group-hover:text-violet-700 transition-colors font-medium">
          {nextLessonTitle}
        </span>
        <span className="text-xs font-bold text-emerald-600">+15 Pts</span>
      </Link>
    </div>
  );
});

export default NextLessonWidget;
