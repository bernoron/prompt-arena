'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProgressRing from '@/components/learn/ProgressRing';
import type { LearningModuleWithProgress } from '@/lib/types';
import { USER_ID_KEY } from '@/lib/constants';

// @spec AC-08-004
export default function LearnPage() {
  const [modules, setModules] = useState<LearningModuleWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem(USER_ID_KEY) ?? '0';
    fetch(`/api/learn?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => { setModules(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalLessons    = modules.reduce((s, m) => s + m.totalLessons, 0);
  const totalCompleted  = modules.reduce((s, m) => s + m.completedLessons, 0);
  const overallPct      = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1e3a5f 100%)' }}>
        <div className="px-8 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-2">
                🧠 Prompting lernen
              </h1>
              <p className="text-slate-300 text-base max-w-lg">
                Von den Grundlagen bis zu fortgeschrittenen Techniken — mit echten Beispielen und kopierbaren Vorlagen für deinen Arbeitsalltag.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 max-w-xs bg-white/10 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${overallPct}%`, background: 'linear-gradient(90deg, #059669, #0891b2)' }}
                  />
                </div>
                <span className="text-sm font-bold text-white">
                  {totalCompleted} / {totalLessons} Lektionen
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="relative inline-flex">
                <ProgressRing completed={totalCompleted} total={totalLessons} size={80} />
                <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-white">
                  {overallPct}%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Gesamt</p>
            </div>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => {
            const done = mod.completedLessons === mod.totalLessons;
            const started = mod.completedLessons > 0;
            const nextLesson = mod.lessons.find((l) => !l.completed) ?? mod.lessons[0];

            return (
              <Link
                key={mod.id}
                href={`/learn/${mod.slug}`}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{mod.icon}</span>
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors leading-tight">
                          {mod.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{mod.totalLessons} Lektionen</p>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0">
                      <ProgressRing completed={mod.completedLessons} total={mod.totalLessons} size={40} />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-slate-600">
                        {mod.completedLessons}/{mod.totalLessons}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {mod.description}
                  </p>
                </div>

                <div className={`px-5 py-3 border-t text-xs font-semibold flex items-center gap-1.5 ${
                  done
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    : started
                    ? 'bg-blue-50 border-blue-100 text-blue-700'
                    : 'bg-slate-50 border-slate-100 text-slate-500'
                }`}>
                  {done
                    ? <><span>✅</span> Abgeschlossen</>
                    : started
                    ? <><span>▶️</span> Weiter: {nextLesson?.title}</>
                    : <><span>▷</span> Starten</>
                  }
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-3">🎯 Wie funktioniert der Lernpfad?</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm text-slate-600">
          <div className="flex gap-2">
            <span className="text-lg flex-shrink-0">📖</span>
            <div><p className="font-semibold text-slate-700">Theorie & Beispiele</p><p>Jede Lektion erklärt ein Konzept mit konkreten Gut/Schlecht-Vergleichen.</p></div>
          </div>
          <div className="flex gap-2">
            <span className="text-lg flex-shrink-0">🔧</span>
            <div><p className="font-semibold text-slate-700">Kopierbare Vorlagen</p><p>Jedes Pattern kannst du direkt in deine Arbeit übernehmen.</p></div>
          </div>
          <div className="flex gap-2">
            <span className="text-lg flex-shrink-0">⭐</span>
            <div><p className="font-semibold text-slate-700">Punkte sammeln</p><p>Pro abgeschlossener Lektion erhältst du +15 Punkte für das Ranking.</p></div>
          </div>
        </div>
      </div>
    </main>
  );
}
