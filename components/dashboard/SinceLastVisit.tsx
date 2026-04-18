import { memo } from 'react';
import type { RankDiff, RankedUser } from '@/lib/types';

function Avatar({ user, size = 7 }: { user: Pick<RankedUser, 'name' | 'avatarColor'>; size?: number }) {
  return (
    <span
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
      style={{ backgroundColor: user.avatarColor }}
    >
      {user.name.split(' ').map((n) => n[0]).join('')}
    </span>
  );
}

function UserRow({ user }: { user: RankedUser }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/80 rounded-xl px-3 py-2">
      <Avatar user={user} />
      <span className="text-sm font-semibold text-slate-700 flex-1">{user.name.split(' ')[0]}</span>
      <span className="text-xs font-bold text-slate-500">{user.pts} Pts</span>
    </div>
  );
}

const SinceLastVisit = memo(function SinceLastVisit({ diff }: { diff: RankDiff }) {
  const { delta, overtookMe, iOvertook } = diff;
  if (delta === 0 && overtookMe.length === 0 && iOvertook.length === 0) return null;

  return (
    <div className={`rounded-2xl border p-5 ${
      delta < 0
        ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50'
        : delta > 0
        ? 'border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50'
        : 'border-slate-200 bg-slate-50'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{delta < 0 ? '📈' : delta > 0 ? '📉' : '📊'}</span>
        <h3 className="font-extrabold text-slate-800">Seit deinem letzten Besuch</h3>
        <span className={`ml-auto text-sm font-extrabold px-2.5 py-0.5 rounded-full ${
          delta < 0 ? 'bg-emerald-100 text-emerald-700'
          : delta > 0 ? 'bg-rose-100 text-rose-700'
          : 'bg-slate-100 text-slate-600'
        }`}>
          {delta === 0
            ? '= Unverändert'
            : delta < 0
            ? `↑ ${Math.abs(delta)} Plätze gewonnen`
            : `↓ ${delta} Plätze verloren`}
        </span>
      </div>

      <div className="space-y-3">
        {overtookMe.length > 0 && (
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wide mb-2">🚨 Hat dich überholt</p>
            <div className="space-y-2">
              {overtookMe.map((u) => <UserRow key={u.id} user={u} />)}
            </div>
          </div>
        )}
        {iOvertook.length > 0 && (
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2">✅ Von dir überholt</p>
            <div className="space-y-2">
              {iOvertook.map((u) => <UserRow key={u.id} user={u} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default SinceLastVisit;
