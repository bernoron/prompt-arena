/**
 * Shared TypeScript types for PromptArena.
 *
 * Single source of truth for all domain types used across API routes,
 * pages, and components. Import from here – never define inline interfaces.
 */

// ─── Domain Enumerations ─────────────────────────────────────────────────────

/** The four prompt categories available in the application. */
export type Category = 'Writing' | 'Email' | 'Analysis' | 'Excel';

/** Prompt complexity levels selectable during submission. */
export type Difficulty = 'Einstieg' | 'Fortgeschritten';

/**
 * Gamification levels awarded based on total points.
 *   - Prompt-Lehrling    0 – 99 pts
 *   - Prompt-Handwerker  100 – 299 pts
 *   - Prompt-Schmied     300 – 599 pts
 *   - KI-Botschafter     600+ pts
 *
 * Thresholds are defined in lib/points.ts.
 */
export type LevelName =
  | 'Prompt-Lehrling'
  | 'Prompt-Handwerker'
  | 'Prompt-Schmied'
  | 'KI-Botschafter';

// ─── API Response Shapes ─────────────────────────────────────────────────────

/** A user as returned by GET /api/users (ordered by totalPoints desc). */
export interface UserWithStats {
  id: number;
  name: string;
  department: string;
  avatarColor: string;
  totalPoints: number;
  level: LevelName;
  createdAt: string; // ISO 8601
}

/**
 * A prompt as returned by GET /api/prompts.
 *
 * Extends the DB model with computed fields (avgRating, voteCount) and
 * the requesting user's own vote (userVote) for star-highlight in the UI.
 */
export interface PromptWithDetails {
  id: number;
  title: string;
  titleEn: string;    // Falls back to `title` when no translation was provided
  content: string;
  contentEn: string;  // Falls back to `content` when no translation was provided
  category: Category;
  difficulty: Difficulty;
  authorId: number;
  usageCount: number;
  createdAt: string;  // ISO 8601
  author: {
    id: number;
    name: string;
    avatarColor: string;
    department: string;
  };
  avgRating: number;           // 0–5, rounded to one decimal place
  voteCount: number;
  userVote?: number | null;    // Only present when a userId query param is sent
  userFavorite?: boolean;      // Only present when a userId query param is sent
}

// ─── Dashboard-specific types ────────────────────────────────────────────────

/** Minimal user shape used for rank-change comparisons in the dashboard. */
export interface RankedUser {
  id: number;
  name: string;
  pts: number;
  avatarColor: string;
}

/** Delta between the current leaderboard and the snapshot from the last visit. */
export interface RankDiff {
  delta:      number;       // negative = improved (moved up)
  overtookMe: RankedUser[]; // users who were below and are now above
  iOvertook:  RankedUser[]; // users who were above and are now below
}

/**
 * A weekly challenge as returned by GET /api/challenges.
 * The route returns an array; multiple challenges can be active at once.
 */
export interface WeeklyChallengeData {
  id: number;
  title: string;
  description: string;
  startDate: string;       // ISO 8601
  endDate: string;         // ISO 8601
  isActive: boolean;
  submissionCount: number; // Computed from related ChallengeSubmission rows
}
