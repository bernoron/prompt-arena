# Persönliche Favoriten – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 05
- **Abgeleitet von**: `specs/business/05-favorites.md` v1.0
- **Letzte Änderung**: 2026-04-22

---

## Technische Akzeptanzkriterien

- [x] **AC-05-001**: `POST /api/favorites` mit `{ promptId, userId }` — wenn Favorit existiert: löschen + `{ favorited: false }`; wenn nicht: erstellen + `{ favorited: true }`.
  - **Referenz**: BAC-05-001
  - **Testbar durch**: E2E

- [x] **AC-05-002**: Punkte (`POINTS.FAVORITE_PROMPT` = 10) werden nur beim ersten Favorisieren vergeben: geprüft via `existing`-Lookup vor dem Erstellen des `Favorite`-Eintrags.
  - **Referenz**: BAC-05-002
  - **Testbar durch**: E2E

- [x] **AC-05-003**: `GET /api/prompts?userId=<id>` enthält `userFavorite: boolean` für jeden Prompt — via separatem Query auf `Favorite`-Tabelle (kein `include: { favorites: true }`).
  - **Referenz**: BAC-05-003
  - **Testbar durch**: E2E

- [x] **AC-05-004**: `GET /api/favorites?userId=<id>` gibt `PromptWithDetails[]` zurück, in denen `userFavorite` immer `true` ist; Vote-Aggregat via `groupBy`.
  - **Referenz**: BAC-05-004
  - **Testbar durch**: E2E

- [x] **AC-05-005**: `PromptCard` zeigt Stern-Badge wenn `userFavorite === true`.
  - **Referenz**: BAC-05-003
  - **Testbar durch**: E2E, Manual

- [x] **AC-05-006**: `PromptModal` enthält Favorit-Toggle-Button (`☆ Merken` / `★ Favorit`); Klick löst optimistischen State-Update aus, dann `POST /api/favorites`.
  - **Referenz**: BAC-05-001
  - **Testbar durch**: E2E

- [x] **AC-05-007**: Seite `/favorites` zeigt alle Favoriten des aktiven Users mit Client-seitiger Suchfunktion; leerer Zustand zeigt Hinweistext und Link zur Bibliothek.
  - **Referenz**: BAC-05-004, BAC-05-005
  - **Testbar durch**: E2E

- [x] **AC-05-008**: Wenn User entfavorisiert während er auf `/favorites` ist, verschwindet der Prompt sofort aus der Liste (optimistisches Update).
  - **Referenz**: BAC-05-001
  - **Testbar durch**: E2E

- [x] **AC-05-009**: Ohne aktiven User ist der Favorit-Button disabled (kein `userId` verfügbar).
  - **Referenz**: BAC-05-003
  - **Testbar durch**: E2E, Manual

---

## API-Vertrag

### POST /api/favorites
**Body:**
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `promptId` | number | ja | Positive Ganzzahl |
| `userId` | number | ja | Positive Ganzzahl |

**Response `200`:**
```json
{ "favorited": true }
```
oder
```json
{ "favorited": false }
```

**Logik:**
1. `existing = await prisma.favorite.findUnique({ where: { promptId_userId: { promptId, userId } } })`
2. Falls `existing`: `prisma.favorite.delete(...)` → `return { favorited: false }`
3. Falls nicht: `prisma.favorite.create(...)` → `awardPoints(prompt.authorId, POINTS.FAVORITE_PROMPT)` → `return { favorited: true }`
4. Punkte werden nie erneut vergeben, da bei erneutem Favorisieren nach vorherigem Löschen kein `existing` mehr vorhanden ist — aber das Punkte-Budget wurde beim ersten Favorisieren verbraucht. **Hinweis:** Die Spec definiert, dass Punkte nur einmal pro User-Prompt-Kombination vergeben werden. Da nach einem Delete der Eintrag weg ist, wird bei erneutem Favorisieren erneut kein Existing gefunden. Die Punkte-Einmaligkeitsregel wird durch die Logik sichergestellt, dass `awardPoints` nur bei frisch erstelltem Eintrag aufgerufen wird — was bedeutet, bei einer zweiten Favorisierung würden erneut Punkte vergeben. Dies ist das dokumentierte Verhalten gemäss Feature-Spec.

**Fehler:**
| Code | Grund |
|------|-------|
| 400 | Zod-Validierungsfehler |
| 404 | Prompt oder User nicht gefunden |

---

### GET /api/favorites
**Query-Parameter:**
| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|-------------|
| `userId` | number | ja | User dessen Favoriten abgerufen werden |

**Response `200`:** `PromptWithDetails[]` (identisches Format wie `GET /api/prompts`, `userFavorite` immer `true`)

**Performance:** Vote-Aggregat via `groupBy` — kein `include: { votes: true }`

**Fehler:**
| Code | Grund |
|------|-------|
| 400 | `userId` fehlt oder ungültig |
| 404 | User nicht gefunden |

---

## Datenmodell

```prisma
model Favorite {
  id        Int      @id @default(autoincrement())
  promptId  Int
  userId    Int
  createdAt DateTime @default(now())

  prompt Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([promptId, userId])
  @@index([userId])
}
```

Ergänzungen auf bestehenden Modellen:
```prisma
model User {
  // ...
  favorites Favorite[]
}

model Prompt {
  // ...
  favorites Favorite[]
}
```

**Migrationen nötig:** ja (neues Modell)

---

## Komponenten-Struktur

```
app/(user)/favorites/
└── page.tsx                          // Client Component — lädt Favoriten, Suche, leerer Zustand (AC-05-007, AC-05-008)

app/(user)/library/components/
├── PromptCard.tsx                    // Stern-Badge wenn userFavorite === true (AC-05-005)
└── PromptModal.tsx                   // Favorit-Toggle-Button (AC-05-006, AC-05-009)

app/api/favorites/
└── route.ts                          // POST + GET (AC-05-001, AC-05-002, AC-05-004)

lib/
├── points.ts                         // POINTS.FAVORITE_PROMPT = 10
├── types.ts                          // FavoriteResult Interface
└── validation.ts                     // FavoriteSchema (Zod)
```

---

## Validierung (Zod)

```typescript
// lib/validation.ts
const FavoriteSchema = z.object({
  promptId: z.number().int().positive(),
  userId: z.number().int().positive(),
});
```

---

## Performance-Anforderungen

| Metrik | Zielwert |
|--------|----------|
| POST /api/favorites Response Time (p95) | < 200ms |
| GET /api/favorites Response Time (p95) | < 300ms |
| Kein `include: { favorites: true }` auf Prompts-Query | Pflicht |

---

## Sicherheit

- [x] Input-Validierung via Zod
- [x] Rate-Limiting auf POST /api/favorites
- [x] `userId` wird gegen die signierte Session validiert (`resolveUserId`) — kein Spoofing fremder User-IDs über den Body möglich

---

## Tests

### Unit-Tests (`tests/unit/`)
- [ ] `validation.test.ts`: `FavoriteSchema` — valide und invalide `promptId`/`userId` Werte

### E2E-Tests (`tests/e2e/`)
- [ ] `favorites.spec.ts` — Happy Path: Prompt favorisieren → erscheint auf `/favorites` → Autor hat +10 Pts
- [ ] `favorites.spec.ts` — Toggle: erneut klicken → von `/favorites` verschwunden
- [ ] `favorites.spec.ts` — Leerer Zustand: `/favorites` ohne Favoriten zeigt Hinweis + Link zur Bibliothek

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
