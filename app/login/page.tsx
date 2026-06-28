'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { USER_ID_KEY } from '@/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]     = useState({ name: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    });

    if (res.ok) {
      const data = await res.json() as { userId: number; name: string; avatarColor: string };
      localStorage.setItem(USER_ID_KEY,                String(data.userId));
      localStorage.setItem('promptarena_user_name',    data.name);
      localStorage.setItem('promptarena_user_color',   data.avatarColor);
      router.push('/dashboard');
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? 'Login fehlgeschlagen');
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F4C35 100%)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-xl mx-auto mb-3"
            style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}
          >
            PA
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Prompt<span className="text-emerald-400">Arena</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Melde dich an</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Benutzername
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Dein Name"
                autoFocus
                autoComplete="username"
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Passwort
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                autoComplete="current-password"
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
              disabled={loading || !form.name || !form.password}
              className="w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg mt-2"
              style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}
            >
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Noch kein Konto?{' '}
            <Link href="/register" className="text-emerald-600 font-semibold hover:underline">
              Registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
