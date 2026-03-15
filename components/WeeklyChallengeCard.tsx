'use client';

import { useEffect, useState } from 'react';
import type { WeeklyChallengeData } from '@/lib/types';

interface Props {
  challenge: WeeklyChallengeData;
  onSubmit?: () => void;
}

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) return setTimeLeft('Abgelaufen');
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${d}T ${h}h ${m}m`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [endDate]);

  return timeLeft;
}

export default function WeeklyChallengeCard({ challenge, onSubmit }: Props) {
  const countdown = useCountdown(challenge.endDate);

  return (
    <div
      className="rounded-2xl p-6 text-white shadow-lg"
      style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0d7a59 100%)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
          🏆 Wöchentliche Challenge
        </span>
        <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-mono">
          ⏱ {countdown}
        </span>
      </div>

      <h2 className="text-xl font-bold mb-2">{challenge.title}</h2>
      <p className="text-white/80 text-sm mb-5">{challenge.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-white/70 text-sm">
          {challenge.submissionCount} Einreichungen · +30 Pts
        </span>
        <button
          onClick={onSubmit}
          className="bg-white text-emerald-700 font-semibold text-sm px-5 py-2 rounded-xl hover:bg-emerald-50 transition-colors"
        >
          Meinen Prompt einreichen →
        </button>
      </div>
    </div>
  );
}
