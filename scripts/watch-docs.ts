/**
 * PromptArena – Dokumentations-Watcher
 *
 * Beobachtet Quelldateien und regeneriert die Dokumentation automatisch,
 * sobald sich etwas ändert. Nutzt Node.js built-in fs.watch – keine
 * zusätzlichen Abhängigkeiten nötig.
 *
 * Aufruf:
 *   npm run docs:watch
 *
 * Beobachtete Pfade:
 *   - app/api/** (API-Routen)
 *   - app/**/page.tsx (Seiten)
 *   - components/** (Komponenten)
 *   - lib/** (Hilfsbibliotheken)
 *   - prisma/schema.prisma (Datenbankschema)
 *   - package.json (Abhängigkeiten + Scripts)
 */

import fs   from 'fs';
import path from 'path';
import { generateAll } from './generate-docs';

const ROOT = path.resolve(__dirname, '..');

// ─── Pfade, die beobachtet werden ────────────────────────────────────────────

const WATCH_DIRS = [
  path.join(ROOT, 'app'),
  path.join(ROOT, 'components'),
  path.join(ROOT, 'lib'),
  path.join(ROOT, 'prisma'),
];

const WATCH_FILES = [
  path.join(ROOT, 'package.json'),
];

// ─── Debounce ─────────────────────────────────────────────────────────────────

/**
 * Verzögert die Ausführung von fn um delayMs Millisekunden.
 * Mehrfache Aufrufe innerhalb des Fensters starten den Timer neu –
 * so wird bei schnellen Speichervorgängen nur einmal generiert.
 */
function debounce(fn: () => void, delayMs: number): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, delayMs);
  };
}

// ─── Generator mit Fehlerbehandlung ───────────────────────────────────────────

const regenerate = debounce(() => {
  console.log('\n🔄 Änderung erkannt – regeneriere Doku...');
  try {
    generateAll();
  } catch (err) {
    console.error('❌ Fehler beim Generieren:', err);
  }
}, 500);

// ─── Watcher einrichten ───────────────────────────────────────────────────────

/** Beobachtet ein Verzeichnis rekursiv. */
function watchDir(dir: string): void {
  if (!fs.existsSync(dir)) return;
  try {
    fs.watch(dir, { recursive: true }, (_event, filename) => {
      // Ignoriere Änderungen in docs/ selbst (Endlosschleife)
      if (filename?.includes('docs')) return;
      // Nur relevante Dateitypen beachten
      if (!filename?.match(/\.(ts|tsx|prisma|json|mjs)$/)) return;
      regenerate();
    });
    console.log(`  👁  ${path.relative(ROOT, dir)}/`);
  } catch (err) {
    console.warn(`  ⚠  Konnte ${dir} nicht beobachten:`, err);
  }
}

/** Beobachtet eine einzelne Datei. */
function watchFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  try {
    fs.watch(filePath, regenerate);
    console.log(`  👁  ${path.relative(ROOT, filePath)}`);
  } catch (err) {
    console.warn(`  ⚠  Konnte ${filePath} nicht beobachten:`, err);
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────

console.log('🚀 PromptArena Dokumentations-Watcher gestartet');
console.log('   Beobachte Änderungen in:');

for (const dir of WATCH_DIRS) watchDir(dir);
for (const file of WATCH_FILES) watchFile(file);

// Einmalige Generierung beim Start
console.log('\n');
generateAll();

console.log('\n⌛ Warte auf Änderungen… (Ctrl+C zum Beenden)\n');
