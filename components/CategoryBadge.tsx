'use client';

import type { Category } from '@/lib/types';
import { CATEGORY_COLOR_CLASSES, CATEGORY_FALLBACK_COLOR_CLASSES } from '@/lib/constants';
import { useCategories } from '@/hooks/useCategories';

interface Props {
  category: Category;
  size?: 'sm' | 'md';
}

// @spec AC-02-014
export default function CategoryBadge({ category, size = 'md' }: Props) {
  const categories = useCategories();
  const info = categories.find((c) => c.slug === category);
  const colors = (info && CATEGORY_COLOR_CLASSES[info.color]) ?? CATEGORY_FALLBACK_COLOR_CLASSES;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold border ${colors.bg} ${colors.text} ${colors.border} ${sizeClass}`}>
      <span className="text-sm leading-none">{info?.icon ?? '•'}</span>
      {info?.label ?? category}
    </span>
  );
}
