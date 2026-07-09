# Automatisierung: Doku-Generierung, Git-Hooks & Spec-Sync – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 98 (Infrastruktur, kein Nutzer-Feature)
- **Letzte Änderung**: 2026-07-08
- **Quelle der Wahrheit**: `scripts/generate-docs.ts`, `scripts/watch-docs.ts`,
  `scripts/spec-sync.mjs`, `.githooks/pre-commit`, `.githooks/pre-push`, `package.json` (scripts)
- **Business-Spec**: — (rein technisch; kein BAC)

> **CR-geschützt.** Änderungen an dieser Spec **und** an den referenzierten Scripts/Hooks laufen
> über `/change-request` → `/approve-change` → `/implement`. Grund: Diese Automatik hält Doku und
> Specs mit dem Code synchron und ist Teil der Qualitäts-Schranke vor jedem Commit/Push.
>
> Diese Spec beschreibt den **Ist-Zustand**. Weicht ein Script/Hook davon ab, ist eine der beiden
> Seiten falsch → `/sync` bzw. CR.

---

## Überblick

Drei ineinandergreifende Automatiken halten das Projekt konsistent:

```
1. Doku-Generator   scripts/generate-docs.ts   npm run docs        docs/*.md aus dem Code erzeugen
2. Spec-Sync        scripts/spec-sync.mjs       node …spec-sync     @spec ↔ AC-Abdeckung prüfen
3. Git-Hooks        .githooks/pre-commit|push   git commit / push   1+2 automatisch bei jedem Commit
```

**Kernprinzip:** `docs/*.md` sind **generierte Artefakte**, keine handgepflegten Dateien — bei jedem
Commit neu erzeugt. Handgepflegt bleiben nur `docs/SPEC-DRIVEN-DEVELOPMENT.md` und
`docs/SECURITY-AUDIT-*.md` (die der Generator nicht schreibt).

---

## Akzeptanzkriterien

> **Verifikation:** Diese ACs werden durch die tatsächliche Ausführung der Scripts/Hooks validiert,
> nicht über `// @spec`-Codekommentare (`spec-sync.mjs` scannt nur `.ts/.tsx/.mjs` nach `@spec`, nicht
> die Hook-Shell-Skripte). Sie sind abgehakt, weil der Ist-Zustand sie erfüllt.

### Doku-Generierung

- [x] **AC-98-001**: `npm run docs` (→ `scripts/generate-docs.ts`) erzeugt in `docs/` genau diese
  Dateien: `README.md`, `00-rekonstruktions-prompt.md`, `01-konzept.md`, `02-nutzerdoku.md`,
  `03-architektur.md`, `04-api-referenz.md`, `05-datenmodell.md`, `06-entwickler.md`,
  `07-onboarding.md`, `08-betrieb.md`. Jede trägt einen „Automatisch generiert am …"-Footer.
- [x] **AC-98-002**: Inhalte werden **aus dem Quellcode extrahiert** — Prisma-Schema
  (`prisma/schema.prisma`), API-Routen (`app/api/**/route.ts` inkl. JSDoc), Punkte/Level
  (`lib/points.ts`), Seiten/Komponenten (`app/`, `components/`), Abhängigkeiten (`package.json`),
  Umgebungsvariablen (`.env.example`), Migrationen (`prisma/migrations/`). Die generierten
  `docs/*.md` werden **nicht von Hand editiert** (jede Generierung überschreibt sie).
- [x] **AC-98-003**: `npm run docs:watch` (→ `scripts/watch-docs.ts`) regeneriert die Doku bei
  Dateiänderungen automatisch.

### Spec-Sync

- [x] **AC-98-004**: `node scripts/spec-sync.mjs` scannt `specs/technical/*.md` nach `AC-XX-NNN` und
  den Code (`app`, `lib`, `components`, `prisma`, `middleware.ts`) nach `// @spec AC-XX-NNN`,
  meldet Abdeckung/Lücken und beendet mit Exit-Code 1, wenn offene (nicht implementierte) ACs
  existieren. `--fix` hakt implementierte ACs in `specs/technical/*.md` + `specs/tasks.md` ab;
  `--watch` läuft dauerhaft (→ NFR-MAINT-004).

### Git-Hooks

- [x] **AC-98-005**: `.githooks/pre-commit` läuft bei jedem Commit: (1) `npm run test:unit`
  (bricht bei Fehler ab), (2) `npm run docs` + `git add docs/`, (3) `node scripts/spec-sync.mjs --fix`
  + `git add specs/technical/ specs/tasks.md`. So sind Doku und Spec-Checkboxen in jedem Commit aktuell.
- [x] **AC-98-006**: `.githooks/pre-push` läuft vor jedem Push: `npm run test:e2e` (Playwright).
  Bei einem **Tag-Push** werden Tests übersprungen (`refs/tags/*`). Setzt `E2E_TESTING=true` nur
  für diesen Lauf (umgeht `authLimiter` lokal, nie in Produktion).
- [x] **AC-98-007**: Hooks werden über `npm run setup:hooks` aktiviert
  (`git config core.hooksPath .githooks`). `prepare` ruft dies bei `npm install` automatisch auf,
  **außer** in CI (`$CI = true` überspringt es).

---

## Erfüllte NFRs

`NFR-MAINT-003`, `NFR-MAINT-004`, `NFR-OBS-001`

---

## Bekannte Abweichungen / Wartungshinweise

> Diese Punkte sind **Ist-Zustand mit Handlungsbedarf** — Korrektur nur über CR.

- Teile von `generate-docs.ts` sind **hartkodiert** und driften vom übrigen Projekt weg:
  `01-konzept.md` nennt eine eigene `NFA-01…10`-Liste (Dublette zum NFR-Katalog
  `specs/non-functional.md`); mehrere Abschnitte sagen „Next.js 14 / React 18", während der
  reale Stack Next 16 / React 19 ist. Angleichung sollte den Code aus der jeweiligen
  Single-Source lesen statt Strings zu pflegen.

---

## Nicht im Scope

- Automatische Veröffentlichung der Doku (Doc-Site/Hosting) — `docs/` bleibt im Repo
- Generierung von Business-/Technical-Specs (die schreibt der SDD-Workflow, nicht der Generator)

---

## Änderungshistorie

| Datum | Autor | Änderung |
|-------|-------|----------|
| 2026-07-08 | Setup | Automation-Spec aus bestehenden Scripts/Hooks erstellt (v1.0) |
