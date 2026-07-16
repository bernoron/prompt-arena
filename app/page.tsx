import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { getTopPrompts } from '@/lib/services/prompt-service';
import { listCategories } from '@/lib/services/category-service';
import { getRecentFeatures } from '@/lib/services/changelog-service';
import { CATEGORY_COLOR_CLASSES, CATEGORY_FALLBACK_COLOR_CLASSES } from '@/lib/constants';

const RECENT_FEATURES_LIMIT = 10;

const FEATURES = [
  { icon: '📚', title: 'Prompt-Bibliothek', text: 'Durchsuche geprüfte Prompts deiner Kolleg:innen – nach Kategorie, Schwierigkeit oder Beliebtheit.' },
  { icon: '✍️', title: 'Selbst einreichen', text: 'Teile deine besten Prompts und sammle Punkte, sobald andere sie nutzen und bewerten.' },
  { icon: '🧠', title: 'Lernpfade', text: 'Kurze Lektionen bringen dir Prompt-Engineering von Grund auf bei.' },
  { icon: '🏆', title: 'Challenges & Rangliste', text: 'Tritt bei wöchentlichen Challenges an und klettere in der Rangliste nach oben.' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm tracking-tight">
      {'★'.repeat(Math.round(rating))}
      <span className="text-slate-200">{'★'.repeat(5 - Math.round(rating))}</span>
    </span>
  );
}

// @spec AC-13-002, AC-13-003, AC-13-004, AC-13-006, AC-13-007, AC-13-009
export default async function LandingPage() {
  const user = await getSessionUser();
  if (user) redirect('/dashboard');

  const [topPrompts, categories, recentFeatures] = await Promise.all([
    getTopPrompts(3),
    listCategories(),
    getRecentFeatures(RECENT_FEATURES_LIMIT),
  ]);

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F4C35 100%)' }}
    >
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-xl mx-auto mb-5"
          style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}
        >
          PA
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Prompt<span className="text-emerald-400">Arena</span>
        </h1>
        <p className="text-slate-300 text-base sm:text-lg mt-4 max-w-2xl mx-auto">
          Die interne Bibliothek für KI-Prompts. Entdecke, was deine Kolleg:innen schon
          herausgefunden haben, teile deine eigenen Tricks – und sammle dabei Punkte.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}
          >
            Jetzt kostenlos starten
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3 rounded-xl text-white font-semibold text-base border border-white/20 hover:bg-white/10 transition-all"
          >
            Anmelden
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="text-white font-bold mb-1">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Anonymized top prompts */}
      {topPrompts.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <h2 className="text-white text-xl sm:text-2xl font-extrabold text-center mb-1">
            🔥 Die beliebtesten Prompts
          </h2>
          <p className="text-slate-400 text-sm text-center mb-8">
            Ein Ausschnitt aus der Bibliothek – anonymisiert, damit du selbst neugierig wirst.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {topPrompts.map((p) => {
              const info = categories.find((c) => c.slug === p.category);
              const colors = (info && CATEGORY_COLOR_CLASSES[info.color]) ?? CATEGORY_FALLBACK_COLOR_CLASSES;
              return (
                <div key={p.id} className="bg-white rounded-2xl shadow-xl p-5 text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 rounded-full font-semibold border text-xs px-2.5 py-1 ${colors.bg} ${colors.text} ${colors.border}`}>
                      {info?.icon ?? '•'} {info?.label ?? p.category}
                    </span>
                    <span className="text-xs font-bold text-amber-500">{p.usageCount}× genutzt</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2 leading-snug">{p.title}</h3>
                  <p className="text-xs font-mono text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mb-3 line-clamp-3">
                    {p.content}
                  </p>
                  {p.voteCount > 0 && <StarRating rating={p.avgRating} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent features, sourced from CHANGELOG.md (CR-005) */}
      {recentFeatures.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-white text-xl sm:text-2xl font-extrabold text-center mb-1">
            🚀 Neuigkeiten
          </h2>
          <p className="text-slate-400 text-sm text-center mb-8">
            Das haben wir zuletzt gebaut.
          </p>
          <ul className="space-y-3">
            {recentFeatures.map((f, i) => (
              <li
                key={`${f.version}-${i}`}
                className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              >
                <span className="text-slate-500 text-xs font-mono whitespace-nowrap pt-0.5">{f.date}</span>
                {f.scope && (
                  <span className="text-emerald-400 text-xs font-mono whitespace-nowrap pt-0.5">{f.scope}</span>
                )}
                <span className="text-slate-200 text-sm leading-snug">{f.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-slate-500 text-xs pb-10">
        Schon dabei?{' '}
        <Link href="/login" className="text-emerald-400 font-semibold hover:underline">
          Hier anmelden
        </Link>
      </p>
    </div>
  );
}
