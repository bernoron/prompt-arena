import { useState, useMemo, memo } from 'react';
import Link from 'next/link';
import type { PromptWithDetails } from '@/lib/types';

function Avatar({ user }: { user: { name: string; avatarColor: string } }) {
  return (
    <span
      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ backgroundColor: user.avatarColor }}
    >
      {user.name.split(' ').map((n) => n[0]).join('')}
    </span>
  );
}

function ImpactBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5">
      <div
        className="h-1.5 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #059669, #0891b2)' }}
      />
    </div>
  );
}

const TrendingPrompts = memo(function TrendingPrompts({ allPrompts }: { allPrompts: PromptWithDetails[] }) {
  const [tab, setTab] = useState<'hot' | 'new'>('hot');

  const hotPrompts = useMemo(
    () => [...allPrompts].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5),
    [allPrompts],
  );

  const newPrompts = useMemo(
    () => [...allPrompts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [allPrompts],
  );

  const shown  = tab === 'hot' ? hotPrompts : newPrompts;
  const maxVal = tab === 'hot'
    ? (hotPrompts[0]?.usageCount ?? 1)
    : (newPrompts[0]
        ? Date.now() - new Date(newPrompts[newPrompts.length - 1].createdAt).getTime()
        : 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-slate-800">Trending Prompts</h3>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {([['hot', '🔥 Meistgenutzt'], ['new', '✨ Neueste']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-50">
        {shown.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Noch keine Prompts.</div>
        ) : shown.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-colors">
            <span className="text-sm font-extrabold w-5 text-slate-300 flex-shrink-0">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
            </span>
            <Avatar user={p.author} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span>{p.author.name.split(' ')[0]}</span>
                {tab === 'hot' ? (
                  <>
                    <span>🔁 {p.usageCount}× genutzt</span>
                    {p.avgRating > 0 && <span>⭐ {p.avgRating}</span>}
                  </>
                ) : (
                  <span>🕐 {new Date(p.createdAt).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })}</span>
                )}
              </div>
              {tab === 'hot' && <ImpactBar value={p.usageCount} max={maxVal as number} />}
            </div>
            <Link href={`/library?prompt=${p.id}`}
              className="text-xs text-slate-400 hover:text-emerald-600 transition-colors flex-shrink-0 font-medium">
              Ansehen →
            </Link>
          </div>
        ))}
      </div>

      <div className="px-6 py-3 border-t border-slate-50 text-center">
        <Link href="/library" className="text-xs text-emerald-600 font-semibold hover:underline">
          Alle Prompts in der Bibliothek →
        </Link>
      </div>
    </div>
  );
});

export default TrendingPrompts;
