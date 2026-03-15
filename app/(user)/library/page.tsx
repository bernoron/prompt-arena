'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PromptCard from '@/components/PromptCard';
import CategoryBadge from '@/components/CategoryBadge';
import DifficultyBadge from '@/components/DifficultyBadge';
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

function PromptModal({
  prompt, currentUserId, onClose, onVote, onUsed,
}: {
  prompt: PromptWithDetails;
  currentUserId: number | null;
  onClose: () => void;
  onVote: (promptId: number, value: number) => Promise<void>;
  onUsed: (promptId: number) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<'de' | 'en'>('de');
  const [copied, setCopied] = useState(false);
  const [usedDone, setUsedDone] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [userVote, setUserVote] = useState(prompt.userVote ?? 0);
  const [isVoting, setIsVoting] = useState(false);

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
    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId, userId: currentUserId, value }),
    });
    // Floating XP label – centred on screen where modal lives
    triggerFloat('+3 Pts', window.innerWidth / 2 - 28, window.innerHeight / 2 + 60);
    await fetchPrompts();
    const newLevel = await checkLevelUp();
    if (newLevel) setLevelUpName(newLevel);
  };

  const handleUsed = async (promptId: number) => {
    await fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId }),
    });
    // Floating XP label – centred on screen where modal lives
    triggerFloat('+5 Pts', window.innerWidth / 2 - 28, window.innerHeight / 2 + 80);
    await fetchPrompts();
    const newLevel = await checkLevelUp();
    if (newLevel) setLevelUpName(newLevel);
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
