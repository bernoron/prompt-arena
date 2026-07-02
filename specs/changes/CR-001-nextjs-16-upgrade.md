# CR-001: Framework-Upgrade Next.js 14 → 16 (Security)

## Metadaten
- **Status**: `impact-assessed`
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

- [ ] TASK-001: `@next/codemod upgrade` ausführen (Next 16, React 19, eslint-config-next)
- [ ] TASK-002: Alle Route-Handler und Seiten auf async `params`/`cookies()`/`headers()` umstellen
- [ ] TASK-003: `next.config.mjs` bereinigen (`experimental.instrumentationHook` entfernen, CSP/Header verifizieren)
- [ ] TASK-004: Dockerfile/Standalone-Build und `docker-entrypoint.sh` gegen Next 16 prüfen
- [ ] TASK-005: `npm audit --omit=dev` muss 0 Findings zeigen; Unit + E2E grün; Security-Header live verifizieren
- [ ] TASK-006: `specs/technical/00-architecture.md` (Stack-Version, Restrisiken) und `docs/` aktualisieren

---

## Freigabe

### PO-Freigabe (Business)
- [ ] **Freigegeben**: ___________________________ Datum: ___________
- [ ] **Abgelehnt** mit Begründung: ___________________________

### Tech-Freigabe
- [ ] **Freigegeben**: ___________________________ Datum: ___________
- [ ] **Abgelehnt** mit Begründung: ___________________________

---

## Änderungshistorie

| Datum | Autor | Änderung am CR |
|-------|-------|---------------|
| 2026-07-02 | Claude (Security-Audit) | CR erstellt inkl. Impact-Analyse |
