'use client';

import { useState, useEffect } from 'react';
import CategoryBadge from '@/components/CategoryBadge';
import DifficultyBadge from '@/components/DifficultyBadge';
import type { PromptWithDetails, Category } from '@/lib/types';

interface PromptModalProps {
  prompt: PromptWithDetails;
  currentUserId: number | null;
  onClose: () => void;
  onVote: (promptId: number, value: number) => Promise<void>;
  onUsed: (promptId: number) => Promise<void>;
  onFavorite: (promptId: number) => Promise<void>;
}

export default function PromptModal({
  prompt, currentUserId, onClose, onVote, onUsed, onFavorite,
}: PromptModalProps) {
  const [activeTab, setActiveTab] = useState<'de' | 'en'>('de');
  const [copied,     setCopied]    = useState(false);
  const [usedDone,   setUsedDone]  = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [userVote,   setUserVote]  = useState(prompt.userVote ?? 0);
  const [isVoting,   setIsVoting]  = useState(false);
  const [isFav,      setIsFav]     = useState(prompt.userFavorite ?? false);

  const hasSeparateEn = prompt.titleEn !== prompt.title || prompt.contentEn !== prompt.content;
  const text = activeTab === 'de' ? prompt.content : prompt.contentEn;

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

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

  const handleFavorite = async () => {
    if (!currentUserId) return;
    setIsFav((prev) => !prev);
    await onFavorite(prompt.id);
  };

  const handleVote = async (value: number) => {
    if (!currentUserId || isVoting) return;
    setIsVoting(true);
    setUserVote(value);
    await onVote(prompt.id, value);
    setIsVoting(false);
  };

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
          {/* Author + stats */}
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

          {/* Star rating */}
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
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  +3 Pts
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={handleFavorite} disabled={!currentUserId}
              title={currentUserId ? (isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen') : 'Bitte Benutzer auswählen'}
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
