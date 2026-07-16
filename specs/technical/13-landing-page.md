# Öffentliche Startseite – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.2
- **Feature-Nr**: 13
- **Abgeleitet von**: `specs/business/13-landing-page.md` v1.2
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

- [x] **AC-13-008**: `lib/constants.ts` exportiert `RECENT_FEATURES` — eine kuratierte, von Hand gepflegte Liste (`{ date, icon, title, description }`, Deutsch, max. 10 Einträge, absteigend nach `date` sortiert). Kein Dateisystem-/DB-Zugriff mehr nötig. Entwickler ergänzen einen Eintrag im Code, wenn ein echtes, für Nutzer:innen sichtbares Feature geshippt wird — interne Refactorings/Migrationen/Security-Fixes gehören **nicht** in diese Liste. *(CR-006, ersetzt die CHANGELOG.md-Auswertung aus CR-005)*
  - **Referenz**: BAC-13-006
  - **Testbar durch**: Unit

- [x] **AC-13-009**: `app/page.tsx` rendert unterhalb des Prompt-Showcase einen "Neuigkeiten"-Abschnitt mit den ersten 10 Einträgen aus `RECENT_FEATURES` (Icon, Titel, Datum, Beschreibung). Ist die Liste leer, wird der gesamte Abschnitt nicht gerendert (analog AC-13-007). *(CR-005, Rendering-Logik in CR-006 auf die neue Datenquelle umgestellt, kein Scope-Badge mehr)*
  - **Referenz**: BAC-13-006, BAC-13-007
  - **Testbar durch**: E2E

**CR-006-Historie:** CR-005 hatte diese Daten automatisch aus `CHANGELOG.md` (Release-Please-Commit-Messages) gezogen. Auf Produktion sichtbar wurde das als zu technisch/englisch bewertet (rohe Commit-Messages wie „add PointsLedger to close a vote-award race condition" neben echten Nutzer-Features) — CR-006 ersetzt die Datenquelle durch eine kuratierte, deutsche Konstante und macht damit die in CR-005 dokumentierte NFR-I18N-001-Ausnahme hinfällig: Alle Texte sind jetzt regulär deutsch, keine Ausnahme mehr nötig.

---

## API-Vertrag

Kein neuer HTTP-Endpunkt. `getTopPrompts()` wird direkt aus der Server Component
`app/page.tsx` aufgerufen (kein Self-Fetch-Roundtrip), analog zu `getPromptById()` auf der
bestehenden Prompt-Detailseite.

---

## Datenmodell

Keine Schema-Änderung. Nutzt das bestehende `Prompt`-Modell (`prisma/schema.prisma`)
read-only. *(CR-006: Neuigkeiten-Bereich liest `RECENT_FEATURES` aus `lib/constants.ts` — eine
Code-Konstante, kein DB-/Dateisystem-Zugriff.)*

**Migrationen nötig:** nein

---

## Komponenten-Struktur

```
app/
└── page.tsx                    // Server Component, Landingpage / Redirect (AC-13-002..004, AC-13-006, AC-13-007, AC-13-009)

middleware.ts                   // isPublicPath('/')  (AC-13-001)

lib/services/
└── prompt-service.ts            // getTopPrompts()  (AC-13-005)

lib/constants.ts                 // RECENT_FEATURES  (AC-13-008, CR-006)
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
| *(CR-006)* Zusätzliche DB-/Dateisystem-Reads für Neuigkeiten-Abschnitt | 0 — `RECENT_FEATURES` ist eine Code-Konstante |

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
- [x] *(CR-006)* `tests/unit/lib/constants.test.ts` — `RECENT_FEATURES`: max. 10 Einträge,
  absteigend nach `date` sortiert, jeder Eintrag hat nicht-leeres Icon/Titel/Beschreibung + gültiges
  ISO-Datum, keine Commit-Message-Artefakte (Markdown-Links, `scope:`-Präfixe) in den Texten.

### E2E-Tests (`tests/e2e/`)
- [x] `tests/e2e/spec-contracts.spec.ts` Szenario „BAC-13 landing page": anonymer Aufruf von `/` liefert 200 (kein Redirect zu `/login`) und zeigt den CTA-Link zur Registrierung; ein eingeloggter Nutzer, der `/` aufruft, wird zu `/dashboard` weitergeleitet.
- [x] *(CR-006)* Szenario „BAC-13-006/007 landing page": anonymer Aufruf von `/` zeigt den
  "Neuigkeiten"-Abschnitt und einen konkreten kuratierten Titel aus `RECENT_FEATURES`
  (Beleg, dass die Liste die deutsche, kuratierte Fassung ist, nicht CHANGELOG.md).

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
