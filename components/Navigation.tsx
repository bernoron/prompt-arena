'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';

const navLinks = [
  { href: '/dashboard',  label: 'Dashboard',  icon: '⚡'  },
  { href: '/learn',      label: 'Lernen',     icon: '🧠'  },
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
        </nav>

        {/* User Menu */}
        <div className="flex items-center">
          <UserMenu dark />
        </div>
      </div>

      {/* Mobile nav – 4-column grid, all items visible without scrolling */}
      <nav className="grid grid-cols-4 md:hidden border-t border-white/10">
        {navLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                active ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400'
              }`}
            >
              <span className="text-base leading-none">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
        <Link
          href="/submit"
          className={`flex flex-col items-center gap-0.5 py-2 text-xs font-semibold transition-colors ${
            pathname === '/submit' ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-400'
          }`}
        >
          <span className="text-base leading-none">✨</span>
          <span>Einreichen</span>
        </Link>
      </nav>
    </header>
  );
}
