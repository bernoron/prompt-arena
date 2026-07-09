# CI/CD-Pipeline – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 99 (Infrastruktur, kein Nutzer-Feature)
- **Letzte Änderung**: 2026-07-08
- **Quelle der Wahrheit**: `.github/workflows/ci.yml`, `.github/workflows/release-please.yml`
- **Business-Spec**: — (rein technisch; kein BAC)

> **CR-geschützt.** Änderungen an dieser Spec **und** an den referenzierten Workflow-Dateien
> laufen über `/change-request` → `/approve-change` → `/implement`. Grund: Die Pipeline ist die
> Freigabe-Schranke vor Produktion; eine unkontrollierte Änderung (z. B. ein entferntes Gate)
> kann fehlerhaften oder unsicheren Code live schalten.
>
> Diese Spec beschreibt den **Ist-Zustand**. Weicht `ci.yml` von hier ab, ist eine der beiden
> Seiten falsch → `/sync` bzw. CR.

---

## Überblick

```
Trigger: push→main | pull_request→main | manuell (workflow_dispatch)

  ┌─────────────────────┐  ┌────────────┐  ┌───────────┐  ┌──────────────────┐
  │ dependency-security │  │ unit       │  │ e2e       │  │ lint (tsc+eslint)│   ← parallel
  └─────────┬───────────┘  └─────┬──────┘  └─────┬─────┘  └────────┬─────────┘
            └──────────────┬─────┴───────────────┴─────────────────┘
                           ▼
                    deploy (Fly.io)   ← nur bei push→main, needs: alle vier Jobs grün
```

Release/Versionierung läuft **separat** über den `release-please`-Workflow (siehe AC-99-006).

---

## Akzeptanzkriterien

> **Verifikation:** Diese ACs werden **durch jeden CI-Lauf** validiert (die Pipeline selbst ist der
> Test), nicht über `// @spec`-Codekommentare — `scripts/spec-sync.mjs` scannt kein YAML. Sie sind
> abgehakt, weil der Ist-Zustand von `ci.yml`/`release-please.yml` sie erfüllt. Ändert sich ein AC,
> läuft die Änderung über ein CR (siehe Kopf dieser Datei).

### Trigger & Laufzeitumgebung

- [x] **AC-99-001**: Die Pipeline läuft bei `push` auf `main`, bei jedem `pull_request` gegen `main`
  und manuell via `workflow_dispatch`. Node-Version ist **22** in allen Jobs; npm-Cache aktiv über
  `package-lock.json`. Default-Permissions sind `contents: read`, `pull-requests: read`.

### Job: Dependency Security

- [x] **AC-99-002**: Job `dependency-security` bricht ab, wenn `npm run security:deps`
  High/Critical-Advisories in Produktions-Dependencies findet (→ NFR-SEC-006). Bei
  `pull_request`-Events läuft zusätzlich `dependency-review-action` mit `fail-on-severity: high`
  und `deny-licenses: GPL-3.0, AGPL-3.0, LGPL-3.0` (→ NFR-SEC-007).

### Job: Unit Tests

- [x] **AC-99-003**: Job `unit` führt `npm run test:unit` (Vitest) aus und schlägt bei
  fehlgeschlagenen Unit-Tests fehl (→ NFR-MAINT-003).

### Job: Type Check + Lint

- [x] **AC-99-004**: Job `lint` führt `npx tsc --noEmit` **und** `npm run lint` (ESLint Flat-Config)
  aus; ein Typ- oder Lint-Fehler bricht die Pipeline ab (→ NFR-MAINT-001).

### Job: E2E Tests

- [x] **AC-99-005**: Job `e2e` setzt eine echte Test-DB auf (`npm run db:reset:dev`, SQLite
  `file:./prisma/dev.db`), baut die App deterministisch (`npm run build`, `NODE_ENV=production`),
  installiert Chromium (`npx playwright install chromium --with-deps`) und führt `npm run test:e2e`
  aus. Test-Secrets kommen aus Job-Env (`ADMIN_SECRET`/`USER_SECRET`/`EMAIL_SECRET`), niemals aus
  echten Produktions-Secrets. Bei Fehlschlag wird der Playwright-Report als Artifact hochgeladen
  (Retention 7 Tage).

### Deploy-Gate

- [x] **AC-99-006**: Job `deploy` läuft **nur** bei `push` auf `refs/heads/main` (nie bei
  `pull_request`) und **nur** wenn `dependency-security`, `unit`, `e2e` und `lint` grün sind
  (`needs`-Kette). Deploy nutzt das `production`-Environment, `concurrency: fly-deploy-production`
  ohne `cancel-in-progress`, Timeout 15 min. `FLY_API_TOKEN` ist ausschließlich über das
  `production`-Environment erreichbar → für Forks/PRs unerreichbar (→ NFR-SEC-003).

### Lieferketten-Härtung

- [x] **AC-99-007**: Third-Party-Actions mit Zugriff auf Produktions-Secrets sind auf einen
  **Commit-SHA** gepinnt, nicht auf einen mutierbaren Tag (aktuell `superfly/flyctl-actions/setup-flyctl`).

### Release & Versionierung

- [x] **AC-99-008**: Versionierung läuft **ausschließlich** über Release-Please
  (`.github/workflows/release-please.yml`, Config `release-please-config.json` +
  `.release-please-manifest.json`). Semver-Bump aus Conventional Commits (`feat`→minor,
  `fix`→patch, `feat!`/`BREAKING CHANGE`→major). Es gibt **keinen** zweiten Auto-Tag-Mechanismus;
  `scripts/auto-tag.mjs` ist nur manueller Fallback. Versionsbasis ≥ v7.0.0, nie zurück auf 5.x/6.x.

---

## Erfüllte NFRs

`NFR-SEC-006`, `NFR-SEC-007`, `NFR-SEC-003`, `NFR-AVAIL-002`, `NFR-MAINT-001`,
`NFR-MAINT-003`, `NFR-COMPAT-003`

---

## Nicht im Scope

- Preview-/Staging-Deploys pro PR (aktuell nur Prod-Deploy von `main`)
- Automatische DB-Migrationen in Produktion als eigener Pipeline-Schritt
- Performance-/Lasttests in der Pipeline (NFR-PERF wird manuell geprüft)

---

## Änderungshistorie

| Datum | Autor | Änderung |
|-------|-------|----------|
| 2026-07-08 | Setup | Pipeline-Spec aus bestehendem `ci.yml` erstellt (v1.0) |
