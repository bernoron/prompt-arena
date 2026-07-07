'use client';

// @spec AC-14-003, AC-14-005, AC-14-006, AC-14-008, AC-14-009
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from './SessionProvider';
import { ONBOARDING_STEPS } from '@/lib/constants';
import { apiFetch } from '@/lib/api-client';

function OnboardingFunnelInner() {
  const user = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const forcedOpen = searchParams.get('tour') === '1';

  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // `dismissed` only suppresses the automatic first-login display for the
  // rest of this session — a manual re-open via ?tour=1 must always win,
  // even right after the user has just skipped/finished it.
  const shouldShow = Boolean(user) && (forcedOpen || (!dismissed && !user?.onboardingCompletedAt));

  // Reset to the first step whenever the funnel is (re-)opened.
  useEffect(() => {
    if (shouldShow) setStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcedOpen]);

  if (!shouldShow) return null;

  const isLastStep = step === ONBOARDING_STEPS.length - 1;
  const current = ONBOARDING_STEPS[step];

  function close() {
    setDismissed(true);
    apiFetch('/api/onboarding', { method: 'POST' }).catch(() => {});
    if (forcedOpen) router.replace('/dashboard');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {ONBOARDING_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-emerald-500' : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>
          <button
            onClick={close}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Überspringen
          </button>
        </div>

        <div className="text-center space-y-2 py-2">
          <div className="text-4xl">{current.icon}</div>
          <h2 className="text-lg font-bold text-gray-900">{current.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{current.body}</p>
        </div>

        {isLastStep ? (
          <div className="flex flex-col gap-2">
            <Link
              href="/library"
              onClick={close}
              className="w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors"
            >
              Zur Prompt-Bibliothek
            </Link>
            <Link
              href="/learn"
              onClick={close}
              className="w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition-colors"
            >
              Lernpfad starten
            </Link>
          </div>
        ) : (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors"
          >
            Weiter
          </button>
        )}
      </div>
    </div>
  );
}

export default function OnboardingFunnel() {
  return (
    <Suspense>
      <OnboardingFunnelInner />
    </Suspense>
  );
}
