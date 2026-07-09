import { getSessionUserId } from '@/lib/user-auth';
import { listPrompts } from '@/lib/services/prompt-service';
import { listCategories } from '@/lib/services/category-service';
import type { PromptWithDetails } from '@/lib/types';
import LibraryClient from './LibraryClient';

const PAGE_SIZE = 20;

/**
 * The first page of prompts (personalised for the signed-in user) and the
 * category list are fetched on the server and handed to the client island as
 * initial data — the library renders with content in the first HTML payload
 * instead of after a client-side fetch waterfall.
 */
// @spec AC-02-012
export default async function LibraryPage() {
  const userId = await getSessionUserId();

  const [page, categories] = await Promise.all([
    listPrompts({ sortBy: 'newest', take: PAGE_SIZE, resolvedUserId: userId }),
    listCategories(),
  ]);

  return (
    <LibraryClient
      initialItems={page.items as unknown as PromptWithDetails[]}
      initialNextCursor={page.nextCursor}
      initialHasNextPage={page.hasNextPage}
      initialCategories={categories}
    />
  );
}
