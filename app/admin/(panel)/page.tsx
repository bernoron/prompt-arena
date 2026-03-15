'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totals: { users: number; prompts: number; votes: number; usages: number };
  topPrompts: { id: number; title: string; category: string; usageCount: number; author: string }[];
  recentUsers: { id: number; name: string; department: string; totalPoints: number; createdAt: string }[];
  categoryBreakdown: { category: string; count: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Writing:  'bg-teal-100 text-teal-700',
  Email:    'bg-indigo-100 text-indigo-700',
  Analysis: 'bg-orange-100 text-orange-700',
  Excel:    'bg-green-100 text-green-700',
};

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setStats).catch(() => null);
  }, []);

  if (!stats) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-slate-200 rounded-2xl h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  const kpis = [
    { label: 'Nutzer',   value: stats.totals.users,   icon: '👥', color: 'text-blue-600',    href: '/admin/users' },
    { label: 'Prompts',  value: stats.totals.prompts,  icon: '📝', color: 'text-emerald-600', href: '/admin/prompts' },
    { label: 'Bewertungen', value: stats.totals.votes, icon: '⭐', color: 'text-amber-600',   href: null },
    { label: 'Nutzungen',   value: stats.totals.usages, icon: '🚀', color: 'text-violet-600', href: null },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin-Übersicht</h1>
        <p className="text-slate-400 text-sm mt-1">Alle wichtigen Kennzahlen auf einen Blick.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon, color, href }) => {
          const card = (
            <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 ${href ? 'hover:border-emerald-300 transition-colors cursor-pointer' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{icon}</span>
                {href && <span className="text-xs text-slate-400">→</span>}
              </div>
              <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
            </div>
          );
          return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-bold text-slate-800 mb-4">📂 Prompts nach Kategorie</h2>
          <div className="space-y-3">
            {stats.categoryBreakdown.sort((a, b) => b.count - a.count).map(({ category, count }) => {
              const pct = Math.round((count / stats.totals.prompts) * 100);
              return (
                <div key={category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[category] ?? 'bg-slate-100 text-slate-600'}`}>
                      {category}
                    </span>
                    <span className="font-bold text-slate-700">{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Prompts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800">🚀 Meistgenutzte Prompts</h2>
            <Link href="/admin/prompts" className="text-xs text-emerald-600 hover:underline font-semibold">Alle →</Link>
          </div>
          <div className="space-y-2">
            {stats.topPrompts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50">
                <span className="w-6 text-center text-xs font-extrabold text-slate-400">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                  <p className="text-xs text-slate-400">{p.author}</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {p.usageCount}×
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">🆕 Neue Nutzer</h2>
          <Link href="/admin/users" className="text-xs text-emerald-600 hover:underline font-semibold">Alle verwalten →</Link>
        </div>
        <div className="divide-y divide-slate-50">
          {stats.recentUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                <p className="text-xs text-slate-400">{u.department}</p>
              </div>
              <span className="text-xs font-bold text-emerald-600">{u.totalPoints} Pts</span>
              <span className="text-xs text-slate-400">
                {new Date(u.createdAt).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
