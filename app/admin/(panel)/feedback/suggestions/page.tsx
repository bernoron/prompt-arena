'use client';

// @spec AC-11-012, AC-11-016
import { useState, useEffect } from 'react';

interface Suggestion {
  id: number;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  user: { name: string; department: string };
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  OPEN:     { label: 'Offen',     color: 'bg-slate-100 text-slate-600' },
  PLANNED:  { label: 'Geplant',   color: 'bg-blue-100 text-blue-700' },
  DONE:     { label: 'Umgesetzt', color: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Abgelehnt', color: 'bg-red-100 text-red-600' },
};

const STATUS_OPTIONS = ['OPEN', 'PLANNED', 'DONE', 'REJECTED'] as const;

export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/admin/feedback/suggestions')
      .then((r) => r.json())
      .then((data) => { setSuggestions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function updateStatus(id: number, status: string) {
    setUpdating(id);
    await fetch(`/api/admin/feedback/suggestions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setSuggestions((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    setUpdating(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">💡 Themenvorschläge</h1>
        <p className="text-sm text-slate-500 mt-1">{suggestions.length} Vorschläge</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-3xl mb-2">💡</p>
          <p>Noch keine Vorschläge eingegangen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => {
            const meta = STATUS_META[s.status] ?? STATUS_META.OPEN;
            return (
              <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">{s.title}</p>
                    {s.description && (
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{s.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {s.user.name} · {s.user.department} · {new Date(s.createdAt).toLocaleDateString('de-CH')}
                    </p>
                  </div>

                  <select
                    value={s.status}
                    disabled={updating === s.id}
                    onChange={(e) => updateStatus(s.id, e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{STATUS_META[opt].label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
