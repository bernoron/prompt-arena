'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PromptCard from '@/components/PromptCard';
import CategoryBadge from '@/components/CategoryBadge';
import DifficultyBadge from '@/components/DifficultyBadge';
import FloatingPoints, { triggerFloat } from '@/components/FloatingPoints';
import LevelUpModal from '@/components/LevelUpModal';
import type { PromptWithDetails, Category } from '@/lib/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLevelUp } from '@/hooks/useLevelUp';

// ─── Prompt Modal (same as library, reused inline) ────────────────────────────

function PromptModal({
  prompt, currentUserId, onClose, onVote, onUsed, onFavorite,
}: {
  prompt: PromptWithDetails;
  currentUserId: number | null;
  onClose: () => void;
  onVote: (promptId: number, value: number) => Promise<void>;
  onUsed: (promptId: number) => Promise<void>;
  onFavorite: (promptId: number) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<'de' | 'en'>('de');
  const [copied, setCopied] = useState(false);
  const [usedDone, setUsedDone] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [userVote, setUserVote] = useState(prompt.userVote ?? 0);
  const [isVoting, setIsVoting] = useState(false);
  const [isFav, setIsFav] = useState(prompt.userFavorite ?? true); // always true on favorites page

  const hasSeparateEn = prompt.titleEn !== prompt.title || prompt.contentEn !== prompt.content;
  const text = activeTab === 'de' ? prompt.content : prompt.contentEn;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUsed = async () => {
    if (usedDone) return;
    await onUsed(prompt.id);
    setUsedDone(true);
  };

  const handleVote = async (value: number) => {
    if (!currentUserId || isVoting) return;
    setIsVoting(true);
    setUserVote(value);
    await onVote(prompt.id, value);
    setIsVoting(false);
  };

  const handleFavorite = async () => {
    if (!currentUserId) return;
    setIsFav((prev) => !prev);
    await onFavorite(prompt.id);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <CategoryBadge category={prompt.category as Category} />
              <DifficultyBadge difficulty={prompt.difficulty} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{prompt.title}</h2>
            {hasSeparateEn && <p className="text-sm text-slate-400 mt-0.5">{prompt.titleEn}</p>}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors text-lg font-bold leading-none">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {hasSeparateEn && (
            <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1 w-fit">
              {(['de', 'en'] as const).map((lang) => (
                <button key={lang} onClick={() => setActiveTab(lang)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === lang
                      ? 'bg-white shadow-sm text-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {lang === 'de' ? '🇩🇪 Deutsch' : '🇬🇧 English'}
                </button>
              ))}
            </div>
          )}
          <pre className="bg-slate-50 rounded-xl p-5 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed border border-slate-200">
            {text}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: prompt.author.avatarColor }}>
                {prompt.author.name.split(' ').map((n) => n[0]).join('')}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800">{prompt.author.name}</p>
                <p className="text-xs text-slate-400">{prompt.author.department}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-600">{prompt.usageCount}× genutzt</p>
              <p className="text-xs text-slate-400">{prompt.voteCount} Bewertungen</p>
            </div>
          </div>

          {currentUserId && (
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
              <span className="text-sm text-slate-500 font-medium">Bewerten:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} disabled={isVoting}
                    onMouseEnter={() => setHoveredStar(s)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => handleVote(s)}
                    className={`text-2xl transition-all hover:scale-125 disabled:cursor-not-allowed ${
                      s <= (hoveredStar || userVote) ? 'text-amber-400' : 'text-slate-200'
                    }`}>
                    ★
                  </button>
                ))}
              </div>
              {userVote > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">+3 Pts</span>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleFavorite} disabled={!currentUserId}
              title={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
              className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                isFav
                  ? 'bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-amber-500'
              } disabled:opacity-40 disabled:cursor-not-allowed`}>
              {isFav ? '★ Favorit' : '☆ Merken'}
            </button>
            <button onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                copied
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}>
              {copied ? '✓ Kopiert!' : '📋 Kopieren'}
            </button>
            <button onClick={handleUsed} disabled={usedDone}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                usedDone
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-white hover:opacity-90 active:scale-95'
              }`}
              style={!usedDone ? { background: 'linear-gradient(135deg, #059669, #0891b2)' } : {}}>
              {usedDone ? '✓ Danke! +5 Pts für Autor' : "🚀 Ich hab's genutzt"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
