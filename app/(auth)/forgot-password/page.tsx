'use client';

import { useState } from 'react';
import Link from 'next/link';

// @spec AC-01-018
export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [message, setMessage] = useState('');
  const [devUrl, setDevUrl]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/auth/password-reset/request', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });

    const data = await res.json() as { message?: string; devResetUrl?: string };
    // The response is intentionally neutral — always show the confirmation,
    // never reveal whether the address is registered.
    setMessage(data.message ?? 'Falls ein Konto existiert, haben wir eine E-Mail gesendet.');
    setDevUrl(data.devResetUrl ?? null);
    setSent(true);
    setLoading(false);
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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Passwort zurücksetzen
          </h1>
          <p className="text-slate-400 text-sm mt-1">Wir senden dir einen Link per E-Mail</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {sent ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-3">
                <span>✅</span>
                <span>{message}</span>
              </div>
              {devUrl && (
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 break-all">
                  <p className="font-semibold text-slate-600 mb-1">Dev-Hinweis (nicht in Produktion):</p>
                  <a href={devUrl} className="text-emerald-600 underline">{devUrl}</a>
                </div>
              )}
              <Link
                href="/login"
                className="block text-center w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}
              >
                Zurück zur Anmeldung
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-Mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.ch"
                  autoFocus
                  autoComplete="email"
                  required
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg mt-2"
                style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}
              >
                {loading ? 'Senden…' : 'Link anfordern'}
              </button>
              <p className="text-center text-sm text-slate-500">
                <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
                  Zurück zur Anmeldung
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
