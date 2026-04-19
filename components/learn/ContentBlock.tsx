import type { ContentBlock } from '@/lib/types';

// @spec AC-08-006, AC-08-007
export default function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'text':
      return (
        <p className="text-slate-700 leading-relaxed text-[15px]">{block.content}</p>
      );

    case 'tip':
      return (
        <div className="flex gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <span className="text-lg flex-shrink-0">💡</span>
          <p className="text-emerald-800 text-sm leading-relaxed">{block.content}</p>
        </div>
      );

    case 'warning':
      return (
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-amber-800 text-sm leading-relaxed">{block.content}</p>
        </div>
      );

    case 'example':
      return (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          {block.label && (
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Beispiel: {block.label}
              </span>
            </div>
          )}
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">✗ Weniger gut</span>
              </div>
              <p className="text-sm text-slate-600 bg-rose-50 rounded-lg p-3 font-mono whitespace-pre-wrap leading-relaxed">
                {block.bad}
              </p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">✓ Besser</span>
              </div>
              <p className="text-sm text-slate-700 bg-emerald-50 rounded-lg p-3 font-mono whitespace-pre-wrap leading-relaxed">
                {block.good}
              </p>
            </div>
          </div>
          {block.explanation && (
            <div className="px-4 py-3 bg-blue-50 border-t border-slate-200">
              <p className="text-xs text-blue-700 leading-relaxed">
                <span className="font-bold">Warum?</span> {block.explanation}
              </p>
            </div>
          )}
        </div>
      );

    case 'pattern':
      return (
        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-indigo-200 flex items-center gap-2">
            <span className="text-lg">🔧</span>
            <span className="font-bold text-indigo-800">{block.name}</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">Vorlage</p>
              <pre className="text-sm text-indigo-900 bg-white/70 rounded-lg p-3 whitespace-pre-wrap font-mono leading-relaxed border border-indigo-100">
                {block.template}
              </pre>
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">Beispiel</p>
              <pre className="text-sm text-slate-700 bg-white/70 rounded-lg p-3 whitespace-pre-wrap font-mono leading-relaxed border border-indigo-100">
                {block.example}
              </pre>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs text-indigo-400">📌</span>
              <p className="text-xs text-indigo-700">{block.useCase}</p>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
