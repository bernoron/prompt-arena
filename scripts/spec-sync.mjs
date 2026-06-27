#!/usr/bin/env node
/**
 * spec-sync.mjs – Bidirektionaler Spec↔Code Sync für PromptArena
 *
 * Wie es funktioniert:
 *   1. Spec → Code:  Scannt specs/technical/*.md nach Akzeptanzkriterien (AC-XX-NNN)
 *   2. Code → Spec:  Scannt alle TS/TSX-Dateien nach @spec AC-XX-NNN Kommentaren
 *   3. Vergleicht:   Zeigt welche ACs implementiert sind und welche fehlen
 *   4. Aktualisiert: Mit --fix werden specs/technical/*.md und specs/tasks.md aktualisiert
 *
 * Aufruf:
 *   node scripts/spec-sync.mjs           # Status anzeigen
 *   node scripts/spec-sync.mjs --fix     # Specs + tasks.md aktualisieren
 *   node scripts/spec-sync.mjs --watch   # bei Dateiänderungen automatisch ausführen
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT       = join(__dirname, '..');
const SPECS_DIR  = join(ROOT, 'specs', 'technical');
const TASKS_FILE = join(ROOT, 'specs', 'tasks.md');
const CODE_DIRS  = ['app', 'lib', 'components', 'prisma', 'middleware.ts'];

// ─── ANSI-Farben ─────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

// ─── Schritt 1: Alle ACs aus specs/technical/*.md lesen ──────────────────────
function readSpecACs() {
  const acs = new Map(); // AC-ID → { file, description, checked }

  let files;
  try {
    files = readdirSync(SPECS_DIR).filter(f => f.endsWith('.md') && !f.startsWith('_'));
  } catch {
    console.error(`${RED}specs/technical/ nicht gefunden${RESET}`);
    return acs;
  }

  for (const file of files) {
    const content = readFileSync(join(SPECS_DIR, file), 'utf8');
    for (const line of content.split('\n')) {
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
      if (statSync(full).isDirectory()) {
        scanDir(full);
      } else {
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
  const implemented  = [];
  const notAnnotated = [];
  const orphaned     = [];

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

  if (implemented.length > 0) {
    console.log(`${GREEN}${BOLD}✓ Implementiert (${implemented.length})${RESET}`);
    for (const ac of implemented) {
      console.log(`  ${GREEN}✓${RESET} ${BOLD}${ac.id}${RESET} ${ac.description}`);
      for (const f of ac.files) console.log(`      ${CYAN}→ ${f}${RESET}`);
    }
    console.log();
  }

  if (notAnnotated.length > 0) {
    const specDone    = notAnnotated.filter(a => a.specChecked);
    const specNotDone = notAnnotated.filter(a => !a.specChecked);

    if (specDone.length > 0) {
      console.log(`${YELLOW}${BOLD}⚠ Spec erledigt, aber kein @spec-Kommentar (${specDone.length})${RESET}`);
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

  if (orphaned.length > 0) {
    console.log(`${YELLOW}${BOLD}? @spec ohne Spec-Eintrag (${orphaned.length})${RESET}`);
    for (const ac of orphaned) {
      console.log(`  ${YELLOW}?${RESET} ${BOLD}${ac.id}${RESET} → ${ac.files.join(', ')}`);
    }
    console.log();
  }

  const total   = specACs.size;
  const done    = implemented.length + notAnnotated.filter(a => a.specChecked).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const bar     = '█'.repeat(Math.round(percent / 5)) + '░'.repeat(20 - Math.round(percent / 5));
  console.log(`${BOLD}Fortschritt: ${bar} ${percent}% (${done}/${total} ACs)${RESET}\n`);

  return { implemented, notAnnotated, orphaned };
}

// ─── Schritt 4: specs/technical/*.md Checkboxen aktualisieren ────────────────
function updateTechnicalSpecs(codeAnnotations) {
  let files;
  try {
    files = readdirSync(SPECS_DIR).filter(f => f.endsWith('.md') && !f.startsWith('_'));
  } catch { return 0; }

  let totalUpdates = 0;

  for (const file of files) {
    const filePath = join(SPECS_DIR, file);
    const original = readFileSync(filePath, 'utf8');
    let updated = original;
    let fileUpdates = 0;

    // Setze [x] für jeden AC der im Code annotiert ist
    updated = updated.replace(
      /^(- )\[ \]( \*\*AC-\d{2}-\d{3}\*\*)/gm,
      (match, prefix, acPart) => {
        const idMatch = acPart.match(/AC-\d{2}-\d{3}/);
        if (idMatch && codeAnnotations.has(idMatch[0])) {
          fileUpdates++;
          return `${prefix}[x]${acPart}`;
        }
        return match;
      },
    );

    if (fileUpdates > 0) {
      writeFileSync(filePath, updated, 'utf8');
      console.log(`${GREEN}✓ specs/technical/${file} – ${fileUpdates} AC(s) abgehakt${RESET}`);
      totalUpdates += fileUpdates;
    }
  }

  return totalUpdates;
}

// ─── Schritt 5: specs/tasks.md aktualisieren ─────────────────────────────────
function updateTasksMd(codeAnnotations) {
  let content;
  try { content = readFileSync(TASKS_FILE, 'utf8'); } catch { return 0; }

  let updates = 0;

  // Format in tasks.md: - [x] AC-02-001: Beschreibung  (ohne **)
  content = content.replace(
    /^(- )\[ \]([ \t]+(?:AC-\d{2}-\d{3}|\*\*AC-\d{2}-\d{3}\*\*))/gm,
    (match, prefix, rest) => {
      const idMatch = rest.match(/AC-\d{2}-\d{3}/);
      if (idMatch && codeAnnotations.has(idMatch[0])) {
        updates++;
        return `${prefix}[x]${rest}`;
      }
      return match;
    },
  );

  // Auch Open-Improvements-Section updaten (Format: - [ ] PERF-002 etc.)
  // Diese werden NICHT automatisch abgehakt – nur AC-Einträge

  if (updates > 0) {
    writeFileSync(TASKS_FILE, content, 'utf8');
    console.log(`${GREEN}✓ specs/tasks.md – ${updates} Task(s) auf erledigt gesetzt${RESET}`);
  } else {
    console.log(`${CYAN}ℹ specs/tasks.md bereits aktuell${RESET}`);
  }

  return updates;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const args        = process.argv.slice(2);
const shouldFix   = args.includes('--fix');
const shouldWatch = args.includes('--watch');

function run() {
  const specACs         = readSpecACs();
  const codeAnnotations = readCodeAnnotations();
  const { notAnnotated } = printStatus(specACs, codeAnnotations);

  if (shouldFix) {
    updateTechnicalSpecs(codeAnnotations);
    updateTasksMd(codeAnnotations);
  }

  const openACs = notAnnotated.filter(a => !a.specChecked);
  if (!shouldWatch) process.exit(openACs.length > 0 ? 1 : 0);
}

if (shouldWatch) {
  console.log(`${CYAN}Watching for changes... (Ctrl+C to stop)${RESET}`);
  run();
  setInterval(run, 3000);
} else {
  run();
}
