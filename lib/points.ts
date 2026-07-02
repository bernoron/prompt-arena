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
  FAVORITE_PROMPT:  10,
  CHALLENGE_SUBMIT: 30,
  CHALLENGE_WIN:   100,
  COMPLETE_LESSON:  15,
} as const;

// ─── Level Thresholds ────────────────────────────────────────────────────────

/**
 * Minimum points required to reach each level, ascending order.
 * Single source of truth for both getLevel() and getLevelProgress() —
 * band widths for the progress bar are derived from the gaps between
 * consecutive entries instead of being duplicated as literals.
 */
const LEVELS: { min: number; level: LevelName }[] = [
  { min:   0, level: 'Prompt-Lehrling'   },
  { min: 100, level: 'Prompt-Handwerker' },
  { min: 300, level: 'Prompt-Schmied'    },
  { min: 600, level: 'KI-Botschafter'    },
];

/** Index of the highest level whose threshold `points` has reached. */
function currentLevelIndex(points: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) return i;
  }
  return 0;
}

/**
 * Returns the level name for a given total-points value.
 * Used by API routes after every point-awarding action.
 */
// @spec AC-04-002
export function getLevel(points: number): LevelName {
  return LEVELS[currentLevelIndex(points)].level;
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
 * Band width and next-level name are derived from LEVELS so a threshold
 * change in one place can never desync getLevel() and getLevelProgress().
 *
 * @param points - The user's total accumulated points.
 */
// @spec AC-04-003
export function getLevelProgress(points: number): LevelProgress {
  const idx     = currentLevelIndex(points);
  const current = LEVELS[idx];
  const next    = LEVELS[idx + 1] ?? null;

  const currentInBand = points - current.min;
  const bandWidth      = next ? next.min - current.min : 0;
  const percentage     = bandWidth > 0 ? Math.round((currentInBand / bandWidth) * 100) : 100;

  return {
    level:      current.level,
    current:    currentInBand,
    max:        bandWidth,
    percentage,
    nextLevel:  next?.level ?? null,
  };
}

