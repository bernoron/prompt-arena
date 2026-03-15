'use client';

import { useEffect, useState } from 'react';
import { USER_ID_KEY, DEPARTMENTS } from '@/lib/constants';

interface User {
  id: number;
  name: string;
  department: string;
  avatarColor: string;
  totalPoints: number;
  level: string;
}

function RegisterForm({ onCreated, onCancel }: {
  onCreated: (user: User) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [customDept, setCustomDept] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dept = department === '__other__' ? customDept : department;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dept.trim()) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), department: dept.trim() }),
    });
    if (res.ok) {
      const user: User = await res.json();
      onCreated(user);
    } else {
      setError('Registrierung fehlgeschlagen.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Neu registrieren</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Vor- und Nachname"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>
      <div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        >
          <option value="">Abteilung wählen…</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          <option value="__other__">Andere…</option>
        </select>
        {department === '__other__' && (
          <input
            autoFocus
            value={customDept}
            onChange={(e) => setCustomDept(e.target.value)}
            placeholder="Abteilungsname eingeben"
            className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          Abbrechen
        </button>
        <button type="submit" disabled={!name.trim() || !dept.trim() || loading}
          className="flex-1 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40">
          {loading ? '…' : 'Registrieren'}
        </button>
      </div>
    </form>
  );
}

export default function UserPicker({ dark = false }: { dark?: boolean }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const loadUsers = (selectId?: number) => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data: User[]) => {
        setUsers(data);
        const saved = selectId ?? (localStorage.getItem(USER_ID_KEY) ? parseInt(localStorage.getItem(USER_ID_KEY)!) : null);
        const found = saved ? data.find((u) => u.id === saved) : null;
        const selected = found ?? data[0] ?? null;
        if (selected) {
          setCurrentUser(selected);
          localStorage.setItem(USER_ID_KEY, String(selected.id));
        }
      });
  };

  useEffect(() => { loadUsers(); }, []);

  const select = (user: User) => {
    localStorage.setItem(USER_ID_KEY, String(user.id));
    setCurrentUser(user);
    setOpen(false);
    setShowRegister(false);
    window.dispatchEvent(new CustomEvent('userChanged', { detail: user }));
  };

  const handleCreated = (user: User) => {
    setOpen(false);
    setShowRegister(false);
    loadUsers(user.id);
    window.dispatchEvent(new CustomEvent('userChanged', { detail: user }));
  };

  if (!currentUser) return <div className={`w-32 h-9 rounded-xl animate-pulse ${dark ? 'bg-white/10' : 'bg-gray-100'}`} />;

  return (
    <div className="relative">
      <button
        onClick={() => { const opening = !open; setOpen(opening); setShowRegister(false); if (opening) loadUsers(); }}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border ${
          dark
            ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
            : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
        }`}
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
          style={{ backgroundColor: currentUser.avatarColor }}
        >
          {currentUser.name.split(' ').map((n) => n[0]).join('')}
        </span>
        <span className={`text-sm font-medium max-w-24 truncate ${dark ? 'text-white' : 'text-gray-700'}`}>
          {currentUser.name.split(' ')[0]}
        </span>
        <span className={`text-xs ${dark ? 'text-white/50' : 'text-gray-400'}`}>▼</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {showRegister ? (
            <RegisterForm
              onCreated={handleCreated}
              onCancel={() => setShowRegister(false)}
            />
          ) : (
            <div className="p-2">
              <p className="text-xs text-gray-400 px-2 py-1 font-medium uppercase tracking-wide">
                Nutzer wechseln
              </p>
              <div className="max-h-64 overflow-y-auto">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => select(user)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                      currentUser.id === user.id ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: user.avatarColor }}
                    >
                      {user.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.department} · {user.totalPoints} Pts</p>
                    </div>
                    {currentUser.id === user.id && <span className="ml-auto text-emerald-600 text-sm">✓</span>}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => setShowRegister(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-emerald-700 font-medium hover:bg-emerald-50 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg">+</span>
                  Neu registrieren
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setShowRegister(false); }} />}
    </div>
  );
}
