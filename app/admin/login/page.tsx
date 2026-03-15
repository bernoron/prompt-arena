'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? 'Login fehlgeschlagen');
      }
    } catch {
      setError('Netzwerkfehler – bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
               style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin-Bereich</h1>
          <p className="text-slate-400 text-sm mt-1">PromptArena Verwaltung</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-2xl p-8 space-y-5">
          <div>
            <label htmlFor="password"
                   className="block text-sm font-semibold text-slate-700 mb-2">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin-Passwort eingeben…"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                         placeholder:text-slate-400 transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60
                       text-white font-bold py-3 rounded-xl transition text-sm tracking-wide">
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Kein Zugang?{' '}
          <a href="/dashboard" className="text-emerald-400 hover:underline">
            Zurück zur App
          </a>
        </p>
      </div>
    </div>
  );
}
