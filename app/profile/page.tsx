'use client';

import { useState, useEffect, useCallback } from 'react';
import LevelBadge from '@/components/LevelBadge';
import CategoryBadge from '@/components/CategoryBadge';
import type { LevelName, Category } from '@/lib/types';
import { getLevelProgress } from '@/lib/points';

interface UserProfile {
  id: number; name: string; department: string; avatarColor: string;
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(() => {
    const uid = localStorage.getItem('promptarena_user_id');
    if (!uid) {
      fetch('/api/users').then(r => r.json()).then((users: { id: number }[]) => {
        if (users[0]) loadById(users[0].id);
      });
      return;
    }
    loadById(parseInt(uid));
  }, []);

  const loadById = (id: number) => {
    setLoading(true);
    fetch(`/api/users/${id}`).then(r => r.json()).then((data: UserProfile) => {
      setProfile(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadProfile();
    const handler = () => {
      const uid = localStorage.getItem('promptarena_user_id');
      if (uid) loadById(parseInt(uid));
    };
    window.addEventListener('userChanged', handler);
    return () => window.removeEventListener('userChanged', handler);
  }, [loadProfile]);

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
      <div className="rounded-2xl mb-6 p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #064E3B 100%)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10 rounded-full"
          style={{ background: 'radial-gradient(circle, #059669, transparent)', transform: 'translate(30%,-30%)' }} />
        <div className="flex items-start gap-5 flex-wrap relative">
          <span className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold flex-shrink-0 shadow-xl"
            style={{ backgroundColor: profile.avatarColor }}>
            {profile.name.split(' ').map(n => n[0]).join('')}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-extrabold text-white">{profile.name}</h1>
              <LevelBadge level={profile.level as LevelName} />
            </div>
            <p className="text-slate-400 text-sm">{profile.department} · Rang #{profile.rank}</p>
            <div className="mt-4 max-w-sm">
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
          </div>
          <div className="flex gap-3 ml-auto">
            {[
              { val: profile.totalPoints, label: 'Punkte' },
              { val: profile.prompts.length, label: 'Prompts' },
              { val: `#${profile.rank}`, label: 'Rang' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center bg-white/10 rounded-xl px-4 py-3 min-w-[68px]">
                <p className="text-xl font-extrabold text-white">{val}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompts */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                            p.difficulty === 'Fortgeschritten'
                              ? 'bg-violet-50 text-violet-700 border-violet-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>{p.difficulty}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">{p.title}</h3>
                        {p.titleEn !== p.title && <p className="text-xs text-slate-400 mt-0.5">{p.titleEn}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
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
    </div>
  );
}
