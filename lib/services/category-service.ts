/**
 * Category read logic, shared between GET /api/categories and the Server
 * Components (library, submit) that need the category list directly.
 *
 * Categories change very rarely, so the read is memoised in-process for a
 * short TTL — consistent with the endpoint's `s-maxage=60` header.
 */

import { prisma } from '@/lib/prisma';
import { cached, invalidate } from '@/lib/cache';
import { slugify } from '@/lib/slug';
import type { PromptCategoryInfo } from '@/lib/types';
import { CATEGORY_DEFAULT_ICON, CATEGORY_COLOR_PALETTE } from '@/lib/constants';

const CACHE_KEY = 'categories:all';
const TTL_MS = 60_000;

export async function listCategories(): Promise<PromptCategoryInfo[]> {
  return cached(CACHE_KEY, TTL_MS, () =>
    prisma.promptCategory.findMany({ orderBy: { order: 'asc' } }),
  );
}

/** Thrown by {@link createCategory} when the label has no usable characters. */
export class InvalidCategoryLabelError extends Error {}

/** Thrown by {@link createCategory} when the derived slug already exists. */
export class CategorySlugTakenError extends Error {}

/**
 * Creates a category from a user-supplied label (CR-004, AC-02-013).
 * Unlike the admin endpoint, regular users don't choose icon/colour/order —
 * those are assigned automatically (default icon, colour cycled by current
 * category count) so the category is immediately usable everywhere.
 */
// @spec AC-02-013
export async function createCategory(label: string): Promise<PromptCategoryInfo> {
  const slug = slugify(label);
  if (!slug) throw new InvalidCategoryLabelError();

  const [count, maxOrder] = await Promise.all([
    prisma.promptCategory.count(),
    prisma.promptCategory.aggregate({ _max: { order: true } }),
  ]);

  try {
    const category = await prisma.promptCategory.create({
      data: {
        slug,
        label: label.trim(),
        icon: CATEGORY_DEFAULT_ICON,
        color: CATEGORY_COLOR_PALETTE[count % CATEGORY_COLOR_PALETTE.length],
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
    invalidate(CACHE_KEY);
    return category;
  } catch {
    // Unique constraint on `slug` — same lowercase slug already exists.
    throw new CategorySlugTakenError();
  }
}
