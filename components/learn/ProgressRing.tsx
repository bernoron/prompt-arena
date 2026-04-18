interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
}

export default function ProgressRing({ completed, total, size = 48 }: ProgressRingProps) {
  const r = size * 0.4;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = total > 0 ? completed / total : 0;
  const offset = circumference * (1 - pct);
  const done = completed === total && total > 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e2e8f0" strokeWidth={size * 0.1} />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={done ? '#059669' : '#0891b2'}
        strokeWidth={size * 0.1}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}
