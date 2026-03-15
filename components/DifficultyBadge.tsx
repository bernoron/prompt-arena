import type { Difficulty } from '@/lib/types';

export default function DifficultyBadge({ difficulty, size = 'sm' }: { difficulty: Difficulty; size?: 'sm' | 'xs' }) {
  const isFortgeschritten = difficulty === 'Fortgeschritten';
  const base = size === 'sm' ? 'text-xs px-2 py-0.5 rounded-full border font-medium' : 'text-[10px] px-1.5 py-0.5 rounded-full border font-medium';
  const color = isFortgeschritten ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-slate-50 text-slate-600 border-slate-200';
  return <span className={`${base} ${color}`}>{difficulty}</span>;
}
