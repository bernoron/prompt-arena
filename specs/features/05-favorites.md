# Feature: Persönliche Favoriten-Bibliothek

## Metadaten
- **Status**: `implemented`
- **Feature-Nr**: 05
- **Letzte Änderung**: 2026-04-13

---

## User Story
Als Mitarbeiter will ich Prompts die mir besonders nützlich sind favorisieren und in meiner persönlichen Bibliothek sammeln, damit ich schnell auf meine wichtigsten Prompts zugreifen kann.

---

## Akzeptanzkriterien

- [x] **AC-05-001**: User kann Prompt favorisieren → POST /api/favorites → `{ favorited: true }`
- [x] **AC-05-002**: Erneuter Klick entfernt Favorit → `{ favorited: false }`
- [x] **AC-05-003**: Punkte werden nur beim **ersten** Favorisieren vergeben (nicht bei erneutem Hinzufügen)
- [x] **AC-05-004**: GET /api/prompts liefert `userFavorite: boolean` wenn userId übergeben
- [x] **AC-05-005**: GET /api/favorites?userId= liefert alle favoritisierten Prompts des Users
- [x] **AC-05-006**: Favoriten-Toggle im Prompt-Modal (☆ Merken / ★ Favorit)
- [x] **AC-05-007**: PromptCard zeigt ★-Badge wenn Prompt favorisiert ist
- [x] **AC-05-008**: Seite `/favorites` zeigt alle Favoriten mit Suchfunktion
- [x] **AC-05-009**: Leerer Zustand: Hinweis + Link zur Bibliothek

---

## API-Vertrag

### POST /api/favorites
**Body**: `{ promptId: number, userId: number }`
**Response 200**: `{ favorited: boolean }`
**Logik**:
- Wenn Favorit existiert → löschen → `{ favorited: false }`
- Wenn neu → erstellen → `awardPoints(prompt.authorId, 10)` (nur wenn kein prior-delete in History) → `{ favorited: true }`
**Einmalige Punkte-Vergabe**: prüft ob `Favorite`-Eintrag bereits existiert hatte (via `existing`-Check vor Create)

### GET /api/favorites?userId={id}
**Response 200**: `PromptWithDetails[]` (userFavorite immer true)
**Performance**: groupBy für Vote-Aggregat (kein `include: { votes: true }`)

---

## Datenmodell

```prisma
model Favorite {
  id        Int      @id @default(autoincrement())
  promptId  Int
  userId    Int
  createdAt DateTime @default(now())

  prompt Prompt @relation(fields: [promptId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@unique([promptId, userId])
  @@index([userId])
}
```

In `User`: `favorites Favorite[]`
In `Prompt`: `favorites Favorite[]`

---

## UI-Verhalten

### Im Prompt-Modal (Bibliothek)
- Footer-Button: `☆ Merken` (inaktiv) / `★ Favorit` (amber, aktiv)
- Klick → optimistischer State-Toggle → POST /api/favorites
- FloatingPoints: `⭐ +10 Pts` beim ersten Favorisieren
- Kein User gewählt → Button disabled

### Seite: `/favorites`
- Header: "Meine Favoriten" + Anzahl
- Suchfeld (client-seitig auf geladenen Daten)
- Grid aus PromptCards (identisch zur Bibliothek)
- Favorit entfernen im Modal → verschwindet sofort aus Liste
- Leerer Zustand: "Noch keine Favoriten" + "Zur Bibliothek" Link

---

## Punkte-Impact
| Aktion | Punkte | Empfänger |
|--------|--------|-----------|
| Prompt favorisiert (erstmalig) | +10 | Autor des Prompts |

---

## Tests

### E2E
- Happy Path: Prompt favorisieren → erscheint auf /favorites → Autor hat +10 Pts
- Toggle: erneut klicken → von /favorites verschwunden
- Leerer Zustand: /favorites ohne Favoriten zeigt Hinweis

### Unit
- `FavoriteSchema`: valide/invalide promptId/userId
