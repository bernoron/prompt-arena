import type { Metadata } from 'next';
import './globals.css';

// The per-request CSP nonce (set in middleware.ts) cannot be baked into a
// statically prerendered page, so every route must render dynamically for
// Next.js to stamp the nonce onto its inline scripts. Forcing it at the root
// layout cascades to all segments. This app is auth-gated and almost entirely
// dynamic already, so the lost static shells cost effectively nothing.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'PromptArena – KI-Prompts entdecken & teilen',
  description: 'Die gamifizierte Prompt-Bibliothek zum Entdecken, Teilen und Bewerten von KI-Prompts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
