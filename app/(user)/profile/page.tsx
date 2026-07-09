'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LevelBadge from '@/components/LevelBadge';
import CategoryBadge from '@/components/CategoryBadge';
import DifficultyBadge from '@/components/DifficultyBadge';
import type { LevelName, Category } from '@/lib/types';
import { getLevelProgress } from '@/lib/points';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface UserProfile {
  id: number; name: string; avatarColor: string;
  totalPoints: number; level: string; createdAt: string; rank: number;
  prompts: {
    id: number; title: string; titleEn: string; category: string;
    difficulty: string; usageCount: number; avgRating: number; voteCount: number; createdAt: string;
  }[];
}

const BADGES = [
  { id: 'first_prompt', label: 'Erster Prompt',  icon: '📝', desc: 'Ersten Prompt eingereicht',   condition: (u: UserProfile) => (u.prompts ?? []).length >= 1 },
  { id: 'five_prompts', label: 'Fleissig',        icon: '✍️', desc: '5 Prompts eingereicht',       condition: (u: UserProfile) => (u.prompts ?? []).length >= 5 },
  { id: 'popular',      label: 'Beliebt',         icon: '🚀', desc: 'Prompt 10× genutzt',          condition: (u: UserProfile) => (u.prompts ?? []).some(p => p.usageCount >= 10) },
  { id: 'top_rated',    label: 'Top-Bewertet',    icon: '⭐', desc: 'Prompt mit 4+ Sternen',       condition: (u: UserProfile) => (u.prompts ?? []).some(p => p.avgRating >= 4) },
  { id: 'handwerker',   label: 'Handwerker',      icon: '🔨', desc: '100 Punkte erreicht',         condition: (u: UserProfile) => u.totalPoints >= 100 },
  { id: 'schmied',      label: 'Prompt-Schmied',  icon: '⚒️', desc: '300 Punkte erreicht',         condition: (u: UserProfile) => u.totalPoints >= 300 },
  { id: 'botschafter',  label: 'KI-Botschafter',  icon: '🏅', desc: '600 Punkte erreicht',         condition: (u: UserProfile) => u.totalPoints >= 600 },
];

// @spec AC-10-002, AC-10-003, AC-10-004, AC-10-005
export default function ProfilePage() {
  const currentUserId = useCurrentUser();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Account deletion (CR-002) — @spec AC-01-013
  const [showDelete, setShowDelete]     = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError]   = useState('');
  const [deleting, setDeleting]         = useState(false);

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    setDeleting(true);

    const res = await fetch('/api/account', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: deletePassword }),
    });

    if (res.ok) {
      // Session cookie is cleared server-side; hard-navigate so the layout
      // re-evaluates auth and the user lands on the public login page.
      window.location.href = '/login';
    } else {
      const data = await res.json() as { error?: string };
      setDeleteError(data.error ?? 'Löschen fehlgeschlagen.');
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/users/${currentUserId}`).then(r => r.json()).then((data: UserProfile) => {
      setProfile(data);
      setLoading(false);
    });
  }, [currentUserId]);

  if (!loading && !profile) {
    if (!currentUserId) {
      return (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">👤</p>
          <p className="font-bold text-slate-700 text-lg">Kein Nutzer ausgewählt</p>
          <p className="text-slate-400 mt-2">Wähle deinen Namen oben rechts aus, um dein Profil zu sehen.</p>
        </div>
      );
    }
  }

  if (loading || !profile) {
    return (
      <div className="space-y-4">
        <div className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        <div className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  const progress = getLevelProgress(profile.totalPoints);
  const earnedBadges = BADGES.filter(b => b.condition(profile));
  const lockedBadges = BADGES.filter(b => !b.condition(profile));

  return (
    <div>
      {/* Profile hero */}
      <div className="rounded-2xl mb-4 sm:mb-6 p-4 sm:p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #064E3B 100%)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10 rounded-full"
          style={{ background: 'radial-gradient(circle, #059669, transparent)', transform: 'translate(30%,-30%)' }} />
        <div className="relative space-y-4">
          {/* Avatar + Name row */}
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold shrink-0 shadow-xl"
              style={{ backgroundColor: profile.avatarColor }}>
              {profile.name.split(' ').map(n => n[0]).join('')}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">{profile.name}</h1>
                <LevelBadge level={profile.level as LevelName} />
              </div>
              <p className="text-slate-400 text-sm">Rang #{profile.rank}</p>
            </div>
          </div>
          {/* XP bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">{progress.level}</span>
              <span className="font-bold text-white">{profile.totalPoints} Pts</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5">
              <div className="h-2.5 rounded-full transition-all"
                style={{ width: `${Math.min(progress.percentage, 100)}%`, background: 'linear-gradient(90deg, #34D399, #22D3EE)' }} />
            </div>
            {progress.nextLevel ? (
              <p className="text-xs text-slate-400 mt-1.5">
                Noch <span className="text-emerald-400 font-semibold">{progress.max - progress.current} Pts</span> bis {progress.nextLevel}
              </p>
            ) : (
              <p className="text-xs text-emerald-400 mt-1.5 font-semibold">✓ Maximales Level erreicht!</p>
            )}
          </div>
          {/* Stat boxes – full-width row on mobile */}
          <div className="flex gap-2">
            {[
              { val: profile.totalPoints, label: 'Punkte' },
              { val: profile.prompts.length, label: 'Prompts' },
              { val: `#${profile.rank}`, label: 'Rang' },
            ].map(({ val, label }) => (
              <div key={label} className="flex-1 text-center bg-white/10 rounded-xl px-2 sm:px-4 py-2 sm:py-3">
                <p className="text-lg sm:text-xl font-extrabold text-white">{val}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompts */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Meine Prompts</h2>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{profile.prompts.length}</span>
            </div>
            {profile.prompts.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-5xl mb-3">📝</p>
                <p className="text-slate-500 font-medium">Noch keine Prompts eingereicht.</p>
                <a href="/submit"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-white font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
                  Ersten Prompt einreichen →
                </a>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {profile.prompts.map((p) => (
                  <div key={p.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <CategoryBadge category={p.category as Category} size="sm" />
                          <DifficultyBadge difficulty={p.difficulty as import('@/lib/types').Difficulty} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">{p.title}</h3>
                        {p.titleEn !== p.title && <p className="text-xs text-slate-400 mt-0.5">{p.titleEn}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold text-emerald-600">{p.usageCount}×</p>
                        <p className="text-xs text-slate-400">genutzt</p>
                        {p.voteCount > 0 && (
                          <div className="flex items-center gap-0.5 justify-end mt-1">
                            {[1,2,3,4,5].map(s => (
                              <span key={s} className={`text-xs ${s <= Math.round(p.avgRating) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        <div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h2 className="font-bold text-slate-800 mb-4">
              Badges
              <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {earnedBadges.length}/{BADGES.length}
              </span>
            </h2>
            <div className="space-y-2">
              {earnedBadges.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200"
                  style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)' }}>
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">{b.label}</p>
                    <p className="text-xs text-emerald-600">{b.desc}</p>
                  </div>
                  <span className="ml-auto text-emerald-500 font-bold">✓</span>
                </div>
              ))}
              {lockedBadges.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 opacity-50">
                  <span className="text-2xl grayscale">{b.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{b.label}</p>
                    <p className="text-xs text-slate-400">{b.desc}</p>
                  </div>
                  <span className="ml-auto text-slate-300">🔒</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone — account deletion (CR-002) — @spec AC-01-013 */}
      <div className="mt-6 bg-white rounded-2xl border border-red-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100 bg-red-50">
          <h2 className="font-bold text-red-700">Gefahrenzone</h2>
        </div>
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-800 text-sm">Konto löschen</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Entfernt deine persönlichen Daten endgültig. Deine Beiträge bleiben anonymisiert erhalten. Dies kann nicht rückgängig gemacht werden.
            </p>
          </div>
          <button
            onClick={() => { setShowDelete(true); setDeleteError(''); setDeletePassword(''); }}
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
          >
            Konto löschen
          </button>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !deleting && setShowDelete(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-extrabold text-slate-900 text-lg">Konto wirklich löschen?</h3>
            <p className="text-sm text-slate-500 mt-1.5">
              Gib zur Bestätigung dein Passwort ein. Dieser Schritt ist endgültig.
            </p>
            <form onSubmit={handleDeleteAccount} className="mt-4 space-y-3">
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Dein Passwort"
                autoFocus
                autoComplete="current-password"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-400 focus:border-transparent focus:bg-white transition-all"
              />
              {deleteError && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <span>⚠️</span><span>{deleteError}</span>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDelete(false)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-40"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={deleting || !deletePassword}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Löschen…' : 'Endgültig löschen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
