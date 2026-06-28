'use client';

// @spec AC-11-006, AC-11-007, AC-11-008, AC-11-009
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';

interface Props {
  lessonId: number;
  userId: number | null;
}

interface ExistingFeedback {
  id: number;
  helpful: boolean;
  text: string | null;
}

export default function LessonFeedback({ lessonId, userId }: Props) {
  const [existing, setExisting] = useState<ExistingFeedback | null | undefined>(undefined);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [showText, setShowText] = useState(false);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    apiFetch<ExistingFeedback | null>(`/api/feedback/lesson?userId=${userId}&lessonId=${lessonId}`)
      .then((data) => {
        setExisting(data);
        if (data) {
          setHelpful(data.helpful);
          setText(data.text ?? '');
        }
      })
      .catch(() => setExisting(null));
  }, [userId, lessonId]);

  if (!userId) return null;

  async function vote(value: boolean) {
    if (loading) return;
    setLoading(true);
    setHelpful(value);
    try {
      if (existing?.id) {
        await apiFetch(`/api/feedback/lesson/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ helpful: value }),
        });
      } else {
        const res = await apiFetch<{ ok: boolean; id: number }>('/api/feedback/lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, lessonId, helpful: value }),
        });
        setExisting({ id: res.id, helpful: value, text: null });
      }
      setShowText(true);
    } finally {
      setLoading(false);
    }
  }

  async function submitText() {
    if (!existing?.id || !text.trim()) return;
    setLoading(true);
    try {
      await apiFetch(`/api/feedback/lesson/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });
      setExisting((e) => e ? { ...e, text: text.trim() } : e);
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  const voted = helpful !== null;

  return (
    <div className="mt-10 pt-6 border-t border-gray-100">
      <p className="text-sm text-gray-500 mb-3">War diese Lektion hilfreich?</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => vote(true)}
          disabled={loading}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${
            helpful === true
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-gray-200 hover:border-emerald-300 text-gray-600'
          }`}
        >
          👍 Ja
        </button>
        <button
          onClick={() => vote(false)}
          disabled={loading}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${
            helpful === false
              ? 'border-red-400 bg-red-50 text-red-600'
              : 'border-gray-200 hover:border-red-300 text-gray-600'
          }`}
        >
          👎 Nein
        </button>
        {voted && !showText && (
          <span className="text-sm text-gray-400">Danke!</span>
        )}
      </div>

      {showText && !saved && (
        <div className="mt-3 space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Möchtest du uns mehr sagen? (optional)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="flex gap-2">
            <button
              onClick={submitText}
              disabled={!text.trim() || loading}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors"
            >
              Senden
            </button>
            <button
              onClick={() => setShowText(false)}
              className="px-4 py-1.5 text-gray-500 hover:text-gray-700 text-sm"
            >
              Überspringen
            </button>
          </div>
        </div>
      )}

      {saved && (
        <p className="mt-2 text-sm text-emerald-600">✓ Feedback gespeichert</p>
      )}
    </div>
  );
}
