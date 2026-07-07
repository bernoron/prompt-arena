/**
 * Category read logic, shared between GET /api/categories and the Server
 * Components (library, submit) that need the category list directly.
 *
 * Categories change very rarely, so the read is memoised in-process for a
 * short TTL — consistent with the endpoint's `s-maxage=60` header.
 */

import { prisma } from '@/lib/prisma';
import { cached } from '@/lib/cache';
import type { PromptCategoryInfo } from '@/lib/types';

const CACHE_KEY = 'categories:all';
const TTL_MS = 60_000;

export async function listCategories(): Promise<PromptCategoryInfo[]> {
  return cached(CACHE_KEY, TTL_MS, () =>
    prisma.promptCategory.findMany({ orderBy: { order: 'asc' } }),
  );
}
