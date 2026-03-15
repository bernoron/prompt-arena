'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CategoryBadge from '@/components/CategoryBadge';
import DifficultyBadge from '@/components/DifficultyBadge';
import type { Category, Difficulty, WeeklyChallengeData, UserWithStats } from '@/lib/types';

const CATEGORIES: { value: Category; icon: string }[] = [
  { value: 'Writing',  icon: '✍️' },
  { value: 'Email',    icon: '📧' },
  { value: 'Analysis', icon: '📊' },
  { value: 'Excel',    icon: '📈' },
];
const DIFFICULTIES: Difficulty[] = ['Einstieg', 'Fortgeschritten'];

function LivePreviewCard({ title, titleEn, content, category, difficulty, authorName, authorColor }: {
  title: string; titleEn: string; content: string;
  category: Category | ''; difficulty: Difficulty;
  authorName: string; authorColor: string;
}) {
  const initials = authorName.split(' ').filter(Boolean).map((n) => n[0]).join('') || '?';
  const ACCENT: Record<string, string> = { Writing: 'border-t-teal-400', Email: 'border-t-indigo-400', Analysis: 'border-t-orange-400', Excel: 'border-t-green-400' };
  const accent = (category && ACCENT[category]) ?? 'border-t-slate-200';
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 border-t-4 ${accent} shadow-sm p-5`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          {category && <CategoryBadge category={category} size="sm" />}
          <DifficultyBadge difficulty={difficulty} />
        </div>
        <span className="text-xs text-slate-400">0× genutzt</span>
      </div>
      <h3 className="font-bold text-slate-900 mb-0.5 min-h-5 leading-snug">
        {title || <span className="text-slate-300 font-normal">Titel Deutsch...</span>}
      </h3>
      <p className="text-xs text-slate-400 mb-3 min-h-4">
        {titleEn || <span className="text-slate-200">Title English (optional)...</span>}
      </p>
      <p className="text-xs text-slate-500 line-clamp-3 mb-4 whitespace-pre-wrap font-mono bg-slate-50 rounded-lg px-3 py-2 min-h-10">
        {content || <span className="text-slate-300 font-sans">Prompt-Vorschau erscheint hier...</span>}
      </p>
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
          style={{ backgroundColor: authorColor || '#059669' }}>{initials}</span>
        <span className="text-xs text-slate-500 font-medium">{authorName.split(' ')[0] || 'Du'}</span>
      </div>
    </div>
  );
}

export default function SubmitPage() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<WeeklyChallengeData | null>(null);
  const [currentUser, setCurrentUser] = useState<UserWithStats | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [linkChallenge, setLinkChallenge] = useState(false);
  const [form, setForm] = useState({
    title: '', titleEn: '', content: '', contentEn: '',
    category: '' as Category | '',
    difficulty: 'Einstieg' as Difficulty,
  });

  const loadUser = useCallback(() => {
    const uid = localStorage.getItem('promptarena_user_id');
    if (!uid) return;
    fetch(`/api/users/${uid}`)
      .then((r) => r.json())
      .then((user: UserWithStats) => {
        if (user && user.id) setCurrentUser(user);
      });
  }, []);

  useEffect(() => {
    fetch('/api/challenges').then((r) => r.json()).then(setChallenge);
    loadUser();
    window.addEventListener('userChanged', loadUser);
    return () => window.removeEventListener('userChanged', loadUser);
  }, [loadUser]);

  const setField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const valid = !!(form.title && form.content && form.category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !currentUser) return;
    setSubmitting(true);
    const res = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        titleEn: form.titleEn.trim() || form.title,
        contentEn: form.contentEn.trim() || form.content,
        authorId: currentUser.id,
        challengeId: linkChallenge && challenge ? challenge.id : undefined,
      }),
    });
    if (res.ok) router.push('/library?success=1');
    setSubmitting(false);
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all";
  const labelCls = "block text-sm font-semibold text-slate-700 mb-1.5";

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Prompt einreichen</h1>
        <p className="text-slate-500 mt-1">
          Teile deinen besten KI-Prompt mit dem Team und erhalte{' '}
          <span className="font-bold text-emerald-600">+20 Punkte</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Weekly challenge */}
          {challenge && (
            <div onClick={() => setLinkChallenge((v) => !v)}
              className={`rounded-2xl border-2 p-4 cursor-pointer transition-all ${
                linkChallenge
                  ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}>
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  linkChallenge ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                }`}>
                  {linkChallenge && <span className="text-white text-xs leading-none font-bold">✓</span>}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">🏆 Für Weekly Challenge einreichen</p>
                  <p className="text-sm text-slate-600 mt-0.5">{challenge.title}</p>
                  <span className="mt-1.5 inline-block text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">+30 Zusatzpunkte</span>
                </div>
              </div>
            </div>
          )}

          {/* Category */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <label className={labelCls}>
              Kategorie <span className="text-red-400 font-normal">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ value: cat, icon }) => (
                <button key={cat} type="button" onClick={() => setField('category', cat)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    form.category === cat
                      ? 'border-emerald-500 text-white shadow-sm'
                      : 'border-slate-200 text-slate-600 bg-slate-50 hover:border-slate-300 hover:bg-white'
                  }`}
                  style={form.category === cat ? { background: 'linear-gradient(135deg, #059669, #0891b2)' } : {}}>
                  <span>{icon}</span> {cat}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className={labelCls}>Schwierigkeit</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button key={d} type="button" onClick={() => setField('difficulty', d)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      form.difficulty === d
                        ? d === 'Fortgeschritten'
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 bg-slate-50 hover:border-slate-300'
                    }`}>
                    {d === 'Einstieg' ? '🟢' : '🟣'} {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Titles */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>🇩🇪 Titel Deutsch <span className="text-red-400 font-normal">*</span></label>
                <input value={form.title} onChange={(e) => setField('title', e.target.value)}
                  placeholder="z.B. E-Mail aus Stichpunkten" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>🇬🇧 Title English <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
                <input value={form.titleEn} onChange={(e) => setField('titleEn', e.target.value)}
                  placeholder="e.g. Email from Bullet Points" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Prompts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <div>
              <label className={labelCls}>🇩🇪 Prompt Deutsch <span className="text-red-400 font-normal">*</span></label>
              <textarea value={form.content} onChange={(e) => setField('content', e.target.value)}
                rows={5} placeholder="Schreibe hier deinen Prompt auf Deutsch..."
                className={`${inputCls} resize-none font-mono`} />
            </div>
            <div>
              <label className={labelCls}>🇬🇧 Prompt English <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
              <textarea value={form.contentEn} onChange={(e) => setField('contentEn', e.target.value)}
                rows={5} placeholder="Write your prompt in English here..."
                className={`${inputCls} resize-none font-mono`} />
            </div>
          </div>

          {!currentUser && (
            <div className="flex items-center gap-3 bg-amber-50 px-4 py-3 rounded-xl border border-amber-200">
              <span className="text-amber-500 text-lg">⚠️</span>
              <p className="text-sm text-amber-700 font-medium">Wähle oben rechts einen Nutzer aus, um einzureichen.</p>
            </div>
          )}

          {/* Missing fields */}
          {currentUser && !valid && (
            <div className="flex flex-wrap gap-2">
              {!form.category && (
                <span className="px-3 py-1 rounded-full bg-red-50 text-red-500 border border-red-100 text-xs font-semibold">
                  ✗ Kategorie fehlt
                </span>
              )}
              {!form.title && (
                <span className="px-3 py-1 rounded-full bg-red-50 text-red-500 border border-red-100 text-xs font-semibold">
                  ✗ Titel fehlt
                </span>
              )}
              {!form.content && (
                <span className="px-3 py-1 rounded-full bg-red-50 text-red-500 border border-red-100 text-xs font-semibold">
                  ✗ Prompt fehlt
                </span>
              )}
            </div>
          )}

          <button type="submit" disabled={!valid || !currentUser || submitting}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
            style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
            {submitting ? '⏳ Wird eingereicht...' : '🚀 Prompt einreichen (+20 Punkte)'}
          </button>
        </form>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-24 self-start space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live-Vorschau</p>
          <LivePreviewCard
            title={form.title} titleEn={form.titleEn} content={form.content}
            category={form.category} difficulty={form.difficulty}
            authorName={currentUser?.name ?? ''} authorColor={currentUser?.avatarColor ?? '#059669'}
          />
          {valid && (
            <div className="p-4 rounded-2xl border border-emerald-200"
              style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)' }}>
              <p className="text-sm font-bold text-emerald-800">✅ Bereit zum Einreichen</p>
              <p className="text-xs text-emerald-600 mt-1">
                Du erhältst <span className="font-bold">+20 Punkte</span>
                {linkChallenge ? <span className="font-bold"> + 30 Challenge-Punkte</span> : ''}.
              </p>
            </div>
          )}
          {/* Tips */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">💡 Tipps für gute Prompts</p>
            <ul className="space-y-2 text-xs text-slate-500">
              <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold flex-shrink-0">→</span> Sei spezifisch: Erkläre den Kontext und das gewünschte Ergebnis</li>
              <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold flex-shrink-0">→</span> Gib Beispiele oder ein Format vor</li>
              <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold flex-shrink-0">→</span> Verwende Platzhalter wie [THEMA] für Variablen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
