# Öffentliche Startseite – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.3
- **Feature-Nr**: 13
- **Abgeleitet von**: `specs/business/13-landing-page.md` v1.3
- **Letzte Änderung**: 2026-07-17

---

## Technische Akzeptanzkriterien

### Routing & Zugriff

- [x] **AC-13-001**: `middleware.ts` `isPublicPath()` lässt `pathname === '/'` ohne `user_session`-Cookie durch (kein Redirect zu `/login`).
  - **Referenz**: BAC-13-001
  - **Testbar durch**: E2E

- [x] **AC-13-002**: `app/page.tsx` ist eine Server Component. Sie ruft `getSessionUser()` auf; existiert ein Nutzer, `redirect('/dashboard')`. Andernfalls wird die öffentliche Landingpage gerendert.
  - **Referenz**: BAC-13-004
  - **Testbar durch**: E2E

### Inhalt

- [x] **AC-13-003**: Hero-Bereich zeigt Logo, Produktnamen, einen kurzen Erklärungstext und zwei Call-to-Action-Links: `/register` ("Jetzt kostenlos starten") und `/login` ("Anmelden").
  - **Referenz**: BAC-13-001, BAC-13-003
  - **Testbar durch**: Manual / E2E

- [x] **AC-13-004**: Vier statische Feature-Kacheln (Prompt-Bibliothek, Selbst einreichen, Lernpfade, Challenges & Rangliste) fassen den Funktionsumfang zusammen.
  - **Referenz**: BAC-13-001
  - **Testbar durch**: Manual

- [x] **AC-13-005**: `lib/services/prompt-service.ts` exportiert `getTopPrompts(limit)`. Die Funktion selektiert nur `id, title, titleEn, content, category, difficulty, usageCount` (keine `authorId`/`author`-Relation) für Prompts mit `usageCount > 0`, sortiert nach `usageCount desc`, und reichert das Ergebnis mit `avgRating`/`voteCount` aus `getRatingsMap()` an. Anonymität wird durch das fehlende Feld erzwungen, nicht durch nachträgliches Filtern im UI.
  - **Referenz**: BAC-13-002
  - **Testbar durch**: Manual / E2E

- [x] **AC-13-006**: Die Startseite rendert bis zu 3 Ergebnisse von `getTopPrompts(3)` als Karten mit Kategorie-Badge, Nutzungszähler und Sternebewertung — ohne Autorenname, Avatar oder Autoren-Initialen.
  - **Referenz**: BAC-13-002
  - **Testbar durch**: Manual / E2E

- [x] **AC-13-007**: Liefert `getTopPrompts()` ein leeres Array (noch keine genutzten Prompts), blendet die Startseite den gesamten Showcase-Abschnitt aus, statt eine leere Kachel-Reihe zu zeigen.
  - **Referenz**: BAC-13-005
  - **Testbar durch**: Manual

- [x] **AC-13-008**: `lib/services/feature-announcements-service.ts` exportiert `getRecentFeatureAnnouncements(limit)`. Datenquelle ist ein optionales `**Nutzer-Ankündigung**: <Datum> | <Titel> | <Text>`-Feld in `specs/business/*.md` und `specs/changes/CR-*.md` — die reine Funktion `parseAnnouncement(markdown)` extrahiert dieses Feld pro Datei (CRLF-sicher). Nur Specs/CRs, die das Feld explizit setzen, erscheinen — der Normalfall (interne Specs/CRs) hat kein Feld und bleibt unsichtbar. Ergebnis wird über `lib/cache.ts` (10 Min. TTL) gecacht. *(CR-007, ersetzt die Code-Konstante aus CR-006)*
  - **Referenz**: BAC-13-006
  - **Testbar durch**: Unit

- [x] **AC-13-009**: `app/page.tsx` rendert unterhalb des Prompt-Showcase einen "Neuigkeiten"-Abschnitt mit den ersten 10 Einträgen aus `getRecentFeatureAnnouncements(10)` (Titel, Datum, Beschreibung). Ist die Liste leer, wird der gesamte Abschnitt nicht gerendert (analog AC-13-007). *(CR-005, Datenquelle in CR-006 auf eine Code-Konstante, in CR-007 auf die Specs selbst umgestellt)*
  - **Referenz**: BAC-13-006, BAC-13-007
  - **Testbar durch**: E2E

**Historie:** CR-005 zog diese Daten automatisch aus `CHANGELOG.md` (Release-Please-Commit-Messages) — auf Produktion sichtbar wurde das als zu technisch/englisch bewertet. CR-006 ersetzte das durch eine kuratierte, deutsche Code-Konstante (`RECENT_FEATURES` in `lib/constants.ts`) — funktionierte, bedeutete aber doppelte Pflege (Feature-Beschreibung einmal in der Spec, einmal für die Startseite). CR-007 löst das auf: Die Spec selbst trägt jetzt optional die Ankündigungszeile, kein zweiter Ort mehr nötig. Die in CR-005 dokumentierte NFR-I18N-001-Ausnahme bleibt hinfällig — alle Texte sind regulär deutsch.

---

## API-Vertrag

Kein neuer HTTP-Endpunkt. `getTopPrompts()` wird direkt aus der Server Component
`app/page.tsx` aufgerufen (kein Self-Fetch-Roundtrip), analog zu `getPromptById()` auf der
bestehenden Prompt-Detailseite.

---

## Datenmodell

Keine Schema-Änderung. Nutzt das bestehende `Prompt`-Modell (`prisma/schema.prisma`)
read-only. *(CR-007: Neuigkeiten-Bereich liest `specs/business/*.md` + `specs/changes/CR-*.md`
als Dateien zur Laufzeit — kein DB-Zugriff, aber ein neuer Dateisystem-Zugriff, siehe
„Docker-Image" unten.)*

**Migrationen nötig:** nein

### Docker-Image

`Dockerfile` (Runtime-Stage) kopiert `specs/` explizit ins Image
(`COPY --from=builder /app/specs ./specs`) — Next.js' Standalone-Output-Tracing erkennt nur
statisch analysierbare Importe/literale Dateipfade, nicht das dynamische `readdir()` dieses
Service. Ein lokaler `docker build` als Verifikation war in der Entwicklungs-Sandbox nicht
möglich (Docker-Desktop-WSL2-Backend startete nicht); stattdessen statisch geprüft
(`.dockerignore` schliesst `specs/` nicht aus, `WORKDIR`/`CMD` unverändert) und über eine
sofortige `curl`-Kontrolle gegen die echte Produktions-URL direkt nach dem Deploy abgesichert
(Fehlerfall ist ungefährlich: `[]` statt Crash, siehe `getRecentFeatureAnnouncements()`).

---

## Komponenten-Struktur

```
app/
└── page.tsx                    // Server Component, Landingpage / Redirect (AC-13-002..004, AC-13-006, AC-13-007, AC-13-009)

middleware.ts                   // isPublicPath('/')  (AC-13-001)

lib/services/
├── prompt-service.ts                    // getTopPrompts()  (AC-13-005)
└── feature-announcements-service.ts     // getRecentFeatureAnnouncements(), parseAnnouncement()  (AC-13-008, CR-007)
```

Kein neuer Client-Code — die Seite ist vollständig serverseitig gerendert, keine
Interaktivität nötig.

---

## Validierung (Zod)

Kein Nutzereingabe-Formular auf dieser Seite — keine neuen Zod-Schemas nötig.

---

## Performance-Anforderungen

| Metrik | Zielwert |
|--------|----------|
| Zusätzliche DB-Queries pro Aufruf | 2 (`prisma.prompt.findMany` + `vote.groupBy` via `getRatingsMap`) |
| Bundle Size Increase | ~0 KB (kein neuer Client-Code) |
| *(CR-007)* Zusätzliche Dateisystem-Reads pro Aufruf | 0 im Regelfall — `getRecentFeatureAnnouncements()` ist über `lib/cache.ts` für 10 Minuten gecacht, da sich Specs nur bei einem Deploy ändern |

---

## Sicherheit

- [x] Keine Autor-Identität wird an anonyme Besucher:innen ausgeliefert (Feldauswahl statt Filterung)
- [x] Kein Formular, kein POST-Body → keine Zod-Validierung/Rate-Limiting nötig
- [x] `getSessionUser()` verifiziert das Cookie serverseitig, kein Vertrauen auf Client-State

---

## Tests

### Unit-Tests (`tests/unit/`)
- Kein neuer Unit-Test: `getTopPrompts()` greift auf Prisma zu — wie die übrigen
  DB-gestützten Funktionen in `prompt-service.ts` (`listPrompts`, `getPromptById`, die
  ebenfalls keine Unit-Tests haben) wird sie ausschliesslich per E2E gegen die echte
  Test-DB abgedeckt.
- [x] *(CR-007)* `tests/unit/lib/feature-announcements-service.test.ts` — `parseAnnouncement()`:
  extrahiert Datum/Titel/Text aus einer wohlgeformten Zeile, liefert `null` ohne Ankündigungszeile
  (Normalfall), CRLF-sicher, trimmt Leerzeichen, nimmt die erste Zeile falls mehrere vorhanden sind.

### E2E-Tests (`tests/e2e/`)
- [x] `tests/e2e/spec-contracts.spec.ts` Szenario „BAC-13 landing page": anonymer Aufruf von `/` liefert 200 (kein Redirect zu `/login`) und zeigt den CTA-Link zur Registrierung; ein eingeloggter Nutzer, der `/` aufruft, wird zu `/dashboard` weitergeleitet.
- [x] *(CR-007)* Szenario „BAC-13-006/007 landing page": anonymer Aufruf von `/` zeigt den
  "Neuigkeiten"-Abschnitt und einen konkreten Titel aus `specs/changes/CR-004-user-kategorien-erstellen.md`s
  `Nutzer-Ankündigung`-Feld (Beleg, dass die Liste aus den Specs gelesen wird).

---

## Abhängigkeiten

| Abhängigkeit | Typ | Warum |
|-------------|-----|-------|
| Feature 01 (Identität) | benötigt | `getSessionUser()` zur Erkennung bereits angemeldeter Nutzer:innen |
| Feature 02 (Prompt-Bibliothek) | benötigt | `getRatingsMap()`/Prompt-Modell für den anonymisierten Showcase |

---

## Änderungshistorie

| Version | Datum | CR | Änderung |
|---------|-------|----|---------|
| 1.0 | 2026-07-06 | — | Erstversion |
| 1.1 | 2026-07-16 | CR-005 | AC-13-008/009: Neuigkeiten-Abschnitt aus `CHANGELOG.md` (dokumentierte NFR-I18N-001-Ausnahme) |
| 1.2 | 2026-07-16 | CR-006 | AC-13-008/009: Datenquelle auf kuratierte `RECENT_FEATURES`-Konstante umgestellt, NFR-I18N-001-Ausnahme entfällt |
| 1.3 | 2026-07-17 | CR-007 | AC-13-008/009: Datenquelle auf `Nutzer-Ankündigung`-Feld in Business-Specs/CRs umgestellt (Laufzeit-Parser), `RECENT_FEATURES`-Konstante entfernt, Dockerfile kopiert `specs/` neu ins Runtime-Image |
