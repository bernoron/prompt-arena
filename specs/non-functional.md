# Nichtfunktionale Anforderungen (NFR) – PromptArena

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Letzte Änderung**: 2026-07-08
- **Geltungsbereich**: Gilt für **alle** Features, sofern eine Feature-Spec nicht explizit abweicht (mit Begründung + CR).

> Dieser Katalog ergänzt `specs/constitution.md`. Die Constitution regelt **Prinzipien** (Gesetz),
> dieser Katalog regelt **messbare Qualitätsziele** (Nichtfunktionale Anforderungen).
>
> **Jede NFR hat eine stabile ID** (`NFR-<KATEGORIE>-NNN`). Änderungen an einer NFR mit Status
> `approved` brauchen ein Change Request (`/change-request`) — genau wie bei Feature-Specs.
>
> Features referenzieren NFRs statt sie zu duplizieren, z. B. „erfüllt NFR-PERF-001, NFR-A11Y-002".

---

## Wie NFRs verwendet werden

- **Business-Spec**: verweist bei Bedarf auf NFR-IDs im Abschnitt „Rahmenbedingungen".
- **Technical-Spec**: listet unter „Erfüllte NFRs" die relevanten IDs.
- **Code**: sicherheits-/performancerelevante Stellen tragen `// @nfr NFR-XXX-NNN` analog zu `// @spec`.
- **Test**: E2E-/Unit-Tests, die eine NFR absichern, referenzieren die ID im Testnamen oder Kommentar.

---

## 1. Performance & Antwortzeiten (`PERF`)

| ID | Anforderung | Messgröße / Zielwert |
|----|-------------|----------------------|
| NFR-PERF-001 | Interaktive Seiten laden schnell | LCP < 2.5 s auf Desktop, < 4 s auf Mobile (schnelles 4G) |
| NFR-PERF-002 | API-Lesezugriffe sind zügig | GET-Route-Handler antworten p95 < 300 ms bei ≤ 10 000 Datensätzen |
| NFR-PERF-003 | API-Schreibzugriffe sind zügig | POST/PATCH/DELETE antworten p95 < 500 ms |
| NFR-PERF-004 | Keine N+1-Queries | Listen-Endpunkte laden Relationen via Prisma `include`/`select`, nicht in Schleifen |
| NFR-PERF-005 | Listen sind paginiert oder begrenzt | Kein Endpunkt gibt unbegrenzt viele Zeilen zurück (Default-Limit dokumentiert) |

---

## 2. Verfügbarkeit & Zuverlässigkeit (`AVAIL`)

| ID | Anforderung | Messgröße / Zielwert |
|----|-------------|----------------------|
| NFR-AVAIL-001 | Produktion ist erreichbar | Ziel-Verfügbarkeit 99 % pro Monat (Fly.io) |
| NFR-AVAIL-002 | Deploys sind ohne manuellen Downtime | Rolling Deploy über CI; fehlgeschlagener Healthcheck rollt nicht aus |
| NFR-AVAIL-003 | Fehler degradieren kontrolliert | Route-Handler fangen Fehler ab, geben strukturierten Fehler-Body + korrekten Statuscode zurück, nie einen Stacktrace an den Client |
| NFR-AVAIL-004 | Datenintegrität bei Nebenläufigkeit | Punktevergabe & Votes sind idempotent pro Trigger (siehe constitution.md §6) |

---

## 3. Sicherheit & Datenschutz (`SEC`)

> Ergänzt constitution.md §5. Details/Findings: `docs/SECURITY-AUDIT-2026-07.md`.

| ID | Anforderung | Messgröße / Zielwert |
|----|-------------|----------------------|
| NFR-SEC-001 | Jeder POST/PATCH/DELETE-Body wird validiert | Zod-Schema aus `lib/validation.ts`, kein ungeprüfter Input |
| NFR-SEC-002 | Jeder Route-Handler ist rate-limited | Kein Endpunkt ohne Limiter (constitution.md) |
| NFR-SEC-003 | Admin-Routen sind geschützt | `middleware.ts` Session-Check, kein Bypass |
| NFR-SEC-004 | Passwörter werden nie im Klartext gespeichert/geloggt | scrypt-Hash; keine Secrets/Cookies in Logs |
| NFR-SEC-005 | CSP mit Per-Request-Nonce aktiv | `middleware.ts` + `lib/csp.ts`, keine inline-Scripts ohne Nonce |
| NFR-SEC-006 | Keine High/Critical-Advisories in Prod-Dependencies | CI-Gate `npm run security:deps` blockiert Merge (siehe Pipeline AC-99-002) |
| NFR-SEC-007 | Keine kopierten Copyleft-Lizenzen | `dependency-review` verbietet GPL-3.0/AGPL-3.0/LGPL-3.0 |

---

## 4. Barrierefreiheit (`A11Y`)

| ID | Anforderung | Messgröße / Zielwert |
|----|-------------|----------------------|
| NFR-A11Y-001 | Bedienbar per Tastatur | Alle interaktiven Elemente fokussierbar & aktivierbar ohne Maus |
| NFR-A11Y-002 | Ausreichender Kontrast | Text erfüllt WCAG 2.1 AA (Kontrast ≥ 4.5:1 für Normaltext) |
| NFR-A11Y-003 | Semantisches HTML & Labels | Formularfelder haben Labels; Buttons/Links korrekt ausgezeichnet |
| NFR-A11Y-004 | Sichtbarer Fokus-Indikator | Fokus ist visuell erkennbar (kein `outline: none` ohne Ersatz) |

---

## 5. Internationalisierung & Sprache (`I18N`)

> Ergänzt constitution.md §1.

| ID | Anforderung | Messgröße / Zielwert |
|----|-------------|----------------------|
| NFR-I18N-001 | UI-Texte auf Deutsch | Nutzersichtbare Texte deutsch; technische Labels/Code englisch |
| NFR-I18N-002 | Prompt-Inhalte zweisprachig | Jedes Prompt: `title`/`titleEn`, `content`/`contentEn` |
| NFR-I18N-003 | Keine hartkodierten Datums-/Zahlformate | Locale-bewusste Formatierung, keine manuellen String-Konkatenationen |

---

## 6. Beobachtbarkeit (`OBS`)

| ID | Anforderung | Messgröße / Zielwert |
|----|-------------|----------------------|
| NFR-OBS-001 | Strukturiertes Logging | Immer `lib/logger.ts`, nie `console.log` in Produktion |
| NFR-OBS-002 | Request-Logging vorhanden | `middleware.ts` protokolliert Requests (ohne sensible Daten) |
| NFR-OBS-003 | Fehler sind nachvollziehbar | Server-Fehler werden mit Kontext geloggt (Route, Statuscode) |

---

## 7. Wartbarkeit & Code-Qualität (`MAINT`)

> Ergänzt constitution.md §2.

| ID | Anforderung | Messgröße / Zielwert |
|----|-------------|----------------------|
| NFR-MAINT-001 | Kein `any`, keine unkommentierten Casts | `tsc --noEmit` + ESLint grün in CI (AC-99-004) |
| NFR-MAINT-002 | Keine Magic Values inline | Werte in `lib/constants.ts` / `lib/points.ts` |
| NFR-MAINT-003 | Jedes Feature hat Unit- **und** E2E-Tests | ≥ 1 Happy-Path + ≥ 1 Edge-Case (constitution.md §4) |
| NFR-MAINT-004 | AC-Abdeckung ist prüfbar | `node scripts/spec-sync.mjs` läuft ohne offene AC-Lücken |

---

## 8. Kompatibilität (`COMPAT`)

| ID | Anforderung | Messgröße / Zielwert |
|----|-------------|----------------------|
| NFR-COMPAT-001 | Aktuelle Evergreen-Browser | Letzte 2 Versionen Chrome/Edge/Firefox/Safari |
| NFR-COMPAT-002 | Responsive Layout | Nutzbar ab 360 px Breite bis Desktop |
| NFR-COMPAT-003 | Node-Laufzeit fixiert | Node 22 (CI + Produktion identisch) |

---

## Änderungshistorie

| Datum | Autor | Änderung |
|-------|-------|----------|
| 2026-07-08 | Setup | NFR-Katalog erstellt (v1.0) |
