'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import LevelBadge from '@/components/LevelBadge';
import type { WeeklyChallengeData, UserWithStats, LevelName } from '@/lib/types';
import { getLevelProgress } from '@/lib/points';

function Countdown({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Beendet'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d}T ${h}h ${m}min` : `${h}h ${m}min`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [endDate]);
  return <span className="font-mono font-bold tabular-nums">{timeLeft}</span>;
}

interface RecentPrompt {
  id: number; title: string; createdAt: string;
  author: { name: string; avatarColor: string };
}

export default function DashboardPage() {
  const [challenges, setChallenges] = useState<WeeklyChallengeData[]>([]);
  const [currentUser, setCurrentUser] = useState<UserWithStats | null>(null);
  const [allUsers, setAllUsers] = useState<UserWithStats[]>([]);
  const [recentPrompts, setRecentPrompts] = useState<RecentPrompt[]>([]);

  const loadUser = useCallback(() => {
    const uid = localStorage.getItem('promptarena_user_id');
    fetch('/api/users').then((r) => r.json()).then((users: UserWithStats[]) => {
      setAllUsers(users);
      const found = uid ? users.find((u) => u.id === parseInt(uid)) : null;
      setCurrentUser(found ?? users[0] ?? null);
    });
  }, []);

  useEffect(() => {
    fetch('/api/challenges').then((r) => r.json()).then((d) => setChallenges(Array.isArray(d) ? d : []));
    fetch('/api/prompts').then((r) => r.json()).then((d: RecentPrompt[]) => setRecentPrompts(d.slice(0, 8)));
    loadUser();
    window.addEventListener('userChanged', loadUser);
    return () => window.removeEventListener('userChanged', loadUser);
  }, [loadUser]);

  const rank = currentUser ? allUsers.findIndex((u) => u.id === currentUser.id) + 1 : null;
  const progress = currentUser ? getLevelProgress(currentUser.totalPoints) : null;

  return (
    <div>
      {/* Hero greeting */}
      <div className="rounded-2xl mb-6 p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F4C35 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #059669, transparent)', transform: 'translate(30%, -30%)' }} />
        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-1">Dashboard</p>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Hallo{currentUser ? `, ${currentUser.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Willkommen zurück in der PromptArena.
          {rank && <span className="ml-2 text-emerald-400 font-semibold">Du bist auf Rang #{rank}.</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Weekly Challenges – multiple can be active simultaneously */}
          {challenges.length === 0 ? (
            <div className="bg-slate-200 rounded-2xl h-44 animate-pulse" />
          ) : (
            <div className="space-y-4">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)' }}>
                  <div className="absolute top-0 right-0 text-9xl opacity-10 leading-none select-none" aria-hidden>🏆</div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                        Weekly Challenge
                      </span>
                      <span className="text-xs text-white/60">
                        {challenge.submissionCount} Einreichungen
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold mb-2">{challenge.title}</h2>
                    <p className="text-sm text-white/80 mb-5">{challenge.description}</p>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="text-sm text-white/70">
                        ⏱ Endet in: <Countdown endDate={challenge.endDate} />
                      </div>
                      <Link href="/submit"
                        className="bg-white text-emerald-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition-all hover:scale-105 shadow-lg">
                        Jetzt teilnehmen →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Neueste Aktivität</h3>
              <Link href="/library" className="text-xs text-emerald-600 font-semibold hover:underline">
                Alle anzeigen →
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {recentPrompts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Noch keine Aktivität.</div>
              ) : recentPrompts.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: p.author.avatarColor }}>
                    {p.author.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">{p.author.name.split(' ')[0]}</span>
                      <span className="text-slate-400"> hat eingereicht: </span>
                      <span className="text-emerald-700 font-medium">{p.title}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-slate-200 text-xs">+20 Pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {currentUser && progress ? (
            <>
              {/* User card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow"
                    style={{ backgroundColor: currentUser.avatarColor }}>
                    {currentUser.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-xs text-slate-500">{currentUser.department}</p>
                  </div>
                </div>
                <LevelBadge level={currentUser.level as LevelName} />
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">{progress.level}</span>
                    <span className="font-bold text-slate-800">{currentUser.totalPoints} Pts</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(progress.percentage, 100)}%`, background: 'linear-gradient(90deg, #059669, #0891b2)' }} />
                  </div>
                  {progress.nextLevel && (
                    <p className="text-xs text-slate-400 mt-1.5">
                      Noch <span className="font-semibold text-slate-600">{progress.max - progress.current} Pts</span> bis {progress.nextLevel}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
                  <p className="text-2xl font-extrabold text-emerald-600">#{rank}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Rang</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
                  <p className="text-2xl font-extrabold text-emerald-600">{currentUser.totalPoints}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Punkte</p>
                </div>
              </div>

              {/* Points guide */}
              <div className="rounded-xl border border-emerald-200 p-4" style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)' }}>
                <p className="text-sm font-bold text-emerald-800 mb-3">💡 Punkte verdienen</p>
                <div className="space-y-2">
                  {[
                    { icon: '📝', label: 'Prompt einreichen', pts: '+20' },
                    { icon: '🚀', label: 'Prompt genutzt', pts: '+5' },
                    { icon: '⭐', label: 'Bewertung abgeben', pts: '+3' },
                    { icon: '🏆', label: 'Challenge einreichen', pts: '+30' },
                    { icon: '🥇', label: 'Challenge gewinnen', pts: '+100' },
                  ].map(({ icon, label, pts }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-emerald-700">{icon} {label}</span>
                      <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full">{pts}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-200 rounded-2xl h-48 animate-pulse" />
              <div className="bg-slate-200 rounded-xl h-24 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
