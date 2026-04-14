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

## Spec-Driven Development (SDD) Workflow

**Spec ist die Wahrheit. Code folgt der Spec — nie umgekehrt.**

### Neues Feature
```
/specify <beschreibung>   → Spec schreiben (specs/features/XX-name.md)
/plan                     → Tech-Plan + tasks.md aktualisieren
/tasks                    → Offene Tasks anzeigen
/implement [AC-XX-NNN]    → Nächsten Task umsetzen
/sync fix                 → tasks.md nach Implementierung aktualisieren
```

### Bugfix / Änderung
1. Erst die relevante Spec lesen (`specs/features/XX-name.md`)
2. Wenn Verhalten sich ändert: Spec zuerst anpassen
3. Dann Code ändern + `// @spec AC-XX-NNN` Kommentar setzen
4. `/sync fix` ausführen

### Regeln
- Jedes neue AC bekommt eine stabile ID (`AC-XX-NNN`)
- Code der ein AC implementiert trägt `// @spec AC-XX-NNN` Kommentar
- `specs/constitution.md` ist das Gesetz — immer lesen vor Änderungen
- `node scripts/spec-sync.mjs` zeigt welche ACs implementiert/offen sind

### Standard-Entwicklungsflow
1. Spec lesen / erstellen
2. Code ändern
3. `npm run test:unit` + `npm run test:e2e`
4. `/sync fix`
5. Commit mit conventional commits (`feat:`, `fix:`, `refactor:`, `test:`)

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
