/**
 * Shared rating aggregation for prompts.
 *
 * Every route that returns a list of prompts (library, favorites, trending)
 * needs the same avgRating/voteCount pair per prompt. This was previously
 * implemented three times with `prisma.vote.groupBy` + a Map — extracted
 * here so there is exactly one place that knows how a rating is computed.
 */

import { prisma } from '@/lib/prisma';

export interface Rating {
  avgRating: number;
  voteCount: number;
}

const EMPTY_RATING: Rating = { avgRating: 0, voteCount: 0 };

/**
 * Fetches avgRating (rounded to 1 decimal) and voteCount for a set of
 * prompt IDs in a single aggregate query. Never loads individual vote rows.
 */
export async function getRatingsMap(promptIds: number[]): Promise<Map<number, Rating>> {
  if (promptIds.length === 0) return new Map();

  const rows = await prisma.vote.groupBy({
    by: ['promptId'],
    where: { promptId: { in: promptIds } },
    _avg: { value: true },
    _count: { value: true },
  });

  return new Map(
    rows.map((row) => [
      row.promptId,
      {
        avgRating: row._avg.value ? Math.round(row._avg.value * 10) / 10 : 0,
        voteCount: row._count.value,
      },
    ]),
  );
}

/** Looks up a single prompt's rating from a pre-fetched map, defaulting to zero. */
export function getRating(ratings: Map<number, Rating>, promptId: number): Rating {
  return ratings.get(promptId) ?? EMPTY_RATING;
}
