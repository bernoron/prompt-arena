'use client';

// @spec AC-11-002, AC-11-003, AC-11-004, AC-11-005
import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';

type Category = 'BUG' | 'IMPROVEMENT' | 'IDEA' | 'PRAISE';

const CATEGORIES: { value: Category; icon: string; label: string }[] = [
  { value: 'BUG',         icon: '🐛', label: 'Bug' },
  { value: 'IMPROVEMENT', icon: '🔧', label: 'Verbesserung' },
  { value: 'IDEA',        icon: '💡', label: 'Idee' },
  { value: 'PRAISE',      icon: '⭐', label: 'Lob' },
];

interface Props {
  onClose: () => void;
  contextType?: 'GENERAL' | 'LESSON' | 'PROMPT';
  contextId?: number;
}

export default function FeedbackModal({ onClose, contextType = 'GENERAL', contextId }: Props) {
  const [category, setCategory] = useState<Category | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = category !== null && text.trim().length > 0 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await apiFetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          text: text.trim(),
          contextType,
          contextId,
          contextPath: window.location.pathname,
        }),
      });
      setDone(true);
      setTimeout(onClose, 1800);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        {done ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">🙏</div>
            <p className="font-semibold text-gray-800">Danke für dein Feedback!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Feedback geben</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* Category picker */}
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-medium transition-colors ${
                    category === c.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="text-xl">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Text */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Was möchtest du uns mitteilen?"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <div className="text-right text-xs text-gray-400">{text.length}/500</div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors"
            >
              {loading ? 'Wird gesendet…' : 'Absenden'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
