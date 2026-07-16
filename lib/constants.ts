/**
 * Application-wide constants for PromptArena.
 *
 * Centralising all magic values here makes the codebase easier to maintain:
 * add a new category in one place and the whole app picks it up.
 */

// ─── Users ───────────────────────────────────────────────────────────────────

/**
 * Palette of avatar background colours assigned round-robin when a new user
 * registers (index = user count modulo palette length).
 */
// @spec AC-01-006
export const AVATAR_COLORS = [
  '#1D9E75', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
] as const;

// ─── Prompts ─────────────────────────────────────────────────────────────────

/**
 * Tailwind class set for one category colour. Icon and label come from the
 * `PromptCategory` DB row (lib/services/category-service.ts) — this map only
 * covers the styling, keyed by `PromptCategory.color`.
 *
 * CR-004: categories are no longer a hardcoded 4-entry list, so this replaced
 * the old `CATEGORY_CONFIG` (which was keyed by category name and couldn't
 * cover categories created at runtime).
 */
export interface CategoryColorClasses {
  bg: string;
  text: string;
  border: string;
  accentBorder: string;
}

// @spec AC-02-014
export const CATEGORY_COLOR_CLASSES: Record<string, CategoryColorClasses> = {
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   accentBorder: 'border-t-teal-400'   },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', accentBorder: 'border-t-indigo-400' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', accentBorder: 'border-t-orange-400' },
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  accentBorder: 'border-t-green-400'  },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', accentBorder: 'border-t-purple-400' },
  pink:   { bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200',   accentBorder: 'border-t-pink-400'   },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  accentBorder: 'border-t-amber-400'  },
  cyan:   { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200',   accentBorder: 'border-t-cyan-400'   },
};

/** Used when a category's colour isn't in {@link CATEGORY_COLOR_CLASSES} (defensive fallback only). */
// @spec AC-02-014
export const CATEGORY_FALLBACK_COLOR_CLASSES: CategoryColorClasses = {
  bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', accentBorder: 'border-t-slate-300',
};

/**
 * Defaults applied when a user creates a category on the fly (CR-004,
 * AC-02-013) — regular users only supply a label, not icon/colour.
 */
// @spec AC-02-013
export const CATEGORY_DEFAULT_ICON = '🏷️';

/** Tailwind colour names cycled round-robin by display order for user-created categories. */
// @spec AC-02-013
export const CATEGORY_COLOR_PALETTE = [
  'teal', 'indigo', 'orange', 'green', 'purple', 'pink', 'amber', 'cyan',
] as const;

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
  { icon: '📝', action: 'Prompt einreichen',      pts: '+20'  },
  { icon: '🚀', action: 'Prompt genutzt',          pts: '+5'   },
  { icon: '⭐', action: 'Bewertung abgeben',       pts: '+3'   },
  { icon: '🔖', action: 'Prompt favorisiert',      pts: '+10'  },
  { icon: '🏆', action: 'Challenge einreichen',    pts: '+30'  },
  { icon: '🥇', action: 'Challenge gewinnen',      pts: '+100' },
  { icon: '🧠', action: 'Lektion abschliessen',   pts: '+15'  },
] as const;

// ─── Onboarding ────────────────────────────────────────────────────────────

/**
 * Steps shown by the first-login onboarding funnel (OnboardingFunnel).
 * Each step is a short card explaining one core capability of the platform.
 */
// @spec AC-14-004
export const ONBOARDING_STEPS = [
  {
    icon: '👋',
    title: 'Willkommen bei PromptArena!',
    body: 'In wenigen Schritten zeigen wir dir, was du hier alles machen kannst.',
  },
  {
    icon: '📚',
    title: 'Prompt-Bibliothek durchsuchen',
    body: 'Finde bewährte KI-Prompts von anderen Nutzer:innen, filtere nach Kategorie und Schwierigkeit — und markiere sie als „benutzt", sobald sie dir geholfen haben.',
  },
  {
    icon: '✍️',
    title: 'Eigene Prompts einreichen',
    body: 'Teile deine eigenen Prompts mit der Community und sammle dafür Punkte.',
  },
  {
    icon: '🏆',
    title: 'Punkte, Level & Rangliste',
    body: 'Für Einreichen, Benutzen und Bewerten von Prompts gibt es Punkte. Steige im Level auf und vergleiche dich mit anderen in der Rangliste.',
  },
  {
    icon: '🧠',
    title: 'Lernpfad',
    body: 'Kurze, praxisnahe Lektionen bringen dir Schritt für Schritt bei, wie du KI-Prompts noch wirkungsvoller einsetzt.',
  },
  {
    icon: '🎯',
    title: 'Challenges',
    body: 'Nimm an wöchentlichen Challenges teil und sammle Bonus-Punkte für die besten Einreichungen.',
  },
] as const;

/**
 * Curated, German feature announcements for the public landing page's
 * "Neuigkeiten" section — only genuinely user-visible features, written as a
 * short product announcement, never a commit message. Add a new entry here
 * (newest first, max 10 shown) when shipping something users will notice.
 */
// @spec AC-13-008
export const RECENT_FEATURES = [
  {
    date: '2026-07-16',
    icon: '🏷️',
    title: 'Eigene Kategorien erstellen',
    description: 'Beim Einreichen eines Prompts kannst du jetzt direkt eine neue Kategorie anlegen, statt dich auf die bestehende Liste zu beschränken.',
  },
  {
    date: '2026-07-15',
    icon: '🧠',
    title: 'Neues Lernmodul: Das passende KI-Modell wählen',
    description: 'Eine neue Lektion im Lernpfad hilft dir, für jede Aufgabe das richtige Modell auszuwählen.',
  },
  {
    date: '2026-07-09',
    icon: '🔑',
    title: 'Passwort per E-Mail zurücksetzen',
    description: 'Passwort vergessen? Über „Passwort vergessen" bekommst du jetzt einen Reset-Link per E-Mail.',
  },
  {
    date: '2026-07-09',
    icon: '🗑️',
    title: 'Konto selbst löschen',
    description: 'Du kannst dein Konto jetzt jederzeit selbst löschen, direkt im Profil.',
  },
  {
    date: '2026-07-07',
    icon: '👋',
    title: 'Einführungs-Tour für neue Mitglieder',
    description: 'Neue Mitglieder werden beim ersten Login kurz durch die wichtigsten Funktionen geführt.',
  },
  {
    date: '2026-07-06',
    icon: '🏠',
    title: 'Neue öffentliche Startseite',
    description: 'Auch ohne Login siehst du jetzt, was PromptArena kann – inklusive einer anonymisierten Auswahl beliebter Prompts.',
  },
  {
    date: '2026-06-28',
    icon: '💬',
    title: 'Feedback direkt in der App',
    description: 'Über den Feedback-Button kannst du jederzeit Bugs melden, Ideen einreichen oder Lob loswerden.',
  },
  {
    date: '2026-06-28',
    icon: '✉️',
    title: 'Anmeldung per E-Mail',
    description: 'Login läuft jetzt über deine E-Mail-Adresse statt über einen Benutzernamen.',
  },
  {
    date: '2026-04-18',
    icon: '📖',
    title: 'Lernpfad: KI-Prompting von Grund auf lernen',
    description: 'Kurze, praxisnahe Lektionen bringen dir Schritt für Schritt bei, wie du KI-Prompts wirkungsvoll einsetzt.',
  },
] as const;
