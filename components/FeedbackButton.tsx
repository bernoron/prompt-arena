'use client';

// @spec AC-11-001
import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import FeedbackModal from './FeedbackModal';

export default function FeedbackButton() {
  const userId = useCurrentUser();
  const [open, setOpen] = useState(false);

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
