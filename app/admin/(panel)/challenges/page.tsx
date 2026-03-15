'use client';

import { useEffect, useState } from 'react';

interface Challenge {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  submissionCount: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '' });

  const load = () => {
    setLoading(true);
    fetch('/api/admin/challenges').then((r) => r.json()).then((d) => {
      setChallenges(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await fetch('/api/admin/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate:   new Date(form.endDate).toISOString(),
      }),
    });
    if (res.ok) {
      setForm({ title: '', description: '', startDate: '', endDate: '' });
      setShowForm(false);
      load();
    } else {
      const d = await res.json();
      setError(d.error ?? 'Fehler beim Erstellen');
    }
    setSaving(false);
  };

  const toggleActive = async (c: Challenge) => {
    await fetch(`/api/admin/challenges/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    load();
  };

  const deleteChallenge = async (id: number) => {
    if (!confirm('Challenge und alle Einreichungen löschen?')) return;
    await fetch(`/api/admin/challenges/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">🏆 Challenges</h1>
          <p className="text-slate-400 text-sm mt-1">Weekly Challenges erstellen und verwalten.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#059669,#0891b2)' }}>
          + Neue Challenge
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-slate-800">Neue Challenge erstellen</h2>
          <div className="grid grid-cols-1 gap-3">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Titel (z.B. «Schadensmeldungen zusammenfassen»)"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Beschreibung der Aufgabe…" rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Startdatum</label>
                <input required type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Enddatum</label>
                <input required type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
            </div>
          </div>
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-2 text-sm text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50">
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#059669,#0891b2)' }}>
              {saving ? 'Wird erstellt…' : 'Challenge erstellen'}
            </button>
          </div>
        </form>
      )}

      {/* Challenge list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-slate-200 rounded-2xl h-24 animate-pulse" />)}
        </div>
      ) : challenges.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-3xl mb-2">🏆</p>
          <p className="text-slate-500 font-semibold">Noch keine Challenges</p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => (
            <div key={c.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${c.isActive ? 'border-emerald-200' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 truncate">{c.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                      c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {c.isActive ? '● Aktiv' : '○ Inaktiv'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">{c.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    <span>📅 {formatDate(c.startDate)} – {formatDate(c.endDate)}</span>
                    <span>📨 {c.submissionCount} Einreichungen</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      c.isActive
                        ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}>
                    {c.isActive ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                  <button onClick={() => deleteChallenge(c.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-all">
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
