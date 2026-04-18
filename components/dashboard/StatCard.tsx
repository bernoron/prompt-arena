import { memo } from 'react';

interface StatCardProps {
  value: string;
  label: string;
  sub?: string;
  color?: 'emerald' | 'blue' | 'purple' | 'amber';
}

const COLOR_MAP: Record<string, string> = {
  emerald: 'text-emerald-600',
  blue:    'text-blue-600',
  purple:  'text-purple-600',
  amber:   'text-amber-600',
};

const StatCard = memo(function StatCard({ value, label, sub, color = 'emerald' }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
      <p className={`text-2xl font-extrabold ${COLOR_MAP[color] ?? COLOR_MAP.emerald}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
});

export default StatCard;
