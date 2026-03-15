'use client';

/**
 * Custom hook: useCurrentUser
 *
 * Provides the currently selected user's ID to any client component.
 *
 * The ID is persisted in localStorage under USER_ID_KEY so it survives
 * page refreshes. The UserPicker component dispatches a `userChanged`
 * CustomEvent on the window whenever the active user switches; this hook
 * subscribes to that event so every consumer re-renders automatically
 * without needing prop drilling or a global state library.
 *
 * Usage:
 *   const userId = useCurrentUser();
 *   // userId is null until localStorage is read (first render) or if no
 *   // user has been selected yet.
 */

import { useState, useEffect } from 'react';
import { USER_ID_KEY } from '@/lib/constants';

export function useCurrentUser(): number | null {
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // Read initial value from localStorage (client-only, hence inside useEffect)
    const stored = localStorage.getItem(USER_ID_KEY);
    setUserId(stored ? parseInt(stored, 10) : null);

    // Keep in sync when the user switches via UserPicker
    const handleUserChanged = () => {
      const updated = localStorage.getItem(USER_ID_KEY);
      setUserId(updated ? parseInt(updated, 10) : null);
    };

    window.addEventListener('userChanged', handleUserChanged);
    return () => window.removeEventListener('userChanged', handleUserChanged);
  }, []);

  return userId;
}
