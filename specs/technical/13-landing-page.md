# Öffentliche Startseite – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 13
- **Abgeleitet von**: `specs/business/13-landing-page.md` v1.0
- **Letzte Änderung**: 2026-07-06

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

---

## API-Vertrag

Kein neuer HTTP-Endpunkt. `getTopPrompts()` wird direkt aus der Server Component
`app/page.tsx` aufgerufen (kein Self-Fetch-Roundtrip), analog zu `getPromptById()` auf der
bestehenden Prompt-Detailseite.

---

## Datenmodell

Keine Schema-Änderung. Nutzt das bestehende `Prompt`-Modell (`prisma/schema.prisma`)
read-only.

**Migrationen nötig:** nein

---

## Komponenten-Struktur

```
app/
└── page.tsx                    // Server Component, Landingpage / Redirect (AC-13-002..004, AC-13-006, AC-13-007)

middleware.ts                   // isPublicPath('/')  (AC-13-001)

lib/services/
└── prompt-service.ts            // getTopPrompts()  (AC-13-005)
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

### E2E-Tests (`tests/e2e/`)
- [x] `tests/e2e/spec-contracts.spec.ts` Szenario „BAC-13 landing page": anonymer Aufruf von `/` liefert 200 (kein Redirect zu `/login`) und zeigt den CTA-Link zur Registrierung; ein eingeloggter Nutzer, der `/` aufruft, wird zu `/dashboard` weitergeleitet.

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
