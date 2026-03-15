/**
 * Gamification logic for PromptArena.
 *
 * All point values and level thresholds are defined here so they can be
 * imported by both API routes (server) and UI components (client).
 *
 * When changing a point value, update POINTS_GUIDE in lib/constants.ts too.
 */

import type { LevelName } from './types';

// ─── Point Values ─────────────────────────────────────────────────────────────

/**
 * Points awarded for each user action.
 * Use these constants in API routes; never hard-code raw numbers.
 */
export const POINTS = {
  SUBMIT_PROMPT:    20,
  PROMPT_USED:       5,
  VOTE_ON_PROMPT:    3,
  CHALLENGE_SUBMIT: 30,
  CHALLENGE_WIN:   100,
} as const;

// ─── Level Thresholds ────────────────────────────────────────────────────────

/** Minimum points required to reach each level. */
const THRESHOLDS: { min: number; level: LevelName }[] = [
  { min: 600, level: 'KI-Botschafter'    },
  { min: 300, level: 'Prompt-Schmied'    },
  { min: 100, level: 'Prompt-Handwerker' },
  { min:   0, level: 'Prompt-Lehrling'   },
];

/**
 * Returns the level name for a given total-points value.
 * Used by API routes after every point-awarding action.
 */
export function getLevel(points: number): LevelName {
  return THRESHOLDS.find((t) => points >= t.min)!.level;
}

// ─── Progress Calculation ────────────────────────────────────────────────────

export interface LevelProgress {
  level: LevelName;
  /** Points earned within the current level band. */
  current: number;
  /** Total points needed to complete the current band (0 at max level). */
  max: number;
  /** Completion percentage (0–100) for the progress bar. */
  percentage: number;
  /** Next level name, or null when already at max level. */
  nextLevel: LevelName | null;
}

/**
 * Calculates how far a user has progressed within their current level band.
 * Used by the Dashboard and Profile progress bars.
 *
 * @param points - The user's total accumulated points.
 */
export function getLevelProgress(points: number): LevelProgress {
  if (points >= 600) {
    return { level: 'KI-Botschafter', current: points - 600, max: 0, percentage: 100, nextLevel: null };
  }
  if (points >= 300) {
    return { level: 'Prompt-Schmied',    current: points - 300, max: 300, percentage: Math.round(((points - 300) / 300) * 100), nextLevel: 'KI-Botschafter'    };
  }
  if (points >= 100) {
    return { level: 'Prompt-Handwerker', current: points - 100, max: 200, percentage: Math.round(((points - 100) / 200) * 100), nextLevel: 'Prompt-Schmied'    };
  }
  return   { level: 'Prompt-Lehrling',   current: points,       max: 100, percentage: Math.round((points / 100) * 100),         nextLevel: 'Prompt-Handwerker' };
}

// ─── Legacy export ────────────────────────────────────────────────────────────
// Kept for backward compat with components that still import LEVEL_COLORS.
// New code should use LEVEL_CONFIG from lib/constants.ts instead.
export const LEVEL_COLORS: Record<LevelName, string> = {
  'Prompt-Lehrling':   'bg-slate-100  text-slate-600',
  'Prompt-Handwerker': 'bg-blue-50    text-blue-700',
  'Prompt-Schmied':    'bg-amber-50   text-amber-700',
  'KI-Botschafter':    'bg-emerald-50 text-emerald-700',
};
