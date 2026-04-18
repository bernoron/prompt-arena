'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PromptCard from '@/components/PromptCard';
import PromptModal from '@/components/PromptModal';
import FloatingPoints, { triggerFloat } from '@/components/FloatingPoints';
import LevelUpModal from '@/components/LevelUpModal';
import type { PromptWithDetails } from '@/lib/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLevelUp } from '@/hooks/useLevelUp';

// ─── Favorites Page ───────────────────────────────────────────────────────────

export default function FavoritesPage() {
  const currentUserId = useCurrentUser();
  const { checkLevelUp } = useLevelUp(currentUserId);

  const [prompts, setPrompts] = useState<PromptWithDetails[]>([]);
  const [filtered, setFiltered] = useState<PromptWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithDetails | null>(null);
  const [levelUpName, setLevelUpName] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!currentUserId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/favorites?userId=${currentUserId}`);
      const data: PromptWithDetails[] = await res.json();
      setPrompts(Array.isArray(data) ? data : []);
    } catch {
      setPrompts([]);
    }
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  // Prime level baseline
  useEffect(() => { if (currentUserId) checkLevelUp(); }, [currentUserId, checkLevelUp]);

  // Client-side search filter
  useEffect(() => {
    if (!search.trim()) { setFiltered(prompts); return; }
    const q = search.toLowerCase();
    setFiltered(prompts.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.author.name.toLowerCase().includes(q),
    ));
  }, [search, prompts]);

  const handleVote = async (promptId: number, value: number) => {
    if (!currentUserId) return;
    triggerFloat('+3 Pts', window.innerWidth / 2 - 28, window.innerHeight / 2 + 60);
    fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId, userId: currentUserId, value }),
    }).then(() => {
      fetchFavorites();
      checkLevelUp().then((newLevel) => { if (newLevel) setLevelUpName(newLevel); });
    });
  };

  const handleUsed = async (promptId: number) => {
    setPrompts((prev) => prev.map((p) =>
      p.id === promptId ? { ...p, usageCount: p.usageCount + 1 } : p,
    ));
    triggerFloat('+5 Pts', window.innerWidth / 2 - 28, window.innerHeight / 2 + 80);
    fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId }),
    }).then(() => {
      fetchFavorites();
      checkLevelUp().then((newLevel) => { if (newLevel) setLevelUpName(newLevel); });
    });
  };

  const handleFavorite = async (promptId: number) => {
    if (!currentUserId) return;
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId, userId: currentUserId }),
    });
    const data = await res.json() as { favorited: boolean };
    if (!data.favorited) {
      // Removed → take out of list
      setPrompts((prev) => prev.filter((p) => p.id !== promptId));
      if (selectedPrompt?.id === promptId) setSelectedPrompt(null);
    }
    checkLevelUp().then((newLevel) => { if (newLevel) setLevelUpName(newLevel); });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!currentUserId && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-5xl mb-4">⭐</p>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Meine Favoriten</h1>
        <p className="text-slate-500 mb-6">Bitte wähle oben einen Benutzer aus, um deine Favoriten zu sehen.</p>
        <Link href="/library"
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
          Zur Bibliothek →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <FloatingPoints />
      {levelUpName && <LevelUpModal newLevel={levelUpName} onClose={() => setLevelUpName(null)} />}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">⭐ Meine Favoriten</h1>
          <p className="text-slate-500 mt-1">Deine persönliche Sammlung der wichtigsten Prompts.</p>
        </div>
        <Link href="/library"
          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
          Bibliothek → alle Prompts
        </Link>
      </div>

      {/* Search */}
      {!loading && prompts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="relative max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">🔍</span>
            <input type="text" placeholder="Favoriten durchsuchen…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-slate-50" />
          </div>
        </div>
      )}

      {/* Count */}
      {!loading && prompts.length > 0 && (
        <p className="text-xs text-slate-400 font-semibold mb-4 uppercase tracking-widest">
          {filtered.length} Favorit{filtered.length !== 1 ? 'en' : ''}
          {search && ` von ${prompts.length}`}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-52 animate-pulse" />
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
          <p className="text-5xl mb-4">⭐</p>
          <p className="text-slate-600 font-bold text-lg">Noch keine Favoriten</p>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            Öffne einen Prompt in der Bibliothek und klicke auf <strong>☆ Merken</strong>.
          </p>
          <Link href="/library"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
            Zur Bibliothek →
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-slate-600 font-semibold">Kein Favorit gefunden</p>
          <button onClick={() => setSearch('')} className="mt-3 text-sm text-emerald-600 underline">
            Filter zurücksetzen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((prompt) => (
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
