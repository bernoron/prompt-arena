'use client';

// @spec AC-11-013, AC-11-014, AC-11-015
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface FeedbackEntry {
  id: number;
  category: string;
  text: string;
  contextType: string;
  contextId: number | null;
  contextLabel: string | null;
  status: string;
  createdAt: string;
  user: { name: string };
}

const CATEGORY_META: Record<string, { icon: string; label: string; color: string }> = {
  BUG:         { icon: '🐛', label: 'Bug',          color: 'bg-red-100 text-red-700' },
  IMPROVEMENT: { icon: '🔧', label: 'Verbesserung', color: 'bg-blue-100 text-blue-700' },
  IDEA:        { icon: '💡', label: 'Idee',         color: 'bg-yellow-100 text-yellow-700' },
  PRAISE:      { icon: '⭐', label: 'Lob',          color: 'bg-emerald-100 text-emerald-700' },
};

const CONTEXT_LABELS: Record<string, string> = {
  GENERAL: 'Allgemein',
  LESSON:  'Lektion',
  PROMPT:  'Prompt',
};

export default function AdminFeedbackPage() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = filter !== 'ALL' ? `?contextType=${filter}` : '';
    const res = await fetch(`/api/admin/feedback${qs}`);
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function markDone(id: number) {
    await fetch(`/api/admin/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONE' }),
    });
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, status: 'DONE' } : e));
  }

  async function deleteFeedback(id: number) {
    if (!confirm('Dieses Feedback wirklich löschen?')) return;
    setDeleting(id);
    await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' });
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  }

  const filters = ['ALL', 'GENERAL', 'LESSON', 'PROMPT'];
  const open = entries.filter((e) => e.status === 'OPEN').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">💬 Feedback</h1>
          <p className="text-sm text-slate-500 mt-1">{open} offen · {entries.length} gesamt</p>
        </div>
        <Link href="/admin/feedback/suggestions"
          className="text-sm text-emerald-600 hover:underline">
          Themenvorschläge →
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300'
            }`}
          >
            {f === 'ALL' ? 'Alle' : CONTEXT_LABELS[f]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-3xl mb-2">🎉</p>
          <p>Kein Feedback vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const meta = CATEGORY_META[entry.category] ?? { icon: '?', label: entry.category, color: 'bg-gray-100 text-gray-700' };
            const isDone = entry.status === 'DONE';

            return (
              <div
                key={entry.id}
                className={`bg-white rounded-xl border p-4 transition-opacity ${isDone ? 'opacity-50 border-slate-100' : 'border-slate-200'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {CONTEXT_LABELS[entry.contextType] ?? entry.contextType}
                      </span>
                      {entry.contextLabel && (
                        <span className="text-xs text-slate-400 truncate max-w-[200px]" title={entry.contextLabel}>
                          {entry.contextLabel}
                        </span>
                      )}
                      {isDone && (
                        <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">✓ Erledigt</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-3">{entry.text}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {entry.user.name} · {new Date(entry.createdAt).toLocaleDateString('de-CH')}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    {!isDone && (
                      <button
                        onClick={() => markDone(entry.id)}
                        className="text-xs px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                      >
                        Erledigt
                      </button>
                    )}
                    <button
                      onClick={() => deleteFeedback(entry.id)}
                      disabled={deleting === entry.id}
                      className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
