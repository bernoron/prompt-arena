'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ContentBlockRenderer from '@/components/learn/ContentBlock';
import LessonNav from '@/components/learn/LessonNav';
import { triggerFloat } from '@/components/FloatingPoints';
import type { LessonDetail } from '@/lib/types';
import { USER_ID_KEY } from '@/lib/constants';
import { POINTS } from '@/lib/points';

// @spec AC-08-011
export default function LessonPage({
  params,
}: {
  params: { moduleSlug: string; lessonSlug: string };
}) {
  const [lesson, setLesson]           = useState<LessonDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [completing, setCompleting]   = useState(false);
  const [userId, setUserId]           = useState<number>(0);

  useEffect(() => {
    const uid = Number(localStorage.getItem(USER_ID_KEY) ?? '0');
    setUserId(uid);
    fetch(`/api/learn/${params.moduleSlug}/${params.lessonSlug}?userId=${uid}`)
      .then((r) => r.json())
      .then((data) => { setLesson(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.moduleSlug, params.lessonSlug]);

  // @spec AC-08-008
  const handleComplete = useCallback(async () => {
    if (!lesson || lesson.completed || completing || userId === 0) return;
    setCompleting(true);
    try {
      const res = await fetch(
        `/api/learn/${params.moduleSlug}/${params.lessonSlug}/complete`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) },
      );
      const data = await res.json();
      if (data.ok && !data.alreadyCompleted) {
        setLesson((prev) => prev ? { ...prev, completed: true } : prev);
        triggerFloat(`+${POINTS.COMPLETE_LESSON} Pts`, window.innerWidth / 2 - 40, window.innerHeight / 2);
      } else {
        setLesson((prev) => prev ? { ...prev, completed: true } : prev);
      }
    } finally {
      setCompleting(false);
    }
  }, [lesson, completing, userId, params.moduleSlug, params.lessonSlug]);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-10 w-3/4 bg-slate-100 rounded-xl animate-pulse" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (!lesson) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">Lektion nicht gefunden.</p>
        <Link href="/learn" className="text-emerald-600 font-semibold hover:underline mt-4 block">
          ← Zurück zum Lernpfad
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/learn" className="hover:text-slate-600 transition-colors">Lernen</Link>
        <span>›</span>
        <Link href={`/learn/${params.moduleSlug}`} className="hover:text-slate-600 transition-colors">
          {lesson.module.icon} {lesson.module.title}
        </Link>
        <span>›</span>
        <span className="text-slate-700 font-medium truncate">{lesson.title}</span>
      </nav>

      {/* Lesson Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Lektion {lesson.order} von {lesson.module.totalLessons}
          </span>
          {lesson.completed && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              ✓ Abgeschlossen
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{lesson.title}</h1>
      </div>

      {/* Content Blocks */}
      <div className="space-y-6">
        {lesson.content.map((block, i) => (
          <ContentBlockRenderer key={i} block={block} />
        ))}
      </div>

      {/* Complete Button */}
      <div className="mt-10 pt-6 border-t border-slate-100">
        {userId === 0 ? (
          <div className="text-center bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500">
              👤 Wähle einen Nutzer oben aus, um Fortschritt zu speichern.
            </p>
          </div>
        ) : lesson.completed ? (
          <div className="text-center bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <p className="text-sm font-bold text-emerald-700">
              ✅ Lektion abgeschlossen · +{lesson.points} Punkte erhalten
            </p>
          </div>
        ) : (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}
          >
            {completing ? '⏳ Wird gespeichert…' : `✓ Lektion abschliessen (+${lesson.points} Pts)`}
          </button>
        )}
      </div>

      {/* Prev / Next Navigation */}
      <LessonNav prev={lesson.prev} next={lesson.next} moduleSlug={params.moduleSlug} />
    </main>
  );
}
