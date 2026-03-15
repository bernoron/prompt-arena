'use client';

/**
 * useLevelUp – Detects when the current user gains a new level.
 *
 * After every point-earning action call `checkLevelUp()`. It fetches
 * the latest user data, compares the level against the last known value,
 * and returns the new level name if it changed — or null otherwise.
 *
 * The first call always sets the baseline (returns null) so we don't
 * false-fire on initial load.
 */

import { useRef, useCallback } from 'react';

export function useLevelUp(userId: number | null) {
  const lastLevelRef = useRef<string | null>(null);

  const checkLevelUp = useCallback(async (): Promise<string | null> => {
    if (!userId) return null;

    try {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) return null;

      const user = await res.json() as { level: string };
      const newLevel = user.level;

      const previous = lastLevelRef.current;
      lastLevelRef.current = newLevel;

      // First call – just set the baseline, no level-up notification
      if (previous === null) return null;

      // Level changed → report it
      if (previous !== newLevel) return newLevel;

      return null;
    } catch {
      return null;
    }
  }, [userId]);

  return { checkLevelUp };
}
