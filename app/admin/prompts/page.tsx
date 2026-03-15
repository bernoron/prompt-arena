'use client';

import { useEffect, useState } from 'react';

interface Prompt {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  usageCount: number;
  avgRating: number;
  voteCount: number;
  createdAt: string;
  author: { name: string; department: string; avatarColor: string };
}

const CATEGORY_COLORS: Record<string, string> = {
  Writing:  'bg-teal-50 text-teal-700 border-teal-200',
  Email:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  Analysis: 'bg-orange-50 text-orange-700 border-orange-200',
  Excel:    'bg-green-50 text-green-700 border-green-200',
};

export default function AdminPrompts() {
  const [prompts, setPrompts]   = useState<Prompt[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/prompts').then((r) => r.json()).then((d) => {
      setPrompts(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const deletePrompt = async (id: number, title: string) => {
    if (!confirm(`Prompt «${title}» dauerhaft löschen?`)) return;
    await fetch(`/api/admin/prompts/${id}`, { method: 'DELETE' });
    load();
  };

  const filtered = prompts.filter((p) => {
    const matchCat = category === 'all' || p.category === category;
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.author.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const categories = ['all', ...Array.from(new Set(prompts.map((p) => p.category)))];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">📝 Prompts</h1>
        <p className="text-slate-400 text-sm mt-1">{prompts.length} Prompts insgesamt.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Titel oder Autor suchen…"
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 w-56" />
        <div className="flex gap-1.5">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                category === cat
                  ? 'text-white shadow-sm'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-emerald-300'
              }`}
              style={category === cat ? { background: 'linear-gradient(135deg,#059669,#0891b2)' } : {}}>
              {cat === 'all' ? 'Alle' : cat}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} Treffer</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-slate-200 rounded-2xl h-16 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
          Keine Prompts gefunden.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filtered.map((p) => (
              <div key={p.id}>
                <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}>

                  {/* Category badge */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border flex-shrink-0 ${CATEGORY_COLORS[p.category] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    {p.category}
                  </span>

                  {/* Title & author */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400">{p.author.name} · {p.author.department}</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400 flex-shrink-0">
                    <span title="Nutzungen">🚀 {p.usageCount}</span>
                    <span title="Bewertungen">⭐ {p.avgRating > 0 ? p.avgRating.toFixed(1) : '—'}</span>
                    <span title="Erstellt">{new Date(p.createdAt).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}</span>
                  </div>

                  {/* Delete */}
                  <button onClick={(e) => { e.stopPropagation(); deletePrompt(p.id, p.title); }}
                    className="px-2.5 py-1 rounded-lg text-xs border border-red-200 text-red-600 hover:bg-red-50 transition-all flex-shrink-0"
                    title="Löschen">
                    🗑
                  </button>

                  <span className="text-slate-300 text-xs flex-shrink-0">{expanded === p.id ? '▲' : '▼'}</span>
                </div>

                {/* Expanded content preview */}
                {expanded === p.id && (
                  <div className="px-5 pb-4 bg-slate-50 border-t border-slate-100">
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono bg-white rounded-xl p-3 mt-3 border border-slate-200 max-h-40 overflow-y-auto">
                      {(p as unknown as { content: string }).content ?? '(kein Inhalt)'}
                    </pre>
                    <div className="flex gap-4 mt-2 text-xs text-slate-400">
                      <span>ID: {p.id}</span>
                      <span>Schwierigkeit: {p.difficulty}</span>
                      <span>{p.voteCount} Bewertungen</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
