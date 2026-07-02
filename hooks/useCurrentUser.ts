'use client';

/**
 * Custom hook: useCurrentUser
 *
 * Provides the currently authenticated user's ID to any client component.
 *
 * Backed by <SessionProvider> (components/SessionProvider.tsx), which itself
 * is populated server-side from the signed session cookie via
 * lib/session.ts — there is no localStorage mirror or 'userChanged' event
 * bus anymore. Login/register/logout all cause a Next.js navigation, which
 * re-renders the (user) layout and re-resolves the session automatically.
 *
 * Usage:
 *   const userId = useCurrentUser();
 *   // null when logged out (middleware normally redirects before this
 *   // matters, but pages can still handle the transient null safely).
 */

import { useSession } from '@/components/SessionProvider';

export function useCurrentUser(): number | null {
  return useSession()?.id ?? null;
}
