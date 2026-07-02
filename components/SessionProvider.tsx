'use client';

/**
 * Client-side identity context.
 *
 * The signed HttpOnly session cookie is the only source of truth for "who
 * is logged in" — this provider just makes the user object (already
 * resolved server-side by lib/session.ts) available to client components
 * without re-fetching or mirroring it into localStorage.
 *
 * There is no "switch user without logging out" flow anymore (that was the
 * old passwordless UserPicker). So the value only needs to be (re)supplied
 * on navigation, which Next.js already does by re-rendering the owning
 * Server Component layout — no client-side sync event bus required.
 */

import { createContext, useContext } from 'react';
import type { UserWithStats } from '@/lib/types';

const SessionContext = createContext<UserWithStats | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: UserWithStats | null;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

/** Full session user (name, avatarColor, totalPoints, level), or null when logged out. */
export function useSession(): UserWithStats | null {
  return useContext(SessionContext);
}
