'use client';

/**
 * Custom hook: useCategories
 *
 * Client-side cache for GET /api/categories, shared across every component
 * instance on the page (CategoryBadge, PromptCard, …) so the endpoint is
 * fetched once per page load instead of once per badge. CR-004, AC-02-014.
 *
 * Usage:
 *   const categories = useCategories();
 *   const info = categories.find((c) => c.slug === category);
 */

import { useEffect, useState } from 'react';
import type { PromptCategoryInfo } from '@/lib/types';

let cache: PromptCategoryInfo[] | null = null;
let inflight: Promise<PromptCategoryInfo[]> | null = null;

function fetchCategories(): Promise<PromptCategoryInfo[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PromptCategoryInfo[]) => {
        cache = data;
        return data;
      })
      .catch(() => []);
  }
  return inflight;
}

export function useCategories(): PromptCategoryInfo[] {
  // Lazy initial state already covers the cache-hit case, so the effect
  // below only ever needs to run the network fetch on a cold cache.
  const [categories, setCategories] = useState<PromptCategoryInfo[]>(() => cache ?? []);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    fetchCategories().then((data) => {
      if (!cancelled) setCategories(data);
    });
    return () => { cancelled = true; };
  }, []);

  return categories;
}
