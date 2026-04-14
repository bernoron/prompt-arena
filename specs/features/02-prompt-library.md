# Feature: Prompt-Bibliothek & Einreichung

## Metadaten
- **Status**: `implemented`
- **Feature-Nr**: 02
- **Letzte Änderung**: 2026-04-13

---

## User Story
Als Mitarbeiter will ich Prompts anderer in einer gefilterbaren Bibliothek finden und eigene Prompts einreichen, damit das KI-Wissen im Unternehmen geteilt wird.

---

## Akzeptanzkriterien

- [x] **AC-02-001**: Prompt einreichen mit Titel (DE+EN), Inhalt (DE+EN), Kategorie, Schwierigkeit
- [x] **AC-02-002**: Alle Prompts abrufbar (GET /api/prompts) inkl. Autor, avgRating, voteCount
- [x] **AC-02-003**: Filter nach Kategorie (Writing, Email, Analyse, Excel, alle)
- [x] **AC-02-004**: Volltext-Suche über Titel und Inhalt (DE+EN)
- [x] **AC-02-005**: Sortierung: Neueste | Meistgenutzt
- [x] **AC-02-006**: Prompt-Modal zeigt vollständigen Inhalt + Kopieren-Button
- [x] **AC-02-007**: "Benutzt"-Button trackt Nutzung, Autor erhält +5 Punkte
- [x] **AC-02-008**: PromptCard zeigt Rarity-Badge basierend auf usageCount
- [x] **AC-02-009**: Autor erhält +20 Punkte beim Einreichen

---

## API-Vertrag

### GET /api/prompts
**Query**: `?category=Writing&search=email&userId=1&sortBy=most-used`
**Response 200**: `PromptWithDetails[]`
```json
[{
  "id": 1, "title": "...", "titleEn": "...", "content": "...", "contentEn": "...",
  "category": "Writing", "difficulty": "Einstieg",
  "authorId": 1, "author": { "id": 1, "name": "...", "avatarColor": "..." },
  "usageCount": 42, "avgRating": 4.2, "voteCount": 8,
  "userVote": 5, "userFavorite": true,
  "createdAt": "ISO"
}]
```
**Performance**: Kein `include: { votes: true }` — Aggregat via `groupBy` + separater userVotes-Query

### POST /api/prompts
**Body**: `{ title, titleEn?, content, contentEn?, category, difficulty, authorId, challengeId? }`
**Response 201**: Prompt-Objekt
**Seiteneffekt**: `awardPoints(authorId, POINTS.SUBMIT_PROMPT)`

### POST /api/usage
**Body**: `{ promptId, userId }`
**Response 200**: `{ usageCount: number }`
**Seiteneffekt**: `awardPoints(prompt.authorId, POINTS.USE_PROMPT)`, `prompt.usageCount++`

---

## Datenmodell

```prisma
model Prompt {
  id         Int      @id @default(autoincrement())
  title      String
  titleEn    String
  content    String
  contentEn  String
  category   String
  difficulty String
  authorId   Int
  usageCount Int      @default(0)
  createdAt  DateTime @default(now())

  author               User                  @relation(...)
  votes                Vote[]
  challengeSubmissions ChallengeSubmission[]
  favorites            Favorite[]

  @@index([authorId])
  @@index([category])
  @@index([usageCount])
  @@index([createdAt])
}
```

---

## UI-Verhalten

### Seite: `/library`
- Filterbalk: Kategorie-Tabs + Schwierigkeits-Toggle + Suchfeld + Sort-Toggle
- Grid aus PromptCards
- Klick auf Card → Modal öffnet
- Modal: Titel, Inhalt, Kopieren-Button, Bewertungs-Sterne, Benutzt-Button, Favorit-Toggle

### Seite: `/submit`
- Formular: Titel DE, Titel EN (optional), Inhalt DE, Inhalt EN (optional), Kategorie, Schwierigkeit
- Wenn aktive Challenge vorhanden: Option zur Challenge-Einreichung
- Submit → Weiterleitung zu /library

### Komponente: `PromptCard`
- Zeigt: Kategorie-Badge, Schwierigkeits-Badge, Rarity-Glow, Titel, Autor, Rating, Nutzungen
- Wenn `userFavorite === true`: ★-Stern oben links

### Rarity-System
| usageCount | Rarity | Effekt |
|-----------|--------|--------|
| ≥ 60 | Legendary | Goldener Glow |
| ≥ 30 | Epic | Lila Glow |
| ≥ 10 | Rare | Blauer Glow |
| < 10 | Common | Kein Glow |

---

## Punkte-Impact
| Aktion | Punkte | Empfänger |
|--------|--------|-----------|
| Prompt einreichen | +20 | Einreicher |
| Prompt wird benutzt | +5 | Autor |

---

## Tests

### E2E
- Happy Path: Prompt einreichen → erscheint in Bibliothek → Modal öffnen → Kopieren
- Filter: nach Kategorie filtern → nur passende Cards sichtbar
- Benutzt: Button klicken → FloatingPoints erscheint

### Unit
- `CreatePromptSchema`: valide/invalide Inputs
