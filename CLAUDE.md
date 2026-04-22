# PromptArena – Claude Code Instructions

## Permissions
All bash commands, file writes, git operations, npm scripts, and server restarts are **pre-approved**.
Do NOT ask for confirmation before:
- Running `npm run *`, `npx *`, `git *`
- Writing or editing files
- Starting/stopping the dev server
- Running tests
- Committing or pushing to git

## Project Context
- **Stack**: Next.js 14 App Router, Prisma 5 (SQLite), TailwindCSS, TypeScript strict
- **Architecture**: Two completely separate route groups:
  - `app/(user)/` – user-facing app (Navigation bar)
  - `app/admin/` – admin panel (sidebar only, no user nav)
- **Tests**: Vitest (unit) + Playwright (E2E) – always run after changes
- **Dev server**: managed via `.claude/launch.json` → `preview_start("prompt-arena")`

---

## Spec-Driven Development (SDD) – Dreischichtige Architektur

**Spec ist die Wahrheit. Code folgt der Spec — nie umgekehrt.**

```
Layer 1 – Business Spec   specs/business/NN-feature.md    PO / BA
Layer 2 – Technical Spec  specs/technical/NN-feature.md   Dev / Claude
Layer 3 – Code            // @spec AC-XX-NNN              Implementation
```

---

### Neues Feature – Vollständiger Workflow

```
/specify-business <beschreibung>   → Business-Spec schreiben (Layer 1)
                                     Status: draft → PO setzt "approved"
/specify-tech <feature-nr>         → Tech-Spec ableiten (Layer 2)
                                     Status: draft → Tech Lead setzt "approved"
/plan                              → tasks.md aktualisieren
/tasks                             → Offene Tasks anzeigen
/implement [AC-XX-NNN]             → Nächsten Task umsetzen
/sync fix                          → Annotationen und tasks.md synchronisieren
```

---

### Änderung an bestehendem Feature – CHANGE REQUEST PFLICHT

```
/change-request <feature> <beschreibung>   → CR erstellen (specs/changes/CR-NNN.md)
                                             Impact-Analyse automatisch
/approve-change CR-NNN approve --both      → PO + Tech genehmigen
/implement                                 → Umsetzung (CR muss approved sein)
```

**⛔ /implement blockiert** wenn:
- Änderung an einer approved Spec ohne genehmigtes CR
- CR vorhanden aber Status ≠ `approved`

---

### Bugfix (kein Behavior-Change)
1. Spec lesen — sicherstellen dass Bugfix dokumentiertes Verhalten NICHT ändert
2. Code fixen + `// @spec AC-XX-NNN` Kommentar
3. `npm run test:unit` + `npm run test:e2e`
4. Commit: `fix(scope): beschreibung`

---

### Regeln
- Jedes AC hat stabile ID: `AC-XX-NNN` (technisch) / `BAC-XX-NNN` (business)
- Code trägt `// @spec AC-XX-NNN` Kommentar
- `specs/constitution.md` = Gesetz — immer lesen vor Änderungen
- `node scripts/spec-sync.mjs` = Wahrheits-Check für AC-Abdeckung

---

### Spec-Dateien Übersicht

| Typ | Pfad | Für wen |
|-----|------|---------|
| Business-Spec | `specs/business/NN-*.md` | PO, BA, alle |
| Technical-Spec (neu) | `specs/technical/NN-*.md` | Dev, Claude |
| Technical-Spec (legacy) | `specs/features/NN-*.md` | Dev, Claude |
| Change Request | `specs/changes/CR-NNN-*.md` | PO, Dev |
| CR-Workflow | `specs/changes/WORKFLOW.md` | alle |
| Prinzipien | `specs/constitution.md` | alle |

---

### Auto-Tagging (automatisch)
Nach jedem `git push origin main` wird automatisch:
1. Semver-Bump aus Conventional Commits berechnet (`feat`→minor, `fix`→patch)
2. `package.json` Version erhöht
3. Annotierter Git-Tag erstellt und gepusht

Manual: `node scripts/auto-tag.mjs`

---

## Key Files
- `lib/constants.ts` – all magic values (categories, levels, points guide)
- `lib/validation.ts` – all Zod schemas (must update with new enum values)
- `lib/points.ts` – gamification logic
- `lib/db-helpers.ts` – server-only Prisma helpers (`awardPoints`)
- `middleware.ts` – admin auth guard + request logging

## Never
- Use raw SQL (Prisma only)
- Add `any` types
- Put magic values inline (use `lib/constants.ts`)
- Skip Zod validation on POST endpoints
- Skip rate limiting on any route handler
- Change an approved feature spec without a CR
