# Bewertungssystem (1–5 Sterne) – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 03
- **Abgeleitet von**: `specs/business/03-voting.md` v1.0
- **Letzte Änderung**: 2026-04-22

---

## Technische Akzeptanzkriterien

- [ ] **AC-03-001**: `POST /api/votes` führt Upsert via `@@unique([promptId, userId])` durch — erstellt eine neue Bewertung oder überschreibt die bestehende; gibt `{ avgRating, voteCount }` zurück.
  - **Referenz**: BAC-03-001
  - **Testbar durch**: E2E, Unit

- [ ] **AC-03-002**: Punkte (`POINTS.VOTE_ON_PROMPT` = 3) werden nur vergeben, wenn zuvor kein Vote dieser User-Prompt-Kombination existierte — geprüft via `existing`-Check vor dem Upsert.
  - **Referenz**: BAC-03-002
  - **Testbar durch**: E2E

- [ ] **AC-03-003**: `GET /api/prompts?userId=<id>` liefert `userVote: number | null` für jeden Prompt des eingeloggten Users.
  - **Referenz**: BAC-03-002, BAC-03-005
  - **Testbar durch**: E2E

- [ ] **AC-03-004**: Die Stern-UI im `PromptModal` zeigt die aktuelle User-Bewertung hervorgehoben; bei `authorId === userId` sind die Sterne-Buttons `disabled` mit erläuterndem Tooltip.
  - **Referenz**: BAC-03-003, BAC-03-005
  - **Testbar durch**: E2E, Manual

- [ ] **AC-03-005**: `PromptCard` und `PromptModal` zeigen `avgRating` (auf 1 Dezimalstelle) und `voteCount`.
  - **Referenz**: BAC-03-004
  - **Testbar durch**: E2E

- [ ] **AC-03-006**: Serverseitig wird geprüft, dass `userId !== prompt.authorId`; ein Vote auf den eigenen Prompt gibt HTTP 403 zurück.
  - **Referenz**: BAC-03-003
  - **Testbar durch**: E2E

---

## API-Vertrag

### POST /api/votes
**Body:**
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `promptId` | number | ja | Positive Ganzzahl |
| `userId` | number | ja | Positive Ganzzahl |
| `value` | number | ja | Integer 1–5 |

**Response `200`:**
```json
{
  "avgRating": 4.2,
  "voteCount": 8
}
```

**Logik:**
1. Prüfe ob `Vote` mit `promptId + userId` existiert → `existing`
2. Falls nicht: `awardPoints(userId, POINTS.VOTE_ON_PROMPT)` (3 Punkte)
3. Upsert: `create` oder `update` auf `@@unique([promptId, userId])`
4. Berechne neues `avgRating` via `groupBy` oder `aggregate`

**Fehler:**
| Code | Grund |
|------|-------|
| 400 | Zod-Validierungsfehler (value nicht 1–5) |
| 403 | User versucht eigenen Prompt zu bewerten |
| 404 | Prompt oder User nicht gefunden |

---

## Datenmodell

```prisma
model Vote {
  id        Int      @id @default(autoincrement())
  promptId  Int
  userId    Int
  value     Int      // 1–5
  createdAt DateTime @default(now())

  prompt Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([promptId, userId])
  @@index([userId])
}
```

**Migrationen nötig:** ja (Initialschema)

---

## Komponenten-Struktur

```
app/(user)/library/components/
└── PromptModal.tsx                   // Stern-UI, disabled-State für Autor (AC-03-004, AC-03-005)

components/
└── StarRating.tsx                    // Wiederverwendbare Stern-Bewertungskomponente (AC-03-004)

app/api/votes/
└── route.ts                          // POST (AC-03-001, AC-03-002, AC-03-006)

lib/
├── points.ts                         // POINTS.VOTE_ON_PROMPT = 3
├── types.ts                          // VoteResult Interface
└── validation.ts                     // VoteSchema (Zod)
```

---

## Validierung (Zod)

```typescript
// lib/validation.ts
const VoteSchema = z.object({
  promptId: z.number().int().positive(),
  userId: z.number().int().positive(),
  value: z.number().int().min(1).max(5),
});
```

---

## Performance-Anforderungen

| Metrik | Zielwert |
|--------|----------|
| POST /api/votes Response Time (p95) | < 200ms |
| avgRating-Berechnung | Via Prisma `aggregate` oder `groupBy` — kein In-Memory-Aggregat |

---

## Sicherheit

- [x] Input-Validierung via Zod (`value` muss 1–5 sein)
- [x] Serverseitige Prüfung: User darf keinen eigenen Prompt bewerten (HTTP 403)
- [x] Rate-Limiting auf POST /api/votes
- [x] `PathId.safeParse()` auf alle ID-Parameter

---

## Tests

### Unit-Tests (`tests/unit/`)
- [ ] `validation.test.ts`: `VoteSchema` — valide Werte (1, 3, 5), invalide (0, 6, Dezimalzahl, fehlend)

### E2E-Tests (`tests/e2e/`)
- [ ] `voting.spec.ts` — Happy Path: Stern klicken → avgRating aktualisiert → FloatingPoints sichtbar → Punkte gestiegen
- [ ] `voting.spec.ts` — Wiederholung: Bewertung ändern → keine erneute Punkte-Vergabe
- [ ] `voting.spec.ts` — Edge Case: Eigener Prompt → Sterne disabled, kein POST möglich

---

## Abhängigkeiten

| Abhängigkeit | Typ | Warum |
|-------------|-----|-------|
| Feature 01 – Identity | benötigt | `userId` referenziert User |
| Feature 02 – Prompt-Bibliothek | benötigt | `promptId` referenziert Prompt |
| Feature 04 – Gamification | benötigt | `awardPoints()` aus `lib/points.ts` |

---

## Änderungshistorie

| Version | Datum | CR | Änderung |
|---------|-------|----|---------|
| 1.0 | 2026-04-22 | — | Erstversion |
