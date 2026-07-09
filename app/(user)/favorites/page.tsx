import { getSessionUserId } from '@/lib/user-auth';
import { listFavorites } from '@/lib/services/favorite-service';
import type { PromptWithDetails } from '@/lib/types';
import FavoritesClient from './FavoritesClient';

/**
 * Favorites are fetched on the server via the service layer and passed to the
 * client island as `initialPrompts` — no fetch-on-mount waterfall.
 */
export default async function FavoritesPage() {
  const userId = await getSessionUserId();
  const initialPrompts = userId
    ? ((await listFavorites(userId)) as unknown as PromptWithDetails[])
    : [];
  return <FavoritesClient initialPrompts={initialPrompts} />;
}
