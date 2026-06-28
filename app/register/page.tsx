'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DEPARTMENTS } from '@/lib/constants';
import { USER_ID_KEY } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name:       '',
    department: '',
    customDept: '',
    password:   '',
    confirm:    '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const department = form.department === '__other__' ? form.customDept.trim() : form.department;
  const passwordMatch = form.password === form.confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordMatch) { setError('Passwörter stimmen nicht überein.'); return; }
    if (form.password.length < 8) { setError('Passwort muss mindestens 8 Zeichen lang sein.'); return; }
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:       form.name.trim(),
        department: form.department === '__other__' ? form.customDept.trim() : form.department,
        password:   form.password,
      }),
    });

    if (res.ok) {
      const data = await res.json() as { userId: number; name: string; avatarColor: string };
      localStorage.setItem(USER_ID_KEY,              String(data.userId));
      localStorage.setItem('promptarena_user_name',  data.name);
      localStorage.setItem('promptarena_user_color', data.avatarColor);
      router.push('/dashboard');
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? 'Registrierung fehlgeschlagen');
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white transition-all';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-8"
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
          <p className="text-slate-400 text-sm mt-1">Konto erstellen</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Vor- und Nachname"
                autoFocus
                autoComplete="name"
                required
                className={inputCls}
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Abteilung
              </label>
              <select
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                required
                className={`${inputCls} bg-white`}
              >
                <option value="">Abteilung wählen…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value="__other__">Andere…</option>
              </select>
              {form.department === '__other__' && (
                <input
                  type="text"
                  value={form.customDept}
                  onChange={(e) => setForm((f) => ({ ...f, customDept: e.target.value }))}
                  placeholder="Abteilungsname eingeben"
                  required
                  autoFocus
                  className={`${inputCls} mt-2`}
                />
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Passwort <span className="text-slate-400 font-normal text-xs">(min. 8 Zeichen)</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                className={inputCls}
              />
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                className={`${inputCls} ${form.confirm && !passwordMatch ? 'border-red-300 ring-2 ring-red-200' : ''}`}
              />
              {form.confirm && !passwordMatch && (
                <p className="text-xs text-red-500 mt-1">Passwörter stimmen nicht überein</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !form.name || !department || !form.password || !form.confirm || !passwordMatch}
              className="w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg mt-2"
              style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}
            >
              {loading ? 'Registrieren…' : 'Konto erstellen'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Schon ein Konto?{' '}
            <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
