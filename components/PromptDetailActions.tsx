'use client';

/**
 * Interactive footer for the SEO-indexable prompt detail page
 * (app/(user)/library/[id]/page.tsx). Mirrors PromptModal's vote/favorite/
 * usage actions, but stands alone since the detail page is a Server
 * Component and these actions need client-side state + API calls.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  promptId: number;
  loggedIn: boolean;
  initialUserVote: number | null;
  initialUserFavorite: boolean;
  initialUsageCount: number;
  content: string;
}

export default function PromptDetailActions({
  promptId, loggedIn, initialUserVote, initialUserFavorite, initialUsageCount, content,
}: Props) {
  const router = useRouter();
  const [userVote, setUserVote]     = useState(initialUserVote ?? 0);
  const [isFav, setIsFav]           = useState(initialUserFavorite);
  const [usedDone, setUsedDone]     = useState(false);
  const [usageCount, setUsageCount] = useState(initialUsageCount);
  const [copied, setCopied]         = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isVoting, setIsVoting]     = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVote = async (value: number) => {
    if (!loggedIn || isVoting) return;
    const prev = userVote;
    setIsVoting(true);
    setUserVote(value);
    try {
      await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, value }),
      });
      router.refresh();
    } catch {
      setUserVote(prev);
    } finally {
      setIsVoting(false);
    }
  };

  const handleFavorite = async () => {
    if (!loggedIn) return;
    const prev = isFav;
    setIsFav(!prev);
    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId }),
      });
      router.refresh();
    } catch {
      setIsFav(prev);
    }
  };

  const handleUsed = async () => {
    if (!loggedIn || usedDone) return;
    setUsedDone(true);
    setUsageCount((c) => c + 1);
    try {
      await fetch('/api/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId }),
      });
    } catch {
      setUsedDone(false);
      setUsageCount((c) => c - 1);
    }
  };

  return (
    <div className="space-y-4">
      {loggedIn && (
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 rounded-xl px-3 sm:px-4 py-2.5">
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
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              +3 Pts
            </span>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={handleFavorite} disabled={!loggedIn}
          title={loggedIn ? (isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen') : 'Bitte anmelden'}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
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
        <button onClick={handleUsed} disabled={!loggedIn || usedDone}
          title={loggedIn ? undefined : 'Bitte anmelden'}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            usedDone
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'text-white hover:opacity-90 active:scale-95'
          }`}
          style={!usedDone ? { background: 'linear-gradient(135deg, #059669, #0891b2)' } : {}}>
          {usedDone ? '✓ Danke! +5 Pts für Autor' : "🚀 Ich hab's genutzt"}
        </button>
      </div>

      <p className="text-xs text-slate-400 text-center">{usageCount}× genutzt</p>
    </div>
  );
}
