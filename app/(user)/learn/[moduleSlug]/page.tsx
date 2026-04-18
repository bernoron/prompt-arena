'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProgressRing from '@/components/learn/ProgressRing';
import type { LearningModuleWithProgress } from '@/lib/types';
import { USER_ID_KEY } from '@/lib/constants';

export default function ModulePage({ params }: { params: { moduleSlug: string } }) {
  const [mod, setMod] = useState<LearningModuleWithProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem(USER_ID_KEY) ?? '0';
    fetch(`/api/learn?userId=${userId}`)
      .then((r) => r.json())
      .then((data: LearningModuleWithProgress[]) => {
        const found = data.find((m) => m.slug === params.moduleSlug) ?? null;
        setMod(found);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.moduleSlug]);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (!mod) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">Modul nicht gefunden.</p>
        <Link href="/learn" className="text-emerald-600 font-semibold hover:underline mt-4 block">
          ← Zurück zur Übersicht
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/learn" className="hover:text-slate-600 transition-colors">Lernen</Link>
        <span>›</span>
        <span className="text-slate-700 font-medium">{mod.title}</span>
      </nav>

      {/* Module Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{mod.icon}</span>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800">{mod.title}</h1>
              <p className="text-sm text-slate-500 mt-1">{mod.totalLessons} Lektionen · +{mod.totalLessons * 15} Punkte total</p>
            </div>
          </div>
          <div className="relative flex-shrink-0">
            <ProgressRing completed={mod.completedLessons} total={mod.totalLessons} size={56} />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-slate-700">
              {mod.completedLessons}/{mod.totalLessons}
            </span>
          </div>
        </div>
        <p className="text-slate-600 mt-4 text-sm leading-relaxed">{mod.description}</p>
      </div>

      {/* Lesson List */}
      <div className="space-y-2">
        {mod.lessons.map((lesson, i) => {
          const isCompleted = lesson.completed;
          return (
            <Link
              key={lesson.id}
              href={`/learn/${mod.slug}/${lesson.slug}`}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all group ${
                isCompleted
                  ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                  : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              {/* Step number / checkmark */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                isCompleted
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700'
              }`}>
                {isCompleted ? '✓' : i + 1}
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${isCompleted ? 'text-emerald-800' : 'text-slate-800'}`}>
                  {lesson.title}
                </p>
              </div>

              {/* Points badge */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isCompleted ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    +{lesson.points} ✓
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">+{lesson.points} Pts</span>
                )}
                <span className={`text-slate-300 group-hover:text-slate-500 transition-colors`}>›</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Back */}
      <Link href="/learn" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        ← Zurück zur Übersicht
      </Link>
    </main>
  );
}
