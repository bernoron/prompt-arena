'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

// @spec AC-01-019
function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token  = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) { setError('Das Passwort muss mindestens 8 Zeichen lang sein.'); return; }
    if (password !== confirm) { setError('Die Passwörter stimmen nicht überein.'); return; }

    setLoading(true);
    const res = await fetch('/api/auth/password-reset/confirm', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setDone(true);
      setLoading(false);
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? 'Zurücksetzen fehlgeschlagen.');
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F4C35 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-xl mx-auto mb-3"
            style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}
          >
            PA
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Neues Passwort</h1>
          <p className="text-slate-400 text-sm mt-1">Vergib ein neues Passwort für dein Konto</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {!token ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-slate-600">Dieser Link ist ungültig. Bitte fordere einen neuen an.</p>
              <Link href="/forgot-password" className="text-emerald-600 font-semibold hover:underline text-sm">
                Neuen Link anfordern
              </Link>
            </div>
          ) : done ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-3">
                <span>✅</span>
                <span>Dein Passwort wurde geändert. Du kannst dich jetzt anmelden.</span>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}
              >
                Zur Anmeldung
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Neues Passwort</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  autoComplete="new-password"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Passwort bestätigen</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  className={inputCls}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg mt-2"
                style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}
              >
                {loading ? 'Speichern…' : 'Passwort speichern'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
