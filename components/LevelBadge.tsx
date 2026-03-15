import type { LevelName } from '@/lib/types';
import { LEVEL_CONFIG } from '@/lib/constants';

interface Props {
  level: LevelName;
  size?: 'sm' | 'md';
}

export default function LevelBadge({ level, size = 'md' }: Props) {
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG['Prompt-Lehrling'];
  const sizeClass = size === 'sm'
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-xs px-2.5 py-1 gap-1.5';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClass}`}>
      <span className="text-sm leading-none">{cfg.icon}</span>
      {level}
    </span>
  );
}
