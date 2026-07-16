# Öffentliche Startseite – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.1
- **Feature-Nr**: 13
- **Abgeleitet von**: `specs/business/13-landing-page.md` v1.1
- **Letzte Änderung**: 2026-07-16

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

- [x] **AC-13-008**: `lib/services/changelog-service.ts` exportiert `getRecentFeatures(limit)`. Datenquelle ist `CHANGELOG.md` im Repo-Root (von Release-Please aus Conventional Commits generiert, `specs/technical/99-pipeline.md`) — **keine neue Tabelle/Migration**. Die reine Parsing-Funktion `parseChangelogFeatures(markdown, limit)` liest ausschliesslich Einträge unter `### Features`-Überschriften, in Datei-Reihenfolge (= neuestes Release zuerst), und bricht nach `limit` Treffern ab. Ist `CHANGELOG.md` nicht lesbar, liefert die Funktion `[]` statt eines Fehlers (NFR-AVAIL-003). *(CR-005)*
  - **Referenz**: BAC-13-006
  - **Testbar durch**: Unit

- [x] **AC-13-009**: `app/page.tsx` rendert unterhalb des Prompt-Showcase einen "Neuigkeiten"-Abschnitt mit bis zu 10 Einträgen aus `getRecentFeatures(10)` (Datum, optionales Scope-Label, Beschreibung). Liefert die Funktion ein leeres Array, wird der gesamte Abschnitt nicht gerendert (analog AC-13-007). *(CR-005)*
  - **Referenz**: BAC-13-006, BAC-13-007
  - **Testbar durch**: E2E

### Dokumentierte Ausnahme von NFR-I18N-001 (CR-005)

Die Beschreibungstexte im Neuigkeiten-Abschnitt sind unveränderte Commit-Messages aus
`CHANGELOG.md` und damit englisch/technisch (z. B. „implement first-login onboarding funnel").
Eine automatische Übersetzung ins Deutsche ist nicht Teil dieses CRs — die Alternative (Option 2:
manuell gepflegte, deutsche Liste) wurde vom Product Owner zugunsten von Option 1
(CHANGELOG.md, pflegefrei) explizit abgelehnt (siehe CR-005). Der Conventional-Commit-`scope`
(z. B. `onboarding`) wird als technisches Label behandelt (zulässige Ausnahme laut NFR-I18N-001),
die restliche Beschreibung bleibt bewusst unübersetzt.

---

## API-Vertrag

Kein neuer HTTP-Endpunkt. `getTopPrompts()` wird direkt aus der Server Component
`app/page.tsx` aufgerufen (kein Self-Fetch-Roundtrip), analog zu `getPromptById()` auf der
bestehenden Prompt-Detailseite.

---

## Datenmodell

Keine Schema-Änderung. Nutzt das bestehende `Prompt`-Modell (`prisma/schema.prisma`)
read-only. *(CR-005: Neuigkeiten-Bereich liest `CHANGELOG.md` als Datei, ebenfalls keine
Schema-Änderung.)*

**Migrationen nötig:** nein

---

## Komponenten-Struktur

```
app/
└── page.tsx                    // Server Component, Landingpage / Redirect (AC-13-002..004, AC-13-006, AC-13-007, AC-13-009)

middleware.ts                   // isPublicPath('/')  (AC-13-001)

lib/services/
├── prompt-service.ts            // getTopPrompts()  (AC-13-005)
└── changelog-service.ts         // getRecentFeatures(), parseChangelogFeatures()  (AC-13-008, CR-005)
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
| *(CR-005)* Zusätzliche Dateisystem-Reads pro Aufruf | 0 im Regelfall — `getRecentFeatures()` ist über `lib/cache.ts` für 10 Minuten gecacht, da `CHANGELOG.md` sich nur bei einem Deploy ändert |

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
- [x] *(CR-005)* `tests/unit/lib/changelog-service.test.ts` — `parseChangelogFeatures()`:
  extrahiert gescopte und ungescopte Einträge nur aus `### Features`-Abschnitten (nicht aus
  „Bug Fixes"/„Performance Improvements"), respektiert `limit`, liefert `[]` ohne
  „Features"-Abschnitt.

### E2E-Tests (`tests/e2e/`)
- [x] `tests/e2e/spec-contracts.spec.ts` Szenario „BAC-13 landing page": anonymer Aufruf von `/` liefert 200 (kein Redirect zu `/login`) und zeigt den CTA-Link zur Registrierung; ein eingeloggter Nutzer, der `/` aufruft, wird zu `/dashboard` weitergeleitet.
- [x] *(CR-005)* Szenario „BAC-13-006/007 landing page": anonymer Aufruf von `/` zeigt den
  "Neuigkeiten"-Abschnitt (CHANGELOG.md dieses Repos hat immer mindestens einen
  „Features"-Eintrag, daher wird hier der Nicht-Leer-Pfad geprüft; der Leer-Pfad ist über den
  Unit-Test „liefert `[]` ohne Features-Abschnitt" abgedeckt).

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
