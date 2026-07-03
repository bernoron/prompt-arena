import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CategoryBadge from '@/components/CategoryBadge';
import DifficultyBadge from '@/components/DifficultyBadge';
import PromptDetailActions from '@/components/PromptDetailActions';
import { getPromptById } from '@/lib/services/prompt-service';
import { getSessionUser } from '@/lib/session';
import type { Category } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 ? id : null;
}

// Individual prompts are public (see middleware.ts) so they can be indexed by
// search engines and shared as direct links, even though the rest of the app
// requires an account.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseId((await params).id);
  const prompt = id ? await getPromptById(id, null) : null;
  if (!prompt) return { title: 'Prompt nicht gefunden – PromptArena' };

  const description = prompt.content.length > 155
    ? `${prompt.content.slice(0, 155)}…`
    : prompt.content;

  return {
    title: `${prompt.title} – PromptArena`,
    description,
    openGraph: {
      title: prompt.title,
      description,
      type: 'article',
    },
  };
}

export default async function PromptDetailPage({ params }: Props) {
  const id = parseId((await params).id);
  if (!id) notFound();

  const user = await getSessionUser();
  const prompt = await getPromptById(id, user?.id ?? null);
  if (!prompt) notFound();

  const hasSeparateEn = prompt.titleEn !== prompt.title || prompt.contentEn !== prompt.content;

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/library" className="text-sm text-slate-400 hover:text-slate-600 mb-4 inline-block">
        ← Zurück zur Bibliothek
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <div className="flex flex-wrap gap-2 mb-2">
            <CategoryBadge category={prompt.category as Category} />
            <DifficultyBadge difficulty={prompt.difficulty as 'Einstieg' | 'Fortgeschritten'} />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 leading-tight">{prompt.title}</h1>
          {hasSeparateEn && <p className="text-sm text-slate-400 mt-0.5">{prompt.titleEn}</p>}
        </div>

        <div className="p-4 sm:p-6">
          <pre className="bg-slate-50 rounded-xl p-5 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed border border-slate-200">
            {prompt.content}
          </pre>
          {hasSeparateEn && (
            <>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-4 mb-2">🇬🇧 English</p>
              <pre className="bg-slate-50 rounded-xl p-5 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed border border-slate-200">
                {prompt.contentEn}
              </pre>
            </>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: prompt.author.avatarColor }}>
                {prompt.author.name.split(' ').map((n) => n[0]).join('')}
              </span>
              <p className="text-sm font-bold text-slate-800">{prompt.author.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-600">{prompt.voteCount > 0 ? prompt.avgRating.toFixed(1) : '—'} ★</p>
              <p className="text-xs text-slate-400">{prompt.voteCount} Bewertungen</p>
            </div>
          </div>

          {!user && (
            <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
              <Link href="/login" className="text-emerald-600 font-semibold hover:underline">Melde dich an</Link>,
              um diesen Prompt zu bewerten, zu favorisieren oder als benutzt zu markieren.
            </p>
          )}

          <PromptDetailActions
            promptId={prompt.id}
            loggedIn={!!user}
            initialUserVote={prompt.userVote ?? null}
            initialUserFavorite={prompt.userFavorite ?? false}
            initialUsageCount={prompt.usageCount}
            content={prompt.content}
          />
        </div>
      </div>
    </div>
  );
}
