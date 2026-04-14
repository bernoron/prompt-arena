# Feature: Bewertungssystem

## Metadaten
- **Status**: `implemented`
- **Feature-Nr**: 03
- **Letzte Änderung**: 2026-04-13

---

## User Story
Als Mitarbeiter will ich Prompts mit 1–5 Sternen bewerten, damit gute Prompts aufgewertet werden und Qualitätssignale entstehen.

---

## Akzeptanzkriterien

- [x] **AC-03-001**: Ein User kann einen Prompt einmalig bewerten (1–5 Sterne) — Mehrfach-Bewertung überschreibt die alte
- [x] **AC-03-002**: Der Bewerter erhält +3 Punkte pro Bewertung (nicht pro Überschreibung)
- [x] **AC-03-003**: GET /api/prompts liefert für eingeloggten User dessen eigene Bewertung (`userVote`)
- [x] **AC-03-004**: Sterne-UI im Prompt-Modal zeigt aktuelle Bewertung des Users
- [x] **AC-03-005**: Durchschnittsbewertung (`avgRating`) und Anzahl (`voteCount`) sichtbar auf Card + Modal
- [x] **AC-03-006**: Eigene Prompts können nicht bewertet werden (Button deaktiviert)

---

## API-Vertrag

### POST /api/votes
**Body**: `{ promptId: number, userId: number, value: number (1–5) }`
**Response 200**: `{ avgRating: number, voteCount: number }`
**Logik**: Upsert (create oder update) via `@@unique([promptId, userId])`
**Seiteneffekt**: `awardPoints(userId, POINTS.VOTE_ON_PROMPT)` nur bei neuem Vote (nicht Update)

---

## Datenmodell

```prisma
model Vote {
  id        Int      @id @default(autoincrement())
  promptId  Int
  userId    Int
  value     Int      // 1–5
  createdAt DateTime @default(now())

  prompt Prompt @relation(fields: [promptId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@unique([promptId, userId])
  @@index([userId])
}
```

---

## UI-Verhalten

### Im Prompt-Modal
- 5 Stern-Buttons (☆/★)
- Aktive Bewertung des Users hervorgehoben
- Klick auf Stern → POST /api/votes → FloatingPoints "+3 Pts" erscheint
- Eigener Prompt: Sterne-Buttons disabled + Tooltip "Eigene Prompts nicht bewertbar"

---

## Punkte-Impact
| Aktion | Punkte | Empfänger |
|--------|--------|-----------|
| Prompt bewerten (neu) | +3 | Bewerter |

---

## Tests

### E2E
- Happy Path: Stern klicken → avgRating aktualisiert → FloatingPoints sichtbar
- Edge Case: Eigener Prompt → Sterne disabled

### Unit
- `VoteSchema`: value muss 1–5 sein
