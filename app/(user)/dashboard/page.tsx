'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import LevelBadge from '@/components/LevelBadge';
import StatCard from '@/components/dashboard/StatCard';
import SinceLastVisit from '@/components/dashboard/SinceLastVisit';
import TrendingPrompts from '@/components/dashboard/TrendingPrompts';
import ImprovementCard from '@/components/dashboard/ImprovementCard';
import NextLessonWidget from '@/components/dashboard/NextLessonWidget';
import type { WeeklyChallengeData, UserWithStats, LevelName, PromptWithDetails, RankedUser, RankDiff, LearningModuleWithProgress } from '@/lib/types';
import { getLevelProgress } from '@/lib/points';
import { LEVEL_CONFIG } from '@/lib/constants';

// ─── Local types ──────────────────────────────────────────────────────────────

interface Snapshot { rank: number; pts: number; rankedUsers: RankedUser[]; }

// ─── Local helpers ────────────────────────────────────────────────────────────

/** Countdown timer shown inside the active challenge card. */
function Countdown({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent,   setUrgent]   = useState(false);
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Beendet'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setUrgent(diff < 86400000);
      setTimeLeft(d > 0 ? `${d}T ${h}h ${m}min` : `${h}h ${m}min`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [endDate]);
  return (
    <span className={`font-mono font-bold tabular-nums ${urgent ? 'text-rose-300 animate-pulse' : ''}`}>
      {urgent && '🔥 '}{timeLeft}
    </span>
  );
}

/** Horizontal usage bar used in "Meine Top-Prompts". */
function ImpactBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5">
      <div className="h-1.5 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #059669, #0891b2)' }} />
    </div>
  );
}

function computeDiff(
  users: UserWithStats[],
  currentUserId: number,
  snapshot: Snapshot,
): RankDiff {
  const currentRank = users.findIndex((u) => u.id === currentUserId) + 1;
  const prevRank    = snapshot.rank;
  const prevRanks: Record<number, number> = {};
  snapshot.rankedUsers.forEach((u, i) => { prevRanks[u.id] = i + 1; });

  const overtookMe = users.filter((u) => {
    if (u.id === currentUserId) return false;
    const theirCurr = users.findIndex((x) => x.id === u.id) + 1;
    const theirPrev = prevRanks[u.id];
    return theirPrev !== undefined && theirPrev > prevRank && theirCurr < currentRank;
  }).map((u) => ({ id: u.id, name: u.name, pts: u.totalPoints, avatarColor: u.avatarColor }));

  const iOvertook = users.filter((u) => {
    if (u.id === currentUserId) return false;
    const theirCurr = users.findIndex((x) => x.id === u.id) + 1;
    const theirPrev = prevRanks[u.id];
    return theirPrev !== undefined && theirPrev < prevRank && theirCurr > currentRank;
  }).map((u) => ({ id: u.id, name: u.name, pts: u.totalPoints, avatarColor: u.avatarColor }));

  return { delta: currentRank - prevRank, overtookMe, iOvertook };
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [challenges,     setChallenges]     = useState<WeeklyChallengeData[]>([]);
  const [currentUser,    setCurrentUser]    = useState<UserWithStats | null>(null);
  const [allUsers,       setAllUsers]       = useState<UserWithStats[]>([]);
  const [allPrompts,     setAllPrompts]     = useState<PromptWithDetails[]>([]);
  const [rankDiff,       setRankDiff]       = useState<RankDiff | null>(null);
  const [learnModules,   setLearnModules]   = useState<LearningModuleWithProgress[]>([]);
  const [loading,        setLoading]        = useState(true);

  const loadData = useCallback(() => {
    const uid    = localStorage.getItem('promptarena_user_id');
    const uidNum = uid ? parseInt(uid) : null;

    Promise.all([
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/challenges').then((r) => r.json()),
      fetch(`/api/prompts${uidNum ? `?userId=${uidNum}` : ''}`).then((r) => r.json()),
      fetch(`/api/learn${uidNum ? `?userId=${uidNum}` : ''}`).then((r) => r.json()),
    ]).then(([users, challengeData, promptData, learnData]: [UserWithStats[], WeeklyChallengeData[], PromptWithDetails[], LearningModuleWithProgress[]]) => {
      setLearnModules(Array.isArray(learnData) ? learnData : []);
      setAllUsers(users);
      setChallenges(Array.isArray(challengeData) ? challengeData : []);
      setAllPrompts(Array.isArray(promptData) ? promptData : []);

      const found = uidNum ? users.find((u) => u.id === uidNum) : null;
      const user  = found ?? users[0] ?? null;
      setCurrentUser(user);

      if (user) {
        const currentRank  = users.findIndex((u) => u.id === user.id) + 1;
        const snapshotKey  = `promptarena_snapshot_${user.id}`;
        const storedRaw    = localStorage.getItem(snapshotKey);
        const snapshot: Snapshot | null = storedRaw ? JSON.parse(storedRaw) : null;

        // Compute diff from last visit
        if (snapshot) {
          setRankDiff(computeDiff(users, user.id, snapshot));
        }

        // Persist new snapshot for next visit
        const newSnapshot: Snapshot = {
          rank: currentRank,
          pts:  user.totalPoints,
          rankedUsers: users.map((u) => ({
            id: u.id, name: u.name, pts: u.totalPoints, avatarColor: u.avatarColor,
          })),
        };
        localStorage.setItem(snapshotKey, JSON.stringify(newSnapshot));
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('userChanged', loadData);
    return () => window.removeEventListener('userChanged', loadData);
  }, [loadData]);

  const rank = useMemo(
    () => currentUser ? allUsers.findIndex((u) => u.id === currentUser.id) + 1 : null,
    [currentUser, allUsers],
  );
  const progress  = useMemo(
    () => currentUser ? getLevelProgress(currentUser.totalPoints) : null,
    [currentUser],
  );
  const levelConf = useMemo(
    () => currentUser ? LEVEL_CONFIG[currentUser.level as LevelName] : null,
    [currentUser],
  );

  const myPrompts = useMemo(
    () => currentUser ? allPrompts.filter((p) => p.author?.id === currentUser.id) : [],
    [currentUser, allPrompts],
  );
  const totalUsages = useMemo(() => myPrompts.reduce((s, p) => s + p.usageCount, 0), [myPrompts]);
  const topPrompts  = useMemo(
    () => [...myPrompts].sort((a, b) => b.usageCount - a.usageCount).slice(0, 3),
    [myPrompts],
  );
  const maxUsage = topPrompts[0]?.usageCount ?? 1;
  const top5     = useMemo(() => allUsers.slice(0, 5), [allUsers]);

  const motivLine = useMemo(() => {
    if (!rank) return 'Willkommen zurück in der PromptArena.';
    if (rank === 1) return '🏆 Du führst das Ranking an — bleib dran!';
    if (rank <= 3) return `🔥 Top 3! Nur noch ${rank - 1} Person${rank > 2 ? 'en' : ''} vor dir.`;
    return `Rang #${rank} — ein Prompt heute reicht um aufzuholen! 💪`;
  }, [rank]);

  return (
    <div className="space-y-6">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F4C35 100%)' }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #059669, transparent)', transform: 'translate(30%,-30%)' }} />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-5 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0891b2, transparent)', transform: 'translateY(40%)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {currentUser ? `Hallo, ${currentUser.name.split(' ')[0]}! ${levelConf?.icon ?? '👋'}` : 'Hallo 👋'}
            </h1>
            <p className="text-slate-400 mt-1.5 text-sm">{motivLine}</p>
          </div>
          {currentUser && (
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:scale-105 shadow-lg whitespace-nowrap">
                + Prompt einreichen
              </Link>
              <Link href="/library"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all whitespace-nowrap">
                Bibliothek →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      {currentUser && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={`#${rank}`}       label="Dein Rang"
            sub={rankDiff && rankDiff.delta !== 0 ? (rankDiff.delta < 0 ? `↑ ${Math.abs(rankDiff.delta)} seit letztem Besuch` : `↓ ${rankDiff.delta} seit letztem Besuch`) : undefined}
            color="emerald" />
          <StatCard value={`${currentUser.totalPoints}`} label="Punkte"
            sub={progress?.nextLevel ? `Noch ${progress.max - progress.current} bis ${progress.nextLevel}` : '🏆 Max. Level'}
            color="blue" />
          <StatCard value={`${totalUsages}×`} label="Meine Prompts genutzt" sub={`${myPrompts.length} Prompts`} color="purple" />
          <StatCard
            value={`${myPrompts.reduce((s, p) => s + p.voteCount, 0)}`}
            label="Erhaltene Bewertungen"
            sub={myPrompts.length > 0 ? `⌀ ${(myPrompts.reduce((s, p) => s + p.avgRating, 0) / (myPrompts.length || 1)).toFixed(1)} ★` : undefined}
            color="amber" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main column ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Since last visit */}
          {rankDiff && <SinceLastVisit diff={rankDiff} />}

          {/* Challenges */}
          {loading ? (
            <div className="bg-slate-200 rounded-2xl h-44 animate-pulse" />
          ) : challenges.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-3xl mb-2">🏆</p>
              <p className="font-bold text-slate-700">Aktuell keine aktive Challenge</p>
              <p className="text-sm text-slate-400 mt-1">Schau bald wieder vorbei — die nächste Challenge startet demnächst.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {challenges.map((challenge) => (
                <div key={challenge.id}
                  className="rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #065f46 0%, #0e7490 100%)' }}>
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.07), transparent 60%)' }} />
                  <div className="absolute top-3 right-4 text-7xl opacity-10 leading-none select-none" aria-hidden>🏆</div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                        🏆 Weekly Challenge
                      </span>
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                        {challenge.submissionCount} Einreichungen
                      </span>
                      <span className="text-xs bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full font-bold">
                        +30 Pts Teilnahme · +100 Pts Sieg
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold mb-1.5">{challenge.title}</h2>
                    <p className="text-sm text-white/75 mb-5 leading-relaxed">{challenge.description}</p>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="text-sm text-white/70">
                        ⏱ Endet in: <Countdown endDate={challenge.endDate} />
                      </div>
                      <Link href="/submit"
                        className="bg-white text-emerald-800 font-extrabold text-sm px-6 py-2.5 rounded-xl hover:bg-emerald-50 transition-all hover:scale-105 shadow-lg">
                        Jetzt mitmachen →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trending Prompts */}
          <TrendingPrompts allPrompts={allPrompts} />

          {/* My top prompts */}
          {myPrompts.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">Meine Top-Prompts 🚀</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Wie oft werden deine Prompts genutzt</p>
                </div>
                <Link href="/library" className="text-xs text-emerald-600 font-semibold hover:underline">
                  Alle anzeigen →
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {topPrompts.map((p) => (
                  <div key={p.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span>🔁 {p.usageCount}× genutzt</span>
                          <span>⭐ {p.avgRating > 0 ? `${p.avgRating} (${p.voteCount})` : 'noch keine'}</span>
                        </div>
                        <ImpactBar value={p.usageCount} max={maxUsage} />
                      </div>
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        +{p.usageCount * 5} Pts verdient
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          {currentUser && progress && rank ? (
            <>
              {/* User / XP card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow"
                    style={{ backgroundColor: currentUser.avatarColor }}>
                    {currentUser.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                    <p className="text-xs text-slate-500">{currentUser.department}</p>
                  </div>
                </div>
                <LevelBadge level={currentUser.level as LevelName} />
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">{progress.level}</span>
                    <span className="font-bold text-slate-800">{currentUser.totalPoints} Pts</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(progress.percentage, 100)}%`, background: 'linear-gradient(90deg, #059669, #0891b2)' }} />
                  </div>
                  {progress.nextLevel ? (
                    <p className="text-xs text-slate-400 mt-1.5">
                      Noch <span className="font-semibold text-slate-600">{progress.max - progress.current} Pts</span> bis{' '}
                      <span className="font-semibold text-emerald-700">{progress.nextLevel}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-600 font-bold mt-1.5">🏆 Höchstes Level erreicht!</p>
                  )}
                </div>
              </div>

              {/* Improvement tips */}
              <ImprovementCard
                currentUser={currentUser}
                rank={rank}
                allUsers={allUsers}
                hasChallenges={challenges.length > 0}
              />

              {/* Next lesson widget */}
              <NextLessonWidget modules={learnModules} />

              {/* Mini leaderboard */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">🏅 Top Rangliste</h3>
                  <Link href="/leaderboard" className="text-xs text-emerald-600 font-semibold hover:underline">Alle →</Link>
                </div>
                <div className="divide-y divide-slate-50">
                  {top5.map((u, i) => {
                    const isMe  = u.id === currentUser.id;
                    const medal = ['🥇', '🥈', '🥉'][i] ?? `#${i + 1}`;
                    const diff  = rankDiff?.overtookMe.find((x) => x.id === u.id)
                      ? '↑' : rankDiff?.iOvertook.find((x) => x.id === u.id)
                      ? '↓' : null;
                    return (
                      <div key={u.id}
                        className={`flex items-center gap-2.5 px-5 py-2.5 transition-colors ${
                          isMe ? 'bg-emerald-50 border-l-2 border-emerald-400' : 'hover:bg-slate-50'
                        }`}>
                        <span className="text-sm w-6 text-center flex-shrink-0">{medal}</span>
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: u.avatarColor }}>
                          {u.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${isMe ? 'text-emerald-800' : 'text-slate-700'}`}>
                            {u.name.split(' ')[0]} {isMe && '(du)'}
                          </p>
                        </div>
                        {diff && (
                          <span className={`text-xs font-extrabold ${diff === '↑' ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {diff}
                          </span>
                        )}
                        <span className={`text-xs font-bold ${isMe ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {u.totalPoints} Pts
                        </span>
                      </div>
                    );
                  })}
                  {rank > 5 && (
                    <>
                      <div className="px-5 py-1 text-center text-slate-300 text-xs">· · ·</div>
                      <div className="flex items-center gap-2.5 px-5 py-2.5 bg-emerald-50 border-l-2 border-emerald-400">
                        <span className="text-xs w-6 text-center font-bold text-emerald-700">#{rank}</span>
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: currentUser.avatarColor }}>
                          {currentUser.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-800 truncate">
                            {currentUser.name.split(' ')[0]} (du)
                          </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-700">{currentUser.totalPoints} Pts</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Points guide */}
              <div className="rounded-2xl border border-emerald-200 p-4"
                style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)' }}>
                <p className="text-sm font-bold text-emerald-800 mb-3">💡 Punkte verdienen</p>
                <div className="space-y-2">
                  {[
                    { icon: '📝', label: 'Prompt einreichen',   pts: '+20',  href: '/submit' },
                    { icon: '🚀', label: 'Prompt genutzt',       pts: '+5',   href: null },
                    { icon: '⭐', label: 'Bewertung abgeben',    pts: '+3',   href: '/library' },
                    { icon: '🏆', label: 'Challenge teilnehmen', pts: '+30',  href: '/submit' },
                    { icon: '🥇', label: 'Challenge gewinnen',   pts: '+100', href: null },
                  ].map(({ icon, label, pts, href }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      {href ? (
                        <Link href={href} className="text-emerald-700 hover:text-emerald-900 hover:underline">
                          {icon} {label}
                        </Link>
                      ) : (
                        <span className="text-emerald-700">{icon} {label}</span>
                      )}
                      <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full">{pts}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-200 rounded-2xl h-48 animate-pulse" />
              <div className="bg-slate-200 rounded-xl h-40 animate-pulse" />
              <div className="bg-slate-200 rounded-xl h-32 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
