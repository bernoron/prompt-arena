'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  department: string;
  avatarColor: string;
  totalPoints: number;
  level: string;
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editId, setEditId]     = useState<number | null>(null);
  const [editPts, setEditPts]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/users').then((r) => r.json()).then((d) => {
      setUsers(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const savePoints = async (id: number) => {
    const pts = parseInt(editPts, 10);
    if (isNaN(pts) || pts < 0) return;
    setSaving(true);
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalPoints: pts }),
    });
    setSaving(false);
    setEditId(null);
    load();
  };

  const deleteUser = async (id: number, name: string) => {
    if (!confirm(`Nutzer «${name}» und alle Daten dauerhaft löschen?`)) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    load();
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">👥 Nutzer</h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} registrierte Nutzer.</p>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen…"
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 w-48" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 grid grid-cols-12 gap-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span className="col-span-4">Name</span>
          <span className="col-span-2">Abteilung</span>
          <span className="col-span-2">Level</span>
          <span className="col-span-2 text-right">Punkte</span>
          <span className="col-span-2 text-right">Aktionen</span>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">Keine Nutzer gefunden.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((u) => (
              <div key={u.id} className="px-5 py-3 grid grid-cols-12 gap-3 items-center hover:bg-slate-50 transition-colors">
                {/* Name */}
                <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: u.avatarColor }}>
                    {u.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                    <p className="text-xs text-slate-400">#{u.id}</p>
                  </div>
                </div>

                {/* Dept */}
                <span className="col-span-2 text-sm text-slate-500 truncate">{u.department}</span>

                {/* Level */}
                <span className="col-span-2 text-xs font-semibold text-slate-600 truncate">{u.level}</span>

                {/* Points */}
                <div className="col-span-2 text-right">
                  {editId === u.id ? (
                    <input autoFocus type="number" min="0" value={editPts}
                      onChange={(e) => setEditPts(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') savePoints(u.id); if (e.key === 'Escape') setEditId(null); }}
                      className="w-20 px-2 py-1 text-sm text-right rounded-lg border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  ) : (
                    <span className="text-sm font-bold text-emerald-600">{u.totalPoints}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-1.5">
                  {editId === u.id ? (
                    <>
                      <button onClick={() => savePoints(u.id)} disabled={saving}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                        {saving ? '…' : 'OK'}
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="px-2.5 py-1 rounded-lg text-xs border border-slate-200 text-slate-500 hover:bg-slate-50">
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditId(u.id); setEditPts(String(u.totalPoints)); }}
                        className="px-2.5 py-1 rounded-lg text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                        title="Punkte bearbeiten">
                        ✏️
                      </button>
                      <button onClick={() => deleteUser(u.id, u.name)}
                        className="px-2.5 py-1 rounded-lg text-xs border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                        title="Nutzer löschen">
                        🗑
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
