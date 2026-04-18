import { memo } from 'react';
import Link from 'next/link';
import type { UserWithStats } from '@/lib/types';
import { POINTS } from '@/lib/points';

interface ImprovementCardProps {
  currentUser: UserWithStats;
  rank: number;
  allUsers: UserWithStats[];
  hasChallenges: boolean;
}

const ImprovementCard = memo(function ImprovementCard({
  currentUser, rank, allUsers, hasChallenges,
}: ImprovementCardProps) {
  if (rank === 1) {
    return (
      <div className="rounded-2xl border border-amber-200 p-4 bg-gradient-to-br from-amber-50 to-yellow-50">
        <p className="text-sm font-extrabold text-amber-800 mb-1">🏆 Du führst das Ranking an!</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          Bleib aktiv — der Zweite liegt nur{' '}
          <span className="font-bold">
            {currentUser.totalPoints - (allUsers[1]?.totalPoints ?? 0)} Pts
          </span>{' '}
          hinter dir.
        </p>
      </div>
    );
  }

  const ahead   = allUsers[rank - 2];
  const gap     = ahead ? ahead.totalPoints - currentUser.totalPoints : 0;
  const prompts = Math.ceil(gap / POINTS.SUBMIT_PROMPT);
  const ratings = Math.ceil(gap / POINTS.VOTE_ON_PROMPT);

  const tips = [
    { icon: '📝', text: `${prompts} Prompt${prompts > 1 ? 's' : ''} einreichen`, href: '/submit',  pts: prompts * POINTS.SUBMIT_PROMPT },
    { icon: '⭐', text: `${ratings} Prompts bewerten`,                            href: '/library', pts: ratings * POINTS.VOTE_ON_PROMPT },
    ...(hasChallenges ? [{ icon: '🏆', text: 'Challenge mitmachen', href: '/submit', pts: POINTS.CHALLENGE_SUBMIT }] : []),
  ];

  return (
    <div className="rounded-2xl border border-blue-200 p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <p className="text-sm font-extrabold text-blue-800 mb-1">
        💡 So überholst du {ahead?.name.split(' ')[0]}
      </p>
      <p className="text-xs text-blue-600 mb-3">
        Rückstand: <span className="font-extrabold text-blue-800">{gap} Pts</span>
      </p>
      <div className="space-y-2">
        {tips.map((t) => (
          <Link key={t.href + t.icon} href={t.href}
            className="flex items-center gap-2 bg-white/80 hover:bg-white rounded-xl px-3 py-2 transition-colors group">
            <span>{t.icon}</span>
            <span className="text-xs text-slate-700 flex-1 group-hover:text-blue-700 transition-colors">{t.text}</span>
            <span className="text-xs font-bold text-emerald-600">+{t.pts} Pts</span>
          </Link>
        ))}
      </div>
    </div>
  );
});

export default ImprovementCard;
