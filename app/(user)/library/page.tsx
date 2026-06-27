'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PromptCard from '@/components/PromptCard';
import PromptModal from '@/components/PromptModal';
import FloatingPoints, { triggerFloat } from '@/components/FloatingPoints';
import LevelUpModal from '@/components/LevelUpModal';
import type { PromptWithDetails, Category, PromptCategoryInfo } from '@/lib/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { POINTS } from '@/lib/points';
import { useLevelUp } from '@/hooks/useLevelUp';

const PAGE_SIZE = 20;

interface PromptPage {
  items: PromptWithDetails[];
  nextCursor: number | null;
  hasNextPage: boolean;
}

function LibraryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [prompts, setPrompts]         = useState<PromptWithDetails[]>([]);
  const [nextCursor, setNextCursor]   = useState<number | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [category, setCategory] = useState<'all' | Category>('all');
  const [categories, setCategories] = useState<PromptCategoryInfo[]>([]);
  const [search, setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy]     = useState<'newest' | 'most-used'>('newest');

  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithDetails | null>(null);
  const [levelUpName, setLevelUpName]       = useState<string | null>(null);
  const [successToast, setSuccessToast]     = useState(false);

  const currentUserId = useCurrentUser();
  const { checkLevelUp } = useLevelUp(currentUserId);

  // Sentinel element for IntersectionObserver infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Toast on redirect from /submit ─────────────────────────────────────────
  useEffect(() => {
    if (searchParams.get('success') === '1') {
      setSuccessToast(true);
      router.replace('/library');
      setTimeout(() => setSuccessToast(false), 4000);
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  // ── Search debounce ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Build API URL ────────────────────────────────────────────────────────────
  const buildUrl = useCallback(
    (cursor?: number | null) => {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (debouncedSearch)    params.set('search', debouncedSearch);
      if (currentUserId)      params.set('userId', String(currentUserId));
      params.set('sortBy', sortBy);
      params.set('take', String(PAGE_SIZE));
      if (cursor)             params.set('cursor', String(cursor));
      return `/api/prompts?${params}`;
    },
    [category, debouncedSearch, currentUserId, sortBy],
  );

  // ── Initial / filter-change load (resets list) ───────────────────────────────
  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const url = buildUrl();
      const res  = await fetch(url);
      const data = await res.json() as PromptPage;
      const items  = data.items ?? [];
      setPrompts(items);
      setNextCursor(data.nextCursor);
      setHasNextPage(data.hasNextPage);
    } catch {
      setPrompts([]);
      setNextCursor(null);
      setHasNextPage(false);
    }
    setLoading(false);
  }, [buildUrl]);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  // ── Load more (append) ───────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!hasNextPage || loadingMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const res  = await fetch(buildUrl(nextCursor));
      const data = await res.json() as PromptPage;
      const items  = data.items ?? [];
      setPrompts((prev) => [...prev, ...items]);
      setNextCursor(data.nextCursor);
      setHasNextPage(data.hasNextPage);
    } catch { /* keep existing state */ }
    setLoadingMore(false);
  }, [hasNextPage, loadingMore, nextCursor, buildUrl]);

  // ── IntersectionObserver for infinite scroll ────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Prime level baseline ────────────────────────────────────────────────────
  useEffect(() => { if (currentUserId) checkLevelUp(); }, [currentUserId, checkLevelUp]);

  // ── Auto-open prompt from URL param ─────────────────────────────────────────
  useEffect(() => {
    const promptId = searchParams.get('prompt');
    if (!promptId || prompts.length === 0) return;
    const found = prompts.find((p) => p.id === Number(promptId));
    if (found) {
      setSelectedPrompt(found);
      router.replace('/library', { scroll: false });
    }
  }, [searchParams, prompts, router]);

  // ── Interactions ─────────────────────────────────────────────────────────────
  const handleVote = async (promptId: number, value: number) => {
    if (!currentUserId) return;
    setPrompts((prev) => prev.map((p) => {
      if (p.id !== promptId) return p;
      const wasNew  = !p.userVote;
      return { ...p, userVote: value, voteCount: wasNew ? p.voteCount + 1 : p.voteCount };
    }));
    triggerFloat('+3 Pts', window.innerWidth / 2 - 28, window.innerHeight / 2 + 60);
    fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId, userId: currentUserId, value }),
    }).then(() => {
      fetchPrompts();
      checkLevelUp().then((nl) => { if (nl) setLevelUpName(nl); });
    });
  };

  const handleFavorite = async (promptId: number) => {
    if (!currentUserId) return;
    setPrompts((prev) => prev.map((p) =>
      p.id === promptId ? { ...p, userFavorite: !p.userFavorite } : p,
    ));
    const res  = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId, userId: currentUserId }),
    });
    const data = await res.json() as { favorited: boolean };
    if (data.favorited) {
      triggerFloat('⭐ +10 Pts', window.innerWidth / 2 - 40, window.innerHeight / 2 + 60);
      checkLevelUp().then((nl) => { if (nl) setLevelUpName(nl); });
    }
    fetchPrompts();
  };

  const handleUsed = async (promptId: number) => {
    if (!currentUserId) return;
    setPrompts((prev) => prev.map((p) =>
      p.id === promptId ? { ...p, usageCount: p.usageCount + 1 } : p,
    ));
    setSelectedPrompt((prev) =>
      prev?.id === promptId ? { ...prev, usageCount: prev.usageCount + 1 } : prev,
    );
    triggerFloat('+5 Pts', window.innerWidth / 2 - 28, window.innerHeight / 2 + 80);
    fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId, userId: currentUserId }),
    }).then(() => {
      fetchPrompts();
      checkLevelUp().then((nl) => { if (nl) setLevelUpName(nl); });
    });
  };

  return (
    <div>
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-pop-in">
          <span className="text-lg">🎉</span>
          <span className="font-semibold">Prompt eingereicht! <span className="font-bold">+{POINTS.SUBMIT_PROMPT} Punkte</span></span>
          <button onClick={() => setSuccessToast(false)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      <FloatingPoints />
      {levelUpName && <LevelUpModal newLevel={levelUpName} onClose={() => setLevelUpName(null)} />}

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Prompt-Bibliothek</h1>
        <p className="text-slate-500 mt-1">Entdecke, nutze und bewerte die besten KI-Prompts deiner Kollegen.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">🔍</span>
          <input
            type="text"
            placeholder="Prompts durchsuchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-slate-50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ slug: 'all', label: 'Alle', icon: '✨' }, ...categories].map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug as 'all' | Category)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                category === cat.slug
                  ? 'text-white shadow-sm'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
              }`}
              style={category === cat.slug ? { background: 'linear-gradient(135deg, #059669, #0891b2)' } : {}}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex gap-2 mt-3 mb-4">
        {(['newest', 'most-used'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
              sortBy === s
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
            }`}
          >
            {s === 'newest' ? '✨ Neueste' : '🔥 Meistgenutzt'}
          </button>
        ))}
      </div>

      {!loading && (
        <p className="text-xs text-slate-400 font-semibold mb-4 uppercase tracking-widest">
          {prompts.length} Prompt{prompts.length !== 1 ? 's' : ''}
          {hasNextPage && ' (mehr verfügbar)'}
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} onClick={() => setSelectedPrompt(prompt)} />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-px mt-4" />

          {loadingMore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 h-52 animate-pulse" />
              ))}
            </div>
          )}

          {!hasNextPage && prompts.length > PAGE_SIZE && (
            <p className="text-center text-xs text-slate-400 mt-6">Alle {prompts.length} Prompts geladen</p>
          )}
        </>
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

// @spec AC-02-012
export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryPageInner />
    </Suspense>
  );
}
