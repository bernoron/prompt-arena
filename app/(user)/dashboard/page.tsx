import { getSessionUserId } from '@/lib/user-auth';
import { listUsers } from '@/lib/services/user-service';
import { getActiveChallenges } from '@/lib/services/challenge-service';
import { getTrendingPrompts } from '@/lib/services/prompt-service';
import { getLearningModules } from '@/lib/services/learn-service';
import type { PromptWithDetails } from '@/lib/types';
import DashboardClient from './DashboardClient';

/**
 * The dashboard's four data sources are fetched on the server in parallel via
 * the service layer and passed to the client island as initial data. This
 * replaces the previous client-side waterfall (three parallel fetches on mount,
 * then a fourth for the learning path) — the page now arrives with its data in
 * the first HTML/RSC payload.
 */
// @spec AC-04-004, AC-04-005
export default async function DashboardPage() {
  const userId = await getSessionUserId();

  const [users, challenges, trending, learn] = await Promise.all([
    listUsers(),
    getActiveChallenges(),
    getTrendingPrompts(),
    getLearningModules(userId ?? 0),
  ]);

  return (
    <DashboardClient
      initialUsers={users}
      initialChallenges={challenges}
      initialTrending={trending as unknown as PromptWithDetails[]}
      initialLearn={learn}
    />
  );
}
