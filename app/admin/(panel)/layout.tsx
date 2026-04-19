'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const adminLinks = [
  { href: '/admin',            label: 'Übersicht',   icon: '📊' },
  { href: '/admin/challenges', label: 'Challenges',  icon: '🏆' },
  { href: '/admin/users',      label: 'Nutzer',      icon: '👥' },
  { href: '/admin/prompts',    label: 'Prompts',     icon: '📝' },
];

// @spec AC-07-008
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }
  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
          <div className="px-4 py-3 border-b border-slate-100" style={{ background: 'linear-gradient(135deg,#0F172A,#1E293B)' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Admin</p>
            <p className="text-white font-extrabold text-sm mt-0.5">Verwaltung</p>
          </div>
          <nav className="p-2 space-y-0.5">
            {adminLinks.map(({ href, label, icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}>
                  <span className="text-base">{icon}</span>
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-slate-100 space-y-1">
            <Link href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
              ← Zurück zur App
            </Link>
            <button onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-600 hover:bg-red-50 transition-all">
              🔓 Abmelden
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
