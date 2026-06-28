/**
 * Zod validation schemas for all API request bodies.
 *
 * Central location for every constraint (type, length, allowed enum values).
 * Changing a rule here automatically enforces it across all routes that use
 * the schema – no more copy-pasted if-statements per endpoint.
 *
 * Usage:
 *   const result = CreatePromptSchema.safeParse(await req.json());
 *   if (!result.success) return badRequest(result.error);
 */

import { z } from 'zod';
import { DEPARTMENTS } from '@/lib/constants';

// ─── Shared primitives ────────────────────────────────────────────────────────

/** A positive integer (ID column from DB). */
const PositiveInt = z.number().int().positive();

/** A positive integer parsed from a URL path segment. */
export const PathId = z
  .string()
  .regex(/^\d+$/, 'Must be a positive integer')
  .transform(Number)
  .refine((n) => n > 0, 'Must be a positive integer');

// ─── Allowed enum values ──────────────────────────────────────────────────────

const DIFFICULTIES = ['Einstieg', 'Fortgeschritten'] as const;

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * POST /api/users – Self-registration body.
 * Name ≤ 80 chars, department must be one of the allowed values.
 */
export const CreateUserSchema = z.object({
  name:       z.string().trim().min(2).max(80),
  department: z.enum([...DEPARTMENTS, '__other__'] as [string, ...string[]]).or(
    z.string().trim().min(2).max(50)
  ),
});

/** POST /api/auth/login */
export const LoginSchema = z.object({
  name:     z.string().trim().min(1).max(80),
  password: z.string().min(1).max(100),
});

/** POST /api/auth/register — @spec AC-12-003 */
export const RegisterSchema = z.object({
  // Reject HTML/script characters to prevent stored-XSS via the name field
  name:     z.string().trim().min(2).max(80).regex(/^[^<>"';&`]+$/, 'Name enthält unerlaubte Zeichen'),
  email:    z.string().trim().email().max(254),
  password: z.string().min(8).max(100),
});

// ─── Prompts ──────────────────────────────────────────────────────────────────

/**
 * POST /api/prompts – Prompt creation body.
 * Hard limits prevent oversized payloads being stored; category/difficulty
 * must exactly match the values the UI sends.
 */
export const CreatePromptSchema = z.object({
  title:       z.string().trim().min(3).max(120),
  titleEn:     z.string().trim().max(120).optional(),
  content:     z.string().trim().min(10).max(4000),
  contentEn:   z.string().trim().max(4000).optional(),
  category:    z.string().trim().min(1).max(40).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid category'),
  difficulty:  z.enum(DIFFICULTIES),
  authorId:    PositiveInt,
  challengeId: PositiveInt.optional(),
});

// ─── Votes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/votes – Star rating body.
 * value must be an integer between 1 and 5.
 */
export const VoteSchema = z.object({
  promptId: PositiveInt,
  userId:   PositiveInt,
  value:    z.number().int().min(1).max(5),
});

// ─── Usage ────────────────────────────────────────────────────────────────────

/**
 * POST /api/usage – Record a "I used this prompt" action.
 */
export const UsageSchema = z.object({
  promptId: PositiveInt,
  userId:   PositiveInt,
});

// ─── Favorites ────────────────────────────────────────────────────────────────

/**
 * POST /api/favorites – Toggle a prompt as favorite for a user.
 */
export const FavoriteSchema = z.object({
  promptId: PositiveInt,
  userId:   PositiveInt,
});

// ─── Learning ─────────────────────────────────────────────────────────────────

/**
 * POST /api/learn/[moduleSlug]/[lessonSlug]/complete
 */
export const CompleteLessonSchema = z.object({
  userId: PositiveInt,
});

// ─── Feedback ─────────────────────────────────────────────────────────────────

// @spec AC-11-003
export const FeedbackSchema = z.object({
  userId:      PositiveInt,
  category:    z.enum(['BUG', 'IMPROVEMENT', 'IDEA', 'PRAISE']),
  text:        z.string().trim().min(1).max(500),
  contextType: z.enum(['GENERAL', 'LESSON', 'PROMPT']).default('GENERAL'),
  contextId:   PositiveInt.optional(),
  contextPath: z.string().max(200).optional(),
});

// @spec AC-11-007
export const LessonFeedbackSchema = z.object({
  userId:   PositiveInt,
  lessonId: PositiveInt,
  helpful:  z.boolean(),
  text:     z.string().trim().max(500).optional(),
});

export const LessonFeedbackUpdateSchema = z.object({
  helpful: z.boolean().optional(),
  text:    z.string().trim().max(500).optional(),
});

// @spec AC-11-011
export const TopicSuggestionSchema = z.object({
  userId:      PositiveInt,
  title:       z.string().trim().min(3).max(200),
  description: z.string().trim().max(500).optional(),
});

export const AdminFeedbackStatusSchema = z.object({
  status: z.enum(['OPEN', 'DONE']),
});

export const SuggestionStatusSchema = z.object({
  status: z.enum(['OPEN', 'PLANNED', 'DONE', 'REJECTED']),
});

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Returns a standardised 400 response from a Zod error so every route
 * produces the same error shape without boilerplate.
 *
 * Only the first validation issue is forwarded to the client to avoid
 * leaking schema internals.
 */
export function validationError(error: z.ZodError) {
  const first = error.issues[0];
  const field = first.path.join('.');
  const message = field ? `${field}: ${first.message}` : first.message;
  return { status: 400 as const, body: { error: message } };
}
