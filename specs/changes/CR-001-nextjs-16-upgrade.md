# CR-001: Framework-Upgrade Next.js 14 → 16 (Security)

## Metadaten
- **Status**: `done`
- **CR-ID**: CR-001
- **Feature**: 00 – Architektur (Framework-Basis, betrifft alle Features)
- **Typ**: `breaking-change`
- **Priorität**: `high`
- **Erstellt von**: Security-Audit 2026-07 (Claude, Tech-Seite)
- **Erstellt am**: 2026-07-02
- **Fällig bis**: keine Frist (empfohlen: nächster Release-Zyklus)

---

## Problembeschreibung / Anlass

Die Applikation ist öffentlich im Internet erreichbar und läuft auf Next.js
14.2.35. Für diese Version bestehen mehrere offene Security-Advisories mit
Schweregrad **hoch** (u.a. DoS über Server-Component-Deserialisierung,
Cache-Poisoning, HTTP Request Smuggling in Rewrites), deren Fixes erst in
Next.js 16 ausgeliefert werden. `npm audit` meldet die Findings dauerhaft;
ein Teil ist nur teilweise mitigierbar (siehe `docs/SECURITY-AUDIT-2026-07.md`,
Abschnitt 3).

## Gewünschtes Verhalten (nach der Änderung)

Für Nutzer ändert sich **nichts sichtbar** — alle Features verhalten sich
exakt wie in den bestehenden Specs beschrieben. Das System läuft auf einer
Framework-Version ohne bekannte offene Security-Advisories, und
`npm audit --omit=dev` ist sauber.

---

## Betroffene Specs

### Business-Spec-Änderungen
| Spec-Datei | BAC-ID | Typ der Änderung |
|-----------|--------|-----------------|
| — keine | — | Verhalten bleibt unverändert |

### Technical-Spec-Änderungen
| Spec-Datei | AC-ID | Typ der Änderung |
|-----------|-------|-----------------|
| `specs/technical/00-architecture.md` | Stack-Tabelle + Restrisiken | geändert (Version, Restrisiko #1 entfällt) |

---

## Impact-Analyse

### Betroffene Komponenten
- [x] API-Routes: **alle 30 Route-Handler** — Next 15+ macht Request-APIs asynchron (`cookies()`, `headers()`, `params` sind Promises); jede Route mit `{ params }` und jeder `cookies()`-Aufruf muss angepasst werden
- [x] Datenmodell / Datenbank: Migration nötig? **nein**
- [x] UI-Komponenten: App-Router-Seiten mit `params`/`searchParams` (Promise-Umstellung); React 18 → 19 (Peer-Dependency von Next 16)
- [x] Tests: E2E-Suite komplett gegen den neuen Build laufen lassen; `playwright.config.ts` (Standalone-Pfade können sich ändern); Unit-Tests der lib-Schicht sind framework-unabhängig
- [x] Externe Abhängigkeiten: `eslint-config-next` (Major-Update), `next.config.mjs` (`experimental.instrumentationHook` ist in Next 15+ Standard und muss entfernt werden), Dockerfile (Node-20-Basis prüfen, Next 16 erfordert Node ≥ 20.9), Middleware-API-Änderungen prüfen

### Breaking Change?
- [x] Ja → bestehende Daten / API-Clients betroffen → Migrationspfad:
  - Keine Daten-Migration; API-Verträge (Request/Response-Shapes) bleiben identisch — Breaking betrifft nur den Code intern
  - Vorgehen: Codemod `npx @next/codemod@canary upgrade latest`, danach manuelle Durchsicht aller async-Request-API-Stellen
  - Rollback: Git-Revert des Upgrade-Commits, kein Datenbestand betroffen
- [ ] Nein

### Aufwandsschätzung
- **Gross (> 8h)**
- Begründung: Zwei Major-Versionen (14 → 16) inkl. React 19; async Request-APIs betreffen praktisch jede Route und Seite; vollständige Regression über Unit + E2E + manueller Smoke-Test des Admin-Panels nötig. Der Umfang ist mechanisch, aber breit.

### Übergangs-Mitigationen (bereits umgesetzt im Security-Audit 2026-07)
- Image-Optimizer deaktiviert (`/_next/image`-DoS-Fläche entfällt)
- Keine Rewrites-/i18n-Konfiguration im Einsatz (Request-Smuggling-/Bypass-Advisories nicht ausnutzbar)
- Empfehlung bis zum Upgrade: WAF/CDN (z.B. Cloudflare) vorschalten

---

## Implementierungs-Tasks

> Wird nach Freigabe von /implement generiert

- [x] TASK-001: Next 16.2.10 + React 19 + eslint-config-next 16 + ESLint 9 installiert
- [x] TASK-002: Alle 11 dynamischen Route-Handler/Seiten auf async `params` (`await` / `use()`) und `cookies()` (`await`) umgestellt
- [x] TASK-003: `next.config.mjs` bereinigt (`experimental.instrumentationHook` entfernt); CSP zusätzlich auf Per-Request-Nonce gehärtet (`lib/csp.ts` + `middleware.ts`), `force-dynamic` im Root-Layout
- [x] TASK-004: Standalone-Build verifiziert (`node .next/standalone/server.js`), E2E gegen den Prod-Build grün
- [x] TASK-005: `npm audit --omit=dev --audit-level=high` sauber (kein High/Critical mehr; 4 High-Advisories aus Next 14 behoben); Unit 105/105 + E2E 17/17 grün; Nonce-CSP live verifiziert
- [x] TASK-006: `specs/technical/00-architecture.md`, `CLAUDE.md`, `docs/SECURITY-AUDIT-2026-07.md` aktualisiert

> **Verbleibende Audit-Findings (nicht High/Critical):** ein `postcss <8.5.10`-Moderate
> als transitive Abhängigkeit von `next` (nur Build-Zeit-CSS, kein Runtime-Pfad) —
> kein Fix ohne Downgrade verfügbar, wird mit dem nächsten Next-Patch mitgezogen.
> ESLint meldet 49 Warnungen (neue React-Compiler-Regeln, Bestandscode) — als
> separater Tech-Debt getrackt, kein CI-Blocker.

---

## Freigabe

### PO-Freigabe (Business)
- [x] **Freigegeben**: bernold (PO) — mündlich/Session Datum: 2026-07-03
- [ ] **Abgelehnt** mit Begründung: ___________________________

### Tech-Freigabe
- [x] **Freigegeben**: bernold + Claude (Tech) Datum: 2026-07-03
- [ ] **Abgelehnt** mit Begründung: ___________________________

---

## Änderungshistorie

| Datum | Autor | Änderung am CR |
|-------|-------|---------------|
| 2026-07-02 | Claude (Security-Audit) | CR erstellt inkl. Impact-Analyse |
| 2026-07-03 | bernold + Claude | Freigegeben und umgesetzt (Next 16.2.10 + React 19); Status → done |
