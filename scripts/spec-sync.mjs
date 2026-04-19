#!/usr/bin/env node
/**
 * spec-sync.mjs – Bidirektionaler Spec↔Code Sync für PromptArena
 *
 * Wie es funktioniert:
 *   1. Spec → Code:  Scannt specs/features/*.md nach Akzeptanzkriterien (AC-XX-NNN)
 *   2. Code → Spec:  Scannt alle TS/TSX-Dateien nach @spec AC-XX-NNN Kommentaren
 *   3. Vergleicht:   Zeigt welche ACs implementiert sind und welche fehlen
 *   4. Aktualisiert: Mit --fix wird tasks.md mit dem aktuellen Status aktualisiert
 *
 * Aufruf:
 *   node scripts/spec-sync.mjs           # Status anzeigen
 *   node scripts/spec-sync.mjs --fix     # tasks.md aktualisieren
 *   node scripts/spec-sync.mjs --watch   # bei Dateiänderungen automatisch ausführen
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = join(__dirname, '..');
const SPECS_DIR = join(ROOT, 'specs', 'features');
const CODE_DIRS = ['app', 'lib', 'components', 'prisma', 'middleware.ts'];

// ─── ANSI-Farben ─────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

// ─── Schritt 1: Alle ACs aus Specs lesen ─────────────────────────────────────
function readSpecACs() {
  const acs = new Map(); // AC-ID → { file, description, checked }

  const files = readdirSync(SPECS_DIR)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'));

  for (const file of files) {
    const content = readFileSync(join(SPECS_DIR, file), 'utf8');
    const lines   = content.split('\n');

    for (const line of lines) {
      // Matcht: - [x] **AC-05-001**: Beschreibung
      //   oder: - [ ] **AC-05-001**: Beschreibung
      const match = line.match(/^- \[([x ])\] \*\*(AC-\d{2}-\d{3})\*\*:\s*(.+)/);
      if (match) {
        acs.set(match[2], {
          file:        file,
          description: match[3].trim(),
          specChecked: match[1] === 'x',
        });
      }
    }
  }

  return acs;
}

// ─── Schritt 2: @spec-Annotationen im Code suchen ────────────────────────────
function readCodeAnnotations() {
  const found = new Map(); // AC-ID → [filePaths]

  function scanDir(dir) {
    let entries;
    try { entries = readdirSync(dir); } catch { return; }

    for (const entry of entries) {
      if (['node_modules', '.next', '.git', 'generated'].includes(entry)) continue;
      const full = join(dir, entry);
      const stat = statSync(full);

      if (stat.isDirectory()) {
        scanDir(full);
      } else if (['.ts', '.tsx', '.mjs'].includes(extname(entry))) {
        const content = readFileSync(full, 'utf8');
        // Matcht: // @spec AC-05-001  oder  // @spec AC-05-001, AC-05-002
        const matches = [...content.matchAll(/@spec\s+(AC-\d{2}-\d{3}(?:,\s*AC-\d{2}-\d{3})*)/g)];
        for (const m of matches) {
          const ids = m[1].split(',').map(s => s.trim());
          for (const id of ids) {
            if (!found.has(id)) found.set(id, []);
            found.get(id).push(relative(ROOT, full));
          }
        }
      }
    }
  }

  for (const dir of CODE_DIRS) {
    const full = join(ROOT, dir);
    try {
      if (statSync(full).isDirectory()) scanDir(full);
      else {
        // Einzelne Datei (middleware.ts)
        const content = readFileSync(full, 'utf8');
        const matches = [...content.matchAll(/@spec\s+(AC-\d{2}-\d{3}(?:,\s*AC-\d{2}-\d{3})*)/g)];
        for (const m of matches) {
          const ids = m[1].split(',').map(s => s.trim());
          for (const id of ids) {
            if (!found.has(id)) found.set(id, []);
            found.get(id).push(relative(ROOT, full));
          }
        }
      }
    } catch { /* skip */ }
  }

  return found;
}

// ─── Schritt 3: Status ausgeben ───────────────────────────────────────────────
function printStatus(specACs, codeAnnotations) {
  const implemented   = [];
  const notAnnotated  = [];
  const orphaned      = [];

  for (const [id, info] of specACs) {
    if (codeAnnotations.has(id)) {
      implemented.push({ id, ...info, files: codeAnnotations.get(id) });
    } else {
      notAnnotated.push({ id, ...info });
    }
  }

  for (const [id, files] of codeAnnotations) {
    if (!specACs.has(id)) {
      orphaned.push({ id, files });
    }
  }

  console.log(`\n${BOLD}${CYAN}═══ PromptArena Spec Sync ═══${RESET}\n`);

  // Implementiert
  if (implemented.length > 0) {
    console.log(`${GREEN}${BOLD}✓ Implementiert (${implemented.length})${RESET}`);
    for (const ac of implemented) {
      console.log(`  ${GREEN}✓${RESET} ${BOLD}${ac.id}${RESET} ${ac.description}`);
      for (const f of ac.files) console.log(`      ${CYAN}→ ${f}${RESET}`);
    }
    console.log();
  }

  // Spec sagt implementiert aber kein @spec-Kommentar
  if (notAnnotated.length > 0) {
    const specDone     = notAnnotated.filter(a => a.specChecked);
    const specNotDone  = notAnnotated.filter(a => !a.specChecked);

    if (specDone.length > 0) {
      console.log(`${YELLOW}${BOLD}⚠ Spec markiert als erledigt, aber kein @spec-Kommentar (${specDone.length})${RESET}`);
      for (const ac of specDone) {
        console.log(`  ${YELLOW}⚠${RESET} ${BOLD}${ac.id}${RESET} ${ac.description} ${YELLOW}[${ac.file}]${RESET}`);
      }
      console.log();
    }

    if (specNotDone.length > 0) {
      console.log(`${RED}${BOLD}✗ Nicht implementiert (${specNotDone.length})${RESET}`);
      for (const ac of specNotDone) {
        console.log(`  ${RED}✗${RESET} ${BOLD}${ac.id}${RESET} ${ac.description} ${RED}[${ac.file}]${RESET}`);
      }
      console.log();
    }
  }

  // @spec-Kommentare ohne Spec-Eintrag
  if (orphaned.length > 0) {
    console.log(`${YELLOW}${BOLD}? @spec-Annotation ohne Spec-Eintrag (${orphaned.length})${RESET}`);
    for (const ac of orphaned) {
      console.log(`  ${YELLOW}?${RESET} ${BOLD}${ac.id}${RESET} → ${ac.files.join(', ')}`);
    }
    console.log();
  }

  // Zusammenfassung
  const total   = specACs.size;
  const done    = implemented.length + notAnnotated.filter(a => a.specChecked).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const bar     = '█'.repeat(Math.round(percent / 5)) + '░'.repeat(20 - Math.round(percent / 5));

  console.log(`${BOLD}Fortschritt: ${bar} ${percent}% (${done}/${total} ACs)${RESET}\n`);

  return { implemented, notAnnotated, orphaned };
}

// ─── Schritt 4: tasks.md aktualisieren ───────────────────────────────────────
function updateTasks(specACs, codeAnnotations) {
  const tasksPath = join(ROOT, 'specs', 'tasks.md');
  let content = readFileSync(tasksPath, 'utf8');

  let updates = 0;
  for (const [id] of specACs) {
    const hasCode = codeAnnotations.has(id);

    // [x] setzen wenn @spec gefunden
    const donePattern   = new RegExp(`(- )\\[ \\]( \\*\\*${id}\\*\\*)`, 'g');
    // [ ] setzen wenn @spec NICHT gefunden (und Spec sagt done)
    const undonePattern = new RegExp(`(- )\\[x\\]( \\*\\*${id}\\*\\*)`, 'g');

    if (hasCode && donePattern.test(content)) {
      content = content.replace(donePattern, '$1[x]$2');
      updates++;
    }
    // Kein automatisches Rücksetzen — manuell entscheiden
  }

  if (updates > 0) {
    writeFileSync(tasksPath, content, 'utf8');
    console.log(`${GREEN}✓ tasks.md aktualisiert (${updates} Tasks auf erledigt gesetzt)${RESET}`);
  } else {
    console.log(`${CYAN}ℹ tasks.md bereits aktuell${RESET}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const shouldFix  = args.includes('--fix');
const shouldWatch = args.includes('--watch');

function run() {
  const specACs         = readSpecACs();
  const codeAnnotations = readCodeAnnotations();
  const { notAnnotated } = printStatus(specACs, codeAnnotations);

  if (shouldFix) {
    updateTasks(specACs, codeAnnotations);
  }

  // Exit-Code 1 wenn offene ACs existieren (nützlich für CI)
  const openACs = notAnnotated.filter(a => !a.specChecked);
  if (!shouldWatch) process.exit(openACs.length > 0 ? 1 : 0);
}

if (shouldWatch) {
  console.log(`${CYAN}Watching for changes... (Ctrl+C to stop)${RESET}`);
  run();

  // Einfaches Polling alle 3 Sekunden
  setInterval(run, 3000);
} else {
  run();
}
