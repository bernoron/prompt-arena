'use client';

// @spec AC-11-001
import { useState, useEffect } from 'react';
import { USER_ID_KEY } from '@/lib/constants';
import FeedbackModal from './FeedbackModal';

export default function FeedbackButton() {
  const [userId, setUserId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(USER_ID_KEY);
    const id = raw ? parseInt(raw, 10) : null;
    setUserId(id && id > 0 ? id : null);

    const handler = () => {
      const updated = localStorage.getItem(USER_ID_KEY);
      const uid = updated ? parseInt(updated, 10) : null;
      setUserId(uid && uid > 0 ? uid : null);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  if (!userId) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg transition-colors"
        aria-label="Feedback geben"
      >
        <span>💬</span>
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {open && (
        <FeedbackModal
          userId={userId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
