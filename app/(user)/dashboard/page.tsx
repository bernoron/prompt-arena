import { getSessionUser } from '@/lib/session';
import { getRankedUsers } from '@/lib/services/user-service';
import { getActiveChallenges } from '@/lib/services/challenge-service';
import { getTrendingPrompts } from '@/lib/services/prompt-service';
import { getLearnModules } from '@/lib/services/learn-service';
import type { PromptWithDetails } from '@/lib/types';
import DashboardClient from './DashboardClient';

// @spec AC-04-004, AC-04-005
export default async function DashboardPage() {
  const sessionUser = await getSessionUser();

  const [allUsers, challenges, allPrompts, learnModules] = await Promise.all([
    getRankedUsers(),
    getActiveChallenges(),
    getTrendingPrompts(),
    getLearnModules(sessionUser?.id ?? 0),
  ]);

  const now = Date.now();
  const activeChallenges = challenges.filter((c) => {
    const hasStarted = new Date(c.startDate).getTime() <= now;
    const isEnded    = new Date(c.endDate).getTime() < now;
    return c.isActive && hasStarted && !isEnded;
  });

  return (
    <DashboardClient
      currentUserId={sessionUser?.id ?? null}
      allUsers={allUsers}
      challenges={activeChallenges}
      allPrompts={allPrompts as unknown as PromptWithDetails[]}
      learnModules={learnModules}
    />
  );
}
