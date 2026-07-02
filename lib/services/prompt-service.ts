/**
 * Prompt business logic, shared between the list/create API routes and (in
 * future) any Server Component that wants to read prompts directly without
 * a self-HTTP round trip.
 *
 * Routes stay thin: rate-limit → auth → Zod → call into this file → respond.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { awardPoints } from '@/lib/db-helpers';
import { POINTS } from '@/lib/points';
import { getRatingsMap, getRating } from './rating-service';

const AUTHOR_SELECT = { id: true, name: true, avatarColor: true } as const;

// ─── Personalisation helpers ──────────────────────────────────────────────────

/** The signed-in user's own vote value per prompt, or an empty map when logged out. */
export async function getUserVoteMap(
  userId: number | null,
  promptIds: number[],
): Promise<Map<number, number>> {
  if (!userId || promptIds.length === 0) return new Map();
  const votes = await prisma.vote.findMany({
    where: { userId, promptId: { in: promptIds } },
    select: { promptId: true, value: true },
  });
  return new Map(votes.map((v) => [v.promptId, v.value]));
}

/** The signed-in user's active favorites among the given prompts, or empty when logged out. */
export async function getUserFavoriteSet(
  userId: number | null,
  promptIds: number[],
): Promise<Set<number>> {
  if (!userId || promptIds.length === 0) return new Set();
  const favorites = await prisma.favorite.findMany({
    where: { userId, isActive: true, promptId: { in: promptIds } },
    select: { promptId: true },
  });
  return new Set(favorites.map((f) => f.promptId));
}

// ─── List (GET /api/prompts) ───────────────────────────────────────────────────

export interface ListPromptsParams {
  category?: string | null;
  search?: string;
  sortBy: 'newest' | 'most-used';
  cursor?: number;
  take: number;
  /** Signed-in user, used only for personalisation (userVote/userFavorite). */
  resolvedUserId: number | null;
}

export interface ListPromptsResult {
  items: Array<Record<string, unknown>>;
  nextCursor: number | null;
  hasNextPage: boolean;
}

export async function listPrompts(params: ListPromptsParams): Promise<ListPromptsResult> {
  const { category, search, sortBy, cursor, take, resolvedUserId } = params;

  const prompts = await prisma.prompt.findMany({
    where: {
      ...(category && category !== 'all' ? { category } : {}),
      ...(search ? {
        OR: [
          { title:   { contains: search } },
          { titleEn: { contains: search } },
          { content: { contains: search } },
        ],
      } : {}),
    },
    include: { author: { select: AUTHOR_SELECT } },
    orderBy: sortBy === 'most-used'
      ? [{ usageCount: 'desc' }, { id: 'desc' }]
      : [{ createdAt: 'desc' }, { id: 'desc' }],
    take: take + 1, // fetch one extra to determine if there's a next page
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasNextPage = prompts.length > take;
  const page = hasNextPage ? prompts.slice(0, take) : prompts;
  const nextCursor = hasNextPage ? (page[page.length - 1]?.id ?? null) : null;
  const promptIds = page.map((p) => p.id);

  const [ratings, userVoteMap, favSet] = await Promise.all([
    getRatingsMap(promptIds),
    getUserVoteMap(resolvedUserId, promptIds),
    getUserFavoriteSet(resolvedUserId, promptIds),
  ]);

  const items = page.map((p) => {
    const rating = getRating(ratings, p.id);
    return {
      ...p,
      avgRating:    rating.avgRating,
      voteCount:    rating.voteCount,
      userVote:     resolvedUserId ? (userVoteMap.get(p.id) ?? null) : null,
      userFavorite: resolvedUserId ? favSet.has(p.id) : undefined,
      createdAt:    p.createdAt.toISOString(),
    };
  });

  return { items, nextCursor, hasNextPage };
}

// ─── Create (POST /api/prompts) ────────────────────────────────────────────────

export interface CreatePromptParams {
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  category: string;
  difficulty: string;
  authorId: number;
  challengeId?: number;
}

export type CreatePromptResult =
  | { ok: true; prompt: Prisma.PromptGetPayload<{ include: { author: { select: typeof AUTHOR_SELECT } } }> }
  | { ok: false; status: number; error: string };

export async function createPrompt(params: CreatePromptParams): Promise<CreatePromptResult> {
  const { title, titleEn, content, contentEn, category, difficulty, authorId, challengeId } = params;

  if (challengeId !== undefined) {
    const challenge = await prisma.weeklyChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) return { ok: false, status: 404, error: 'Challenge not found' };
    if (!challenge.isActive) return { ok: false, status: 400, error: 'Challenge is no longer active' };
  }

  const categoryExists = await prisma.promptCategory.findUnique({
    where: { slug: category },
    select: { id: true },
  });
  if (!categoryExists) return { ok: false, status: 400, error: 'Category not found' };

  const prompt = await prisma.prompt.create({
    data: { title, titleEn: titleEn ?? title, content, contentEn: contentEn ?? content, category, difficulty, authorId },
    include: { author: { select: AUTHOR_SELECT } },
  });

  await awardPoints(authorId, POINTS.SUBMIT_PROMPT);

  if (challengeId !== undefined) {
    await prisma.challengeSubmission.create({
      data: { challengeId, promptId: prompt.id, userId: authorId },
    });
    await awardPoints(authorId, POINTS.CHALLENGE_SUBMIT);
  }

  return { ok: true, prompt };
}

// ─── Trending (GET /api/prompts/trending) ─────────────────────────────────────

async function fetchTop(orderBy: Prisma.PromptOrderByWithRelationInput[]) {
  return prisma.prompt.findMany({
    take: 5,
    orderBy,
    include: { author: { select: AUTHOR_SELECT } },
  });
}

export async function getTrendingPrompts() {
  const [hot, newest] = await Promise.all([
    fetchTop([{ usageCount: 'desc' }, { id: 'desc' }]),
    fetchTop([{ createdAt: 'desc' }, { id: 'desc' }]),
  ]);

  const ratings = await getRatingsMap(Array.from(new Set([...hot, ...newest].map((p) => p.id))));
  const enrich = (list: typeof hot) => list.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    ...getRating(ratings, p.id),
  }));

  // Merge both lists, deduplicating by id, hot first
  const seen = new Set<number>();
  return [...enrich(hot), ...enrich(newest)].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}
