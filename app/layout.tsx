import type { Metadata } from 'next';
import './globals.css';

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
