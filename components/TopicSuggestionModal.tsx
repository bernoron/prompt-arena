'use client';

// @spec AC-11-010, AC-11-011
import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';

interface Props {
  onClose: () => void;
}

export default function TopicSuggestionModal({ onClose }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = title.trim().length >= 3 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await apiFetch('/api/feedback/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
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
            <div className="text-3xl mb-2">💡</div>
            <p className="font-semibold text-gray-800">Danke für deinen Vorschlag!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Thema vorschlagen</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  placeholder="Welches Thema fehlt dir? *"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <div className="text-right text-xs text-gray-400 mt-1">{title.length}/200</div>
              </div>

              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Warum wäre das nützlich? (optional)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <div className="text-right text-xs text-gray-400">{description.length}/500</div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors"
            >
              {loading ? 'Wird gesendet…' : 'Vorschlag einreichen'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
