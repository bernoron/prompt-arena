'use client';

import { useState, useEffect } from 'react';
import LevelBadge from '@/components/LevelBadge';
import type { UserWithStats, LevelName, PromptWithDetails } from '@/lib/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';

function DeptBar({ dept, points, max }: { dept: string; points: number; max: number }) {
  const pct = max > 0 ? Math.round((points / max) * 100) : 0;
  const COLORS: Record<string, string> = {
    Schaden: 'from-emerald-500 to-teal-500',
    Vertrieb: 'from-blue-500 to-indigo-500',
    IT: 'from-amber-500 to-orange-500',
  };
  const gradient = COLORS[dept] ?? 'from-slate-400 to-slate-500';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{dept}</span>
        <span className="font-bold text-slate-800">{points} Pts</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5">
        <div className={`bg-gradient-to-r ${gradient} h-2.5 rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [topPrompt, setTopPrompt] = useState<PromptWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUserId = useCurrentUser();

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/prompts').then((r) => r.json()),
    ]).then(([u, p]: [UserWithStats[], PromptWithDetails[]]) => {
      setUsers(u);
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const thisWeek = p.filter((x) => new Date(x.createdAt).getTime() > oneWeekAgo);
      const best = [...(thisWeek.length ? thisWeek : p)].sort((a, b) => b.avgRating - a.avgRating)[0];
      setTopPrompt(best ?? null);
      setLoading(false);
    });
  }, []);

  const deptTotals: Record<string, number> = {};
  users.forEach((u) => { deptTotals[u.department] = (deptTotals[u.department] ?? 0) + u.totalPoints; });
  const maxDept = Math.max(...Object.values(deptTotals), 1);
  const top10 = users.slice(0, 10);
  const [top1, top2, top3, ...rest] = top10;

  return (
    <div>
      {/* Header */}
      <div className="rounded-2xl mb-6 p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #4C1D95 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full"
          style={{ background: 'radial-gradient(circle, #7C3AED, transparent)', transform: 'translate(30%,-30%)' }} />
        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-1">Leaderboard</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Rangliste</h1>
        <p className="text-slate-400 mt-1 text-sm">Die besten Prompt-Schreiber des Unternehmens.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 10 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Top 10 Individuen</h2>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Podium */}
                {top1 && top2 && top3 && (
                  <div className="px-6 pt-6 pb-4 flex items-end justify-center gap-3 border-b border-slate-100 bg-slate-50">
                    {[
                      { user: top2, rank: 2, height: 64, emoji: '🥈', bg: 'bg-slate-200', textColor: 'text-slate-500' },
                      { user: top1, rank: 1, height: 96, emoji: '🥇', bg: 'bg-gradient-to-b from-amber-200 to-amber-300', textColor: 'text-amber-600', crown: true, ring: 'ring-4 ring-amber-400' },
                      { user: top3, rank: 3, height: 48, emoji: '🥉', bg: 'bg-orange-100', textColor: 'text-orange-500' },
                    ].map(({ user, rank, height, emoji, bg, textColor, crown, ring }) => (
                      <div key={rank} className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
                        {crown && <span className="text-xl">👑</span>}
                        <span className={`${rank === 1 ? 'w-14 h-14' : 'w-11 h-11'} rounded-full flex items-center justify-center text-white font-extrabold shadow-lg ${ring ?? ''}`}
                          style={{ backgroundColor: user.avatarColor, fontSize: rank === 1 ? 18 : 14 }}>
                          {user.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                        <div className="text-center">
                          <p className={`${rank === 1 ? 'text-sm font-extrabold text-slate-900' : 'text-xs font-bold text-slate-700'} truncate max-w-[120px]`}>
                            {user.name.split(' ')[0]}
                          </p>
                          <p className={`text-xs font-bold ${textColor}`}>{user.totalPoints} Pts</p>
                        </div>
                        <div className={`w-full ${bg} rounded-t-lg flex items-center justify-center text-2xl`} style={{ height }}>
                          {emoji}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ranks 4–10 */}
                <div className="divide-y divide-slate-50">
                  {rest.map((user, i) => {
                    const isMe = user.id === currentUserId;
                    return (
                      <div key={user.id}
                        className={`flex items-center gap-4 px-6 py-3 transition-colors ${isMe ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                        <span className="w-7 text-center text-sm font-extrabold text-slate-400">#{i + 4}</span>
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: user.avatarColor }}>
                          {user.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm">{user.name}</span>
                            {isMe && <span className="text-xs text-emerald-600 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full">Du</span>}
                          </div>
                          <p className="text-xs text-slate-400">{user.department}</p>
                        </div>
                        <LevelBadge level={user.level as LevelName} size="sm" />
                        <div className="text-right flex-shrink-0">
                          <p className="font-extrabold text-emerald-600">{user.totalPoints}</p>
                          <p className="text-xs text-slate-400">Pts</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* My rank if outside top 10 */}
                {currentUserId && !top10.find(u => u.id === currentUserId) && (() => {
                  const me = users.find(u => u.id === currentUserId);
                  const myRank = users.findIndex(u => u.id === currentUserId) + 1;
                  if (!me) return null;
                  return (
                    <div className="border-t-2 border-dashed border-slate-200 px-6 py-3 bg-emerald-50 flex items-center gap-4">
                      <span className="w-7 text-center text-sm font-extrabold text-slate-400">#{myRank}</span>
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: me.avatarColor }}>
                        {me.name.split(' ').map((n) => n[0]).join('')}
                      </span>
                      <div className="flex-1">
                        <span className="font-semibold text-slate-900 text-sm">{me.name}</span>
                        <span className="ml-2 text-xs text-emerald-600 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full">Du</span>
                      </div>
                      <p className="font-extrabold text-emerald-600">{me.totalPoints} Pts</p>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 mb-4">🏢 Abteilungen</h2>
            <div className="space-y-4">
              {Object.entries(deptTotals)
                .sort(([, a], [, b]) => b - a)
                .map(([dept, pts]) => (
                  <DeptBar key={dept} dept={dept} points={pts} max={maxDept} />
                ))}
            </div>
          </div>

          {topPrompt && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">⭐</span>
                <h2 className="font-bold text-slate-800">Prompt der Woche</h2>
              </div>
              <div className="rounded-xl p-4 border border-amber-200" style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' }}>
                <h3 className="font-extrabold text-slate-900 text-sm mb-2 leading-tight">{topPrompt.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 font-mono bg-white/60 rounded-lg px-2 py-1.5">{topPrompt.content}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                      style={{ backgroundColor: topPrompt.author.avatarColor }}>
                      {topPrompt.author.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">{topPrompt.author.name.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={`text-sm ${s <= Math.round(topPrompt.avgRating) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                    ))}
                    <span className="text-xs font-bold text-amber-700 ml-1">{topPrompt.avgRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
