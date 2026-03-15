'use client';

import type { PromptWithDetails, Category } from '@/lib/types';
import { CATEGORY_CONFIG, getRarity, RARITY_CONFIG } from '@/lib/constants';
import CategoryBadge from './CategoryBadge';
import DifficultyBadge from './DifficultyBadge';

interface Props {
  prompt: PromptWithDetails;
  onClick?: () => void;
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-sm ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
      ))}
      {count > 0 && <span className="text-xs text-slate-400 ml-1">{rating.toFixed(1)}</span>}
    </div>
  );
}

export default function PromptCard({ prompt, onClick }: Props) {
  const accent = (CATEGORY_CONFIG[prompt.category as Category] as { accentBorder?: string })?.accentBorder ?? 'border-t-slate-300';
  const rarity = getRarity(prompt.usageCount);
  const rarityConf = RARITY_CONFIG[rarity];

  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200 border-t-4 ${accent} shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 p-5 text-left w-full group relative ${rarityConf.ring}`}
    >
      {/* Rarity badge (pinned top-right, only for non-common) */}
      {rarity !== 'common' && (
        <span className={`absolute -top-3 right-3 text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm ${rarityConf.badgeClass}`}>
          {rarityConf.emoji} {rarityConf.label}
        </span>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          <CategoryBadge category={prompt.category as Category} size="sm" />
          <DifficultyBadge difficulty={prompt.difficulty} />
        </div>
        <span className={`text-xs whitespace-nowrap font-bold ${
          rarity === 'legendary' ? 'text-amber-500'
          : rarity === 'epic'    ? 'text-purple-500'
          : rarity === 'rare'    ? 'text-blue-500'
          : 'text-slate-400'
        }`}>{prompt.usageCount}×</span>
      </div>

      {/* Titles */}
      <h3 className="font-bold text-slate-900 mb-0.5 group-hover:text-emerald-700 transition-colors leading-snug">
        {prompt.title}
      </h3>
      {prompt.titleEn !== prompt.title && (
        <p className="text-xs text-slate-400 mb-3">{prompt.titleEn}</p>
      )}

      {/* Preview */}
      <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed font-mono text-xs bg-slate-50 rounded-lg px-3 py-2 mt-2">
        {prompt.content}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
            style={{ backgroundColor: prompt.author.avatarColor }}
          >
            {prompt.author.name.split(' ').map((n) => n[0]).join('')}
          </span>
          <span className="text-xs text-slate-500 font-medium">{prompt.author.name.split(' ')[0]}</span>
        </div>
        <StarRating rating={prompt.avgRating} count={prompt.voteCount} />
      </div>
    </button>
  );
}
