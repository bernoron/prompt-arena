'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { USER_ID_KEY } from '@/lib/constants';

interface UserData {
  id: number;
  name: string;
  avatarColor: string;
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function UserMenu({ dark = false }: { dark?: boolean }) {
  const [user, setUser]   = useState<UserData | null>(null);
  const [open, setOpen]   = useState(false);
  const menuRef           = useRef<HTMLDivElement>(null);
  const router            = useRouter();

  useEffect(() => {
    // Read from localStorage first (set at login – no API call needed)
    const id    = localStorage.getItem(USER_ID_KEY);
    const name  = localStorage.getItem('promptarena_user_name');
    const color = localStorage.getItem('promptarena_user_color');

    if (id && name && color) {
      setUser({ id: parseInt(id, 10), name, avatarColor: color });
      return;
    }

    // Fallback: fetch session from server (handles hard-refresh without localStorage)
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: { user: UserData | null }) => {
        if (data.user) {
          setUser(data.user);
          localStorage.setItem(USER_ID_KEY,              String(data.user.id));
          localStorage.setItem('promptarena_user_name',  data.user.name);
          localStorage.setItem('promptarena_user_color', data.user.avatarColor);
        }
      })
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    // Clear all promptarena keys from localStorage
    Object.keys(localStorage)
      .filter((k) => k.startsWith('promptarena_'))
      .forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem(USER_ID_KEY);
    router.push('/login');
  };

  if (!user) {
    return (
      <div className={`w-28 h-9 rounded-xl animate-pulse ${dark ? 'bg-white/10' : 'bg-gray-100'}`} />
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border ${
          dark
            ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
            : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
        }`}
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
          style={{ backgroundColor: user.avatarColor }}
        >
          {initials(user.name)}
        </span>
        <span className={`text-sm font-medium max-w-24 truncate ${dark ? 'text-white' : 'text-gray-700'}`}>
          {user.name.split(' ')[0]}
        </span>
        <span className={`text-xs ${dark ? 'text-white/50' : 'text-gray-400'}`}>▼</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden py-1">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
          </div>

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="text-base">👤</span>
            Mein Profil
          </Link>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="text-base">🚪</span>
              Abmelden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
