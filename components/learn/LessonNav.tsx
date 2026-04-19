import Link from 'next/link';
import type { LessonDetail } from '@/lib/types';

interface LessonNavProps {
  prev: LessonDetail['prev'];
  next: LessonDetail['next'];
  moduleSlug: string;
}

// @spec AC-08-009
export default function LessonNav({ prev, next, moduleSlug }: LessonNavProps) {
  return (
    <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-200 mt-8">
      <div className="flex-1">
        {prev ? (
          <Link
            href={`/learn/${prev.moduleSlug ?? moduleSlug}/${prev.slug}`}
            className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <span className="text-lg">←</span>
            <div>
              <p className="text-xs text-slate-400 group-hover:text-slate-500">Vorherige</p>
              <p className="text-sm font-semibold line-clamp-1">{prev.title}</p>
            </div>
          </Link>
        ) : (
          <Link
            href={`/learn/${moduleSlug}`}
            className="group flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="text-lg">←</span>
            <span className="text-sm font-medium">Zurück zum Modul</span>
          </Link>
        )}
      </div>

      <div className="flex-1 flex justify-end">
        {next ? (
          <Link
            href={`/learn/${next.moduleSlug}/${next.slug}`}
            className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-right"
          >
            <div>
              <p className="text-xs text-slate-400 group-hover:text-slate-500">Nächste</p>
              <p className="text-sm font-semibold line-clamp-1">{next.title}</p>
            </div>
            <span className="text-lg">→</span>
          </Link>
        ) : (
          <Link
            href="/learn"
            className="group flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <span className="text-sm font-semibold">🎓 Alle Module</span>
            <span className="text-lg">→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
