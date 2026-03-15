'use client';

/**
 * LevelUpModal – Celebrates a player levelling up.
 *
 * Shows a full-screen overlay with a confetti burst (canvas-confetti)
 * and the new level name. Closes on backdrop click, button click, or
 * automatically after 6 seconds.
 */

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LEVEL_CONFIG } from '@/lib/constants';

interface Props {
  newLevel: string;
  onClose: () => void;
}

export default function LevelUpModal({ newLevel, onClose }: Props) {
  const levelConf = LEVEL_CONFIG[newLevel as keyof typeof LEVEL_CONFIG];

  useEffect(() => {
    // Fire confetti burst from both sides
    const fire = (x: number, angle: number) =>
      confetti({
        particleCount: 80,
        spread: 60,
        angle,
        origin: { x, y: 0.6 },
        colors: ['#059669', '#0891b2', '#f59e0b', '#8b5cf6', '#ec4899'],
      });

    fire(0.25, 60);
    fire(0.75, 120);

    // Auto-close after 6 s
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm w-full animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Trophy animation */}
        <div className="text-7xl mb-3 animate-bounce-once">🏆</div>

        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
          Level Up!
        </p>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-5">
          Du bist jetzt
        </h2>

        {/* New level badge */}
        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-lg font-extrabold border-2 mb-8 ${
          levelConf
            ? `${levelConf.bg} ${levelConf.text} ${levelConf.border}`
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          <span>{levelConf?.icon ?? '🌟'}</span>
          <span>{newLevel}</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}
        >
          Weiter geht&apos;s! 🚀
        </button>
      </div>
    </div>
  );
}
