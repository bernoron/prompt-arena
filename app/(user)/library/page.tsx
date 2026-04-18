'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PromptCard from '@/components/PromptCard';
import PromptModal from '@/components/PromptModal';
import FloatingPoints, { triggerFloat } from '@/components/FloatingPoints';
import LevelUpModal from '@/components/LevelUpModal';
import type { PromptWithDetails, Category } from '@/lib/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLevelUp } from '@/hooks/useLevelUp';

const CATEGORIES: { value: 'all' | Category; label: string; icon: string }[] = [
  { value: 'all',      label: 'Alle',     icon: '✨' },
  { value: 'Writing',  label: 'Writing',  icon: '✍️' },
  { value: 'Email',    label: 'Email',    icon: '📧' },
  { value: 'Analysis', label: 'Analysis', icon: '📊' },
  { value: 'Excel',    label: 'Excel',    icon: '📈' },
];

function LibraryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prompts, setPrompts] = useState<PromptWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<'all' | Category>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'most-used' | 'top-rated'>('newest');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithDetails | null>(null);
  const [levelUpName, setLevelUpName] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);
  const currentUserId = useCurrentUser();
  const { checkLevelUp } = useLevelUp(currentUserId);

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      setSuccessToast(true);
      router.replace('/library');
      setTimeout(() => setSuccessToast(false), 4000);
    }
  }, [searchParams, router]);

  // Auto-open prompt modal when ?prompt=<id> is in the URL
  useEffect(() => {
    const promptId = searchParams.get('prompt');
    if (!promptId || prompts.length === 0) return;
    const found = prompts.find((p) => p.id === Number(promptId));
    if (found) {
      setSelectedPrompt(found);
      router.replace('/library', { scroll: false });
    }
  }, [searchParams, prompts, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (currentUserId) params.set('userId', String(currentUserId));
    if (sortBy !== 'top-rated') params.set('sortBy', sortBy);
    try {
      const res = await fetch(`/api/prompts?${params}`);
      const data: PromptWithDetails[] = await res.json();
      if (Array.isArray(data)) {
        if (sortBy === 'top-rated') {
          data.sort((a, b) => b.avgRating - a.avgRating || b.voteCount - a.voteCount);
        }
        setPrompts(data);
      } else {
        setPrompts([]);
      }
    } catch {
      setPrompts([]);
    }
    setLoading(false);
  }, [category, debouncedSearch, currentUserId, sortBy]);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  // Prime the level baseline so first real action doesn't false-fire level-up
  useEffect(() => { if (currentUserId) checkLevelUp(); }, [currentUserId, checkLevelUp]);

  const handleVote = async (promptId: number, value: number) => {
    if (!currentUserId) return;

    // Optimistic update – reflect new vote instantly in the list
    setPrompts((prev) => prev.map((p) => {
      if (p.id !== promptId) return p;
      const wasNew  = !p.userVote;
      const newCount = wasNew ? p.voteCount + 1 : p.voteCount;
      return { ...p, userVote: value, voteCount: newCount };
    }));

    triggerFloat('+3 Pts', window.innerWidth / 2 - 28, window.innerHeight / 2 + 60);

    // Fire request + background-sync accurate data (avgRating requires server recalc)
    fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId, userId: currentUserId, value }),
    }).then(() => {
      fetchPrompts();
      checkLevelUp().then((newLevel) => { if (newLevel) setLevelUpName(newLevel); });
    });
  };

  const handleFavorite = async (promptId: number) => {
    if (!currentUserId) return;

    // Optimistic toggle in the local list
    setPrompts((prev) => prev.map((p) =>
      p.id === promptId ? { ...p, userFavorite: !p.userFavorite } : p,
    ));

    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId, userId: currentUserId }),
    });
    const data = await res.json() as { favorited: boolean };

    if (data.favorited) {
      triggerFloat('⭐ +10 Pts', window.innerWidth / 2 - 40, window.innerHeight / 2 + 60);
      checkLevelUp().then((newLevel) => { if (newLevel) setLevelUpName(newLevel); });
    }
    // Background sync for accuracy
    fetchPrompts();
  };

  const handleUsed = async (promptId: number) => {
    // Optimistic update – increment usageCount immediately
    setPrompts((prev) => prev.map((p) =>
      p.id === promptId ? { ...p, usageCount: p.usageCount + 1 } : p,
    ));
    setSelectedPrompt((prev) =>
      prev && prev.id === promptId ? { ...prev, usageCount: prev.usageCount + 1 } : prev,
    );

    triggerFloat('+5 Pts', window.innerWidth / 2 - 28, window.innerHeight / 2 + 80);

    fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId }),
    }).then(() => {
      fetchPrompts();
      checkLevelUp().then((newLevel) => { if (newLevel) setLevelUpName(newLevel); });
    });
  };

  return (
    <div>
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-pop-in">
          <span className="text-lg">🎉</span>
          <span className="font-semibold">Prompt eingereicht! <span className="font-bold">+20 Punkte</span></span>
          <button onClick={() => setSuccessToast(false)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Global overlays */}
      <FloatingPoints />
      {levelUpName && (
        <LevelUpModal newLevel={levelUpName} onClose={() => setLevelUpName(null)} />
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Prompt-Bibliothek</h1>
        <p className="text-slate-500 mt-1">Entdecke, nutze und bewerte die besten KI-Prompts deiner Kollegen.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">🔍</span>
          <input type="text" placeholder="Prompts durchsuchen…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-slate-50" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat.value} onClick={() => setCategory(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                category === cat.value
                  ? 'text-white shadow-sm'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
              }`}
              style={category === cat.value ? { background: 'linear-gradient(135deg, #059669, #0891b2)' } : {}}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex gap-2 mt-3 mb-4">
        {(['newest', 'most-used', 'top-rated'] as const).map((s) => (
          <button key={s} onClick={() => setSortBy(s)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
              sortBy === s
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
            }`}>
            {s === 'newest' ? '✨ Neueste' : s === 'most-used' ? '🔥 Meistgenutzt' : '⭐ Bestbewertet'}
          </button>
        ))}
      </div>

      {!loading && (
        <p className="text-xs text-slate-400 font-semibold mb-4 uppercase tracking-widest">
          {prompts.length} Prompt{prompts.length !== 1 ? 's' : ''}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-52 animate-pulse" />
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-slate-600 font-bold text-lg">Keine Prompts gefunden</p>
          <p className="text-slate-400 text-sm mt-1">Versuche einen anderen Suchbegriff oder Filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} onClick={() => setSelectedPrompt(prompt)} />
          ))}
        </div>
      )}

      {selectedPrompt && (
        <PromptModal
          prompt={selectedPrompt}
          currentUserId={currentUserId}
          onClose={() => setSelectedPrompt(null)}
          onVote={handleVote}
          onUsed={handleUsed}
          onFavorite={handleFavorite}
        />
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryPageInner />
    </Suspense>
  );
}
