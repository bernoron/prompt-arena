'use client';

/**
 * FloatingPoints – XP-Explosion Overlay
 *
 * Renders floating "+X Pts" labels that animate upward and fade out.
 * Trigger from anywhere via the exported `triggerFloat()` helper, which
 * dispatches a CustomEvent on the window.
 *
 * Usage:
 *   import { triggerFloat } from '@/components/FloatingPoints';
 *   triggerFloat('+5 Pts', x, y);   // x/y in viewport pixels
 *
 * Mount <FloatingPoints /> once at the page root (e.g. inside layout).
 */

import { useState, useEffect, useCallback } from 'react';

const FLOAT_EVENT = 'float-points';

interface FloatItem {
  id: number;
  text: string;
  x: number;
  y: number;
}

let _nextId = 0;

/** Dispatch a floating XP label at the given viewport position. */
export function triggerFloat(text: string, x: number, y: number) {
  window.dispatchEvent(new CustomEvent(FLOAT_EVENT, { detail: { text, x, y } }));
}

// @spec AC-04-007
export default function FloatingPoints() {
  const [items, setItems] = useState<FloatItem[]>([]);

  const handleFloat = useCallback((e: Event) => {
    const { text, x, y } = (e as CustomEvent<{ text: string; x: number; y: number }>).detail;
    const id = _nextId++;
    setItems((prev) => [...prev, { id, text, x, y }]);
    setTimeout(() => setItems((prev) => prev.filter((item) => item.id !== id)), 1100);
  }, []);

  useEffect(() => {
    window.addEventListener(FLOAT_EVENT, handleFloat);
    return () => window.removeEventListener(FLOAT_EVENT, handleFloat);
  }, [handleFloat]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden="true">
      {items.map((item) => (
        <span
          key={item.id}
          className="absolute text-emerald-500 font-extrabold text-base animate-float-up select-none"
          style={{ left: item.x, top: item.y, textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}
