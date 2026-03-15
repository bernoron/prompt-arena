/**
 * Application-wide constants for PromptArena.
 *
 * Centralising all magic values here makes the codebase easier to maintain:
 * add a new category or department in one place and the whole app picks it up.
 */

// ─── Auth / Storage ──────────────────────────────────────────────────────────

/** Key used in localStorage to persist the active user ID. */
export const USER_ID_KEY = 'promptarena_user_id';

// ─── Users ───────────────────────────────────────────────────────────────────

/**
 * Palette of avatar background colours assigned round-robin when a new user
 * registers (index = user count modulo palette length).
 */
export const AVATAR_COLORS = [
  '#1D9E75', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
] as const;

/**
 * Departments shown in the self-registration dropdown.
 * "__other__" is a special sentinel rendered as a free-text input.
 */
export const DEPARTMENTS = [
  'Schaden', 'Vertrieb', 'IT', 'HR', 'Finanzen', 'Recht', 'Marketing', 'Aktuariat',
] as const;

// ─── Prompts ─────────────────────────────────────────────────────────────────

/**
 * Visual configuration for each prompt category.
 *
 * Each entry contains:
 * - `icon`         – emoji shown in badges and filter buttons
 * - `bg`           – Tailwind background class for the badge
 * - `text`         – Tailwind text-colour class
 * - `border`       – Tailwind border class
 * - `accentBorder` – top-border colour used on PromptCards
 */
export const CATEGORY_CONFIG = {
  Writing:  { icon: '✍️', bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   accentBorder: 'border-t-teal-400'   },
  Email:    { icon: '📧', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', accentBorder: 'border-t-indigo-400' },
  Analysis: { icon: '📊', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', accentBorder: 'border-t-orange-400' },
  Excel:    { icon: '📈', bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  accentBorder: 'border-t-green-400'  },
} as const;

// ─── Rarity ──────────────────────────────────────────────────────────────────

/** Prompt rarity tiers based on usage count. */
export type Rarity = 'legendary' | 'epic' | 'rare' | 'common';

/**
 * Returns the rarity tier for a given usage count.
 * Thresholds: LEGENDARY ≥60 | EPIC ≥30 | RARE ≥10 | COMMON <10
 */
export function getRarity(usageCount: number): Rarity {
  if (usageCount >= 60) return 'legendary';
  if (usageCount >= 30) return 'epic';
  if (usageCount >= 10) return 'rare';
  return 'common';
}

/**
 * Visual configuration per rarity tier.
 * - `emoji`      – shown in the badge
 * - `label`      – text shown in the badge
 * - `ring`       – Tailwind ring classes for card glow
 * - `badgeClass` – Tailwind classes for the rarity pill
 */
export const RARITY_CONFIG: Record<Rarity, {
  emoji: string;
  label: string;
  ring: string;
  badgeClass: string;
}> = {
  legendary: {
    emoji: '🔥',
    label: 'Legendary',
    ring: 'ring-2 ring-amber-400',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-300',
  },
  epic: {
    emoji: '⚡',
    label: 'Epic',
    ring: 'ring-2 ring-purple-400',
    badgeClass: 'bg-purple-50 text-purple-700 border border-purple-300',
  },
  rare: {
    emoji: '💎',
    label: 'Rare',
    ring: 'ring-2 ring-blue-400',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-300',
  },
  common: {
    emoji: '',
    label: '',
    ring: '',
    badgeClass: '',
  },
};

// ─── Gamification ─────────────────────────────────────────────────────────────

/**
 * Visual configuration for each player level.
 *
 * Each entry contains:
 * - `icon`   – emoji displayed in badges and the profile hero
 * - `bg`     – Tailwind background class
 * - `text`   – Tailwind text-colour class
 * - `border` – Tailwind border class
 */
export const LEVEL_CONFIG = {
  'Prompt-Lehrling':   { icon: '📚', bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200'   },
  'Prompt-Handwerker': { icon: '🔨', bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'    },
  'Prompt-Schmied':    { icon: '⚒️', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
  'KI-Botschafter':    { icon: '🏅', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
} as const;

/**
 * Human-readable points guide shown in the Dashboard sidebar.
 * Mirrors the numeric values in lib/points.ts – keep in sync when changing point rewards.
 */
export const POINTS_GUIDE = [
  { icon: '📝', action: 'Prompt einreichen',   pts: '+20'  },
  { icon: '🚀', action: 'Prompt genutzt',       pts: '+5'   },
  { icon: '⭐', action: 'Bewertung abgeben',    pts: '+3'   },
  { icon: '🏆', action: 'Challenge einreichen', pts: '+30'  },
  { icon: '🥇', action: 'Challenge gewinnen',   pts: '+100' },
] as const;
