'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserPicker from './UserPicker';

const navLinks = [
  { href: '/dashboard',  label: 'Dashboard',  icon: '⚡'  },
  { href: '/library',    label: 'Bibliothek', icon: '📚'  },
  { href: '/favorites',  label: 'Favoriten',  icon: '⭐'  },
  { href: '/leaderboard',label: 'Rangliste',  icon: '🏆'  },
  { href: '/profile',    label: 'Profil',     icon: '👤'  },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: '#0F172A' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white text-sm font-bold shadow-lg group-hover:scale-105 transition-transform">
            PA
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight">
            Prompt<span className="text-emerald-400">Arena</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/submit"
            className="ml-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}
          >
            + Einreichen
          </Link>
          <Link
            href="/admin"
            className={`ml-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              pathname.startsWith('/admin')
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-slate-500 hover:text-amber-400 hover:bg-white/10'
            }`}
            title="Admin"
          >
            ⚙️
          </Link>
        </nav>

        {/* User Picker */}
        <div className="flex items-center">
          <UserPicker dark />
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex md:hidden border-t border-white/10 overflow-x-auto">
        {navLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-shrink-0 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                active
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400'
              }`}
            >
              <span className="mr-1">{link.icon}</span>{link.label}
            </Link>
          );
        })}
        <Link
          href="/submit"
          className="flex-shrink-0 px-4 py-3 text-xs font-semibold border-b-2 border-transparent text-emerald-400"
        >
          + Einreichen
        </Link>
        <Link
          href="/admin"
          className={`flex-shrink-0 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
            pathname.startsWith('/admin')
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-500'
          }`}
          title="Admin"
        >
          ⚙️
        </Link>
      </nav>
    </header>
  );
}
