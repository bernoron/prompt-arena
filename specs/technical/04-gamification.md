# Punkte, Level & Rangliste – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 04
- **Abgeleitet von**: `specs/business/04-gamification.md` v1.0
- **Letzte Änderung**: 2026-04-22

---

## Technische Akzeptanzkriterien

- [ ] **AC-04-001**: `awardPoints(userId, amount)` in `lib/points.ts` inkrementiert `user.totalPoints` atomar via Prisma `update` mit `increment`; berechnet danach das neue Level und speichert es.
  - **Referenz**: BAC-04-001
  - **Testbar durch**: Unit

- [ ] **AC-04-002**: `getLevel(points: number): string` gibt den korrekten Level-String basierend auf den Schwellen zurück; wird nach jeder `awardPoints`-Ausführung gespeichert.
  - **Referenz**: BAC-04-002
  - **Testbar durch**: Unit

- [ ] **AC-04-003**: Das `LevelUpModal` erscheint client-seitig, wenn nach einer Aktion der Level-String des Users sich ändert — geprüft durch Vergleich des alten und neuen Levels.
  - **Referenz**: BAC-04-003
  - **Testbar durch**: E2E

- [ ] **AC-04-004**: `/dashboard` zeigt `totalPoints`, `level`, globalen `rank` (aus `GET /api/users/[id]`) und `getLevelProgress(points)` als Prozentwert.
  - **Referenz**: BAC-04-004
  - **Testbar durch**: E2E

- [ ] **AC-04-005**: `/dashboard` zeigt die letzten 3 eigenen Prompts und 3 Trending Prompts (höchster `usageCount`).
  - **Referenz**: BAC-04-004
  - **Testbar durch**: E2E

- [ ] **AC-04-006**: `/leaderboard` lädt `GET /api/users` (sortiert nach `totalPoints DESC`) und hebt den aktiven User hervor.
  - **Referenz**: BAC-04-005
  - **Testbar durch**: E2E

- [ ] **AC-04-007**: `FloatingPoints`-Komponente wird über `triggerFloat(label: string)` ausgelöst; zeigt die Einblendung für 2 Sekunden; verschwindet danach automatisch.
  - **Referenz**: BAC-04-006
  - **Testbar durch**: E2E, Manual

- [ ] **AC-04-008**: `/profile/[id]` zeigt User-Stats (Punkte, Level, Rang, Prompt-Anzahl, Durchschnittsbewertung eigener Prompts) und alle eigenen Prompts.
  - **Referenz**: BAC-04-004
  - **Testbar durch**: E2E

---

## API-Vertrag

### Kein eigener API-Endpunkt

Punkte und Level werden als Seiteneffekt in anderen API-Routen vergeben.
Dashboard und Rangliste nutzen `GET /api/users` und `GET /api/users/[id]` (definiert in Feature 01).

### Punkte-Konstanten (`lib/points.ts`)

```typescript
export const POINTS = {
  SUBMIT_PROMPT:    20,  // Feature 02
  USE_PROMPT:        5,  // Feature 02
  VOTE_ON_PROMPT:    3,  // Feature 03
  FAVORITE_PROMPT:  10,  // Feature 05
  CHALLENGE_SUBMIT: 30,  // Feature 06
  CHALLENGE_WIN:   100,  // Feature 06 (Admin-Vergabe)
  COMPLETE_LESSON:  15,  // Feature 08/09
} as const;
```

### Level-Schwellen (`lib/points.ts`)

```typescript
export function getLevel(points: number): string {
  if (points >= 600) return 'KI-Botschafter';
  if (points >= 300) return 'Prompt-Schmied';
  if (points >= 100) return 'Prompt-Handwerker';
  return 'Prompt-Lehrling';
}

export function getLevelProgress(points: number): number {
  // Gibt Prozentwert 0–100 zurück für Fortschrittsbalken
}
```

---

## Datenmodell

Kein eigenes Prisma-Modell — Punkte und Level sind Felder auf `User`:

```prisma
model User {
  totalPoints Int    @default(0)
  level       String @default("Prompt-Lehrling")
  @@index([totalPoints])
  // ... weitere Felder in Feature 01 definiert
}
```

**Migrationen nötig:** nein (Felder im User-Modell aus Feature 01)

---

## Komponenten-Struktur

```
app/(user)/dashboard/
└── page.tsx                          // Server Component — lädt User + Prompts (AC-04-004, AC-04-005)

app/(user)/leaderboard/
└── page.tsx                          // Server Component — lädt alle User (AC-04-006)

app/(user)/profile/[id]/
└── page.tsx                          // Server Component — User-Stats + Prompts (AC-04-008)

components/
├── FloatingPoints.tsx                // Client Component — animierte Einblendung (AC-04-007)
├── LevelUpModal.tsx                  // Client Component — Level-Up Anzeige (AC-04-003)
├── LevelBadge.tsx                    // Darstellung des Level-Titels (AC-04-004)
└── ProgressBar.tsx                   // Wiederverwendbarer Fortschrittsbalken (AC-04-004)

lib/
├── points.ts                         // POINTS, getLevel(), getLevelProgress(), awardPoints() (AC-04-001, AC-04-002)
└── types.ts                          // LevelInfo, UserWithStats Interfaces
```

---

## Validierung (Zod)

Keine eigene Validierung — `awardPoints` ist eine interne Server-Funktion ohne HTTP-Input.

---

## Performance-Anforderungen

| Metrik | Zielwert |
|--------|----------|
| `awardPoints` DB-Operation (p95) | < 50ms (einzelnes `UPDATE`) |
| `/dashboard` Page Load (p95) | < 500ms |
| `/leaderboard` Page Load (p95) | < 300ms |

---

## Sicherheit

- [x] `awardPoints` ist eine Server-only Funktion — nicht direkt via HTTP aufrufbar
- [x] Keine Magic Values inline — alle Punkte-Beträge aus `lib/points.ts`
- [x] Level-Berechnung erfolgt serverseitig — kein Client-seitiger Override möglich

---

## Tests

### Unit-Tests (`tests/unit/`)
- [ ] `points.test.ts`: `getLevel(points)` — alle 4 Schwellenwerte (0, 99, 100, 299, 300, 599, 600)
- [ ] `points.test.ts`: `getLevelProgress(points)` — 0 %, 50 %, 100 %, Grenzwerte
- [ ] `points.test.ts`: `POINTS`-Objekt — alle Werte positiv, `CHALLENGE_WIN > CHALLENGE_SUBMIT`

### E2E-Tests (`tests/e2e/`)
- [ ] `gamification.spec.ts` — Dashboard lädt und zeigt Punkte + Level korrekt
- [ ] `gamification.spec.ts` — Rangliste zeigt User in korrekter Reihenfolge (absteigend nach Punkten)
- [ ] `gamification.spec.ts` — FloatingPoints erscheint nach Bewertung/Einreichung

---

## Abhängigkeiten

| Abhängigkeit | Typ | Warum |
|-------------|-----|-------|
| Feature 01 – Identity | benötigt | `user.totalPoints` und `user.level` auf User-Modell |
| Prisma Client | benötigt | Atomares `increment` via `update` |

---

## Änderungshistorie

| Version | Datum | CR | Änderung |
|---------|-------|----|---------|
| 1.0 | 2026-04-22 | — | Erstversion |
