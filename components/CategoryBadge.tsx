import type { Category } from '@/lib/types';
import { CATEGORY_CONFIG } from '@/lib/constants';

interface Props {
  category: Category;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, size = 'md' }: Props) {
  const cfg = CATEGORY_CONFIG[category] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '•' };
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClass}`}>
      <span className="text-sm leading-none">{cfg.icon}</span>
      {category}
    </span>
  );
}
