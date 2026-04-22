# Prompt-Bibliothek & Einreichung – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 02
- **Abgeleitet von**: `specs/business/02-prompt-library.md` v1.0
- **Letzte Änderung**: 2026-04-22

---

## Technische Akzeptanzkriterien

- [ ] **AC-02-001**: `POST /api/prompts` erstellt einen Prompt mit `title`, `titleEn`, `content`, `contentEn`, `category`, `difficulty`, `authorId`; vergibt `POINTS.SUBMIT_PROMPT` (20) an den Autor; gibt Status 201 zurück.
  - **Referenz**: BAC-02-001
  - **Testbar durch**: E2E, Unit

- [ ] **AC-02-002**: `GET /api/prompts` gibt `PromptWithDetails[]` zurück, inkl. berechneter `avgRating`, `voteCount` (via `groupBy`), `userVote` und `userFavorite` (wenn `userId` übergeben).
  - **Referenz**: BAC-02-002
  - **Testbar durch**: E2E

- [ ] **AC-02-003**: `GET /api/prompts?category=Writing` filtert korrekt; `category=all` oder kein Parameter gibt alle zurück.
  - **Referenz**: BAC-02-003
  - **Testbar durch**: E2E

- [ ] **AC-02-004**: `GET /api/prompts?search=<term>` führt Volltextsuche über `title`, `titleEn`, `content`, `contentEn` durch (case-insensitiv, via Prisma `contains`).
  - **Referenz**: BAC-02-004
  - **Testbar durch**: E2E

- [ ] **AC-02-005**: `GET /api/prompts?sortBy=most-used` sortiert nach `usageCount DESC`; Standardsortierung ist `createdAt DESC`.
  - **Referenz**: BAC-02-005
  - **Testbar durch**: E2E

- [ ] **AC-02-006**: Das `PromptModal` zeigt vollständigen Inhalt; der Kopieren-Button überträgt `content` in die Zwischenablage via `navigator.clipboard.writeText`.
  - **Referenz**: BAC-02-006
  - **Testbar durch**: E2E, Manual

- [ ] **AC-02-007**: `POST /api/usage` mit `{ promptId, userId }` inkrementiert `prompt.usageCount` und vergibt `POINTS.USE_PROMPT` (5) an den Autor; gibt `{ usageCount: number }` zurück.
  - **Referenz**: BAC-02-007
  - **Testbar durch**: E2E

- [ ] **AC-02-008**: `PromptCard` zeigt Rarity-Badge und optionalen Glow-Effekt basierend auf `usageCount`: Common (< 10), Rare (≥ 10), Epic (≥ 30), Legendary (≥ 60).
  - **Referenz**: BAC-02-002
  - **Testbar durch**: E2E, Manual

- [ ] **AC-02-009**: Punkte-Vergabe für Einreichung erfolgt via `awardPoints(authorId, POINTS.SUBMIT_PROMPT)` in der POST-Route — atomar mit der Prompt-Erstellung.
  - **Referenz**: BAC-02-001
  - **Testbar durch**: E2E

---

## API-Vertrag

### GET /api/prompts
**Query-Parameter:**
| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|-------------|
| `category` | string | nein | `Writing` | `Email` | `Analyse` | `Excel` | leer = alle |
| `search` | string | nein | Volltextsuche über title, titleEn, content, contentEn |
| `userId` | number | nein | Liefert `userVote` und `userFavorite` für diesen User |
| `sortBy` | string | nein | `most-used` oder leer (= neueste zuerst) |

**Response `200`:**
```json
[
  {
    "id": 1,
    "title": "Professionelle E-Mail schreiben",
    "titleEn": "Write a professional email",
    "content": "Schreibe eine E-Mail die...",
    "contentEn": "Write an email that...",
    "category": "Email",
    "difficulty": "Einstieg",
    "authorId": 1,
    "author": { "id": 1, "name": "Max Mustermann", "avatarColor": "#6366f1" },
    "usageCount": 42,
    "avgRating": 4.2,
    "voteCount": 8,
    "userVote": 5,
    "userFavorite": true,
    "createdAt": "2026-01-15T08:00:00.000Z"
  }
]
```

**Fehler:**
| Code | Grund |
|------|-------|
| 500 | Datenbankfehler |

---

### POST /api/prompts
**Body:**
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `title` | string | ja | Min 3, max 200 Zeichen |
| `titleEn` | string | nein | Englischer Titel |
| `content` | string | ja | Min 10 Zeichen |
| `contentEn` | string | nein | Englischer Inhalt |
| `category` | string | ja | Enum: Writing, Email, Analyse, Excel |
| `difficulty` | string | ja | Enum: Einstieg, Fortgeschritten, Profi |
| `authorId` | number | ja | Positive Ganzzahl |
| `challengeId` | number | nein | Wenn für Challenge einreichend |

**Response `201`:** Prompt-Objekt
**Seiteneffekt:** `awardPoints(authorId, POINTS.SUBMIT_PROMPT)` — 20 Punkte

**Fehler:**
| Code | Grund |
|------|-------|
| 400 | Zod-Validierungsfehler |
| 404 | `authorId` existiert nicht |

---

### POST /api/usage
**Body:**
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `promptId` | number | ja | ID des Prompts |
| `userId` | number | ja | Nutzender User |

**Response `200`:**
```json
{ "usageCount": 43 }
```

**Seiteneffekt:** `prompt.usageCount++`, `awardPoints(prompt.authorId, POINTS.USE_PROMPT)` — 5 Punkte

**Fehler:**
| Code | Grund |
|------|-------|
| 400 | Zod-Validierungsfehler |
| 404 | Prompt nicht gefunden |

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

  author               User                  @relation(fields: [authorId], references: [id])
  votes                Vote[]
  challengeSubmissions ChallengeSubmission[]
  favorites            Favorite[]

  @@index([authorId])
  @@index([category])
  @@index([usageCount])
  @@index([createdAt])
}
```

**Migrationen nötig:** ja (Initialschema)

---

## Komponenten-Struktur

```
app/(user)/library/
└── page.tsx                          // Server Component — initiales Laden (AC-02-002)

app/(user)/library/components/
├── LibraryClient.tsx                 // Client Component — Filter, Suche, Sort (AC-02-003, AC-02-004, AC-02-005)
├── PromptCard.tsx                    // Rarity-Badge, Sterndarstellung (AC-02-008)
└── PromptModal.tsx                   // Vollinhalt, Kopieren, Benutzt-Button (AC-02-006, AC-02-007)

app/(user)/submit/
└── page.tsx                          // Einreichungsformular (AC-02-001)

app/api/prompts/
└── route.ts                          // GET + POST (AC-02-001 bis AC-02-005, AC-02-009)

app/api/usage/
└── route.ts                          // POST (AC-02-007)

lib/
├── points.ts                         // POINTS.SUBMIT_PROMPT, POINTS.USE_PROMPT, awardPoints()
├── types.ts                          // PromptWithDetails Interface
└── validation.ts                     // CreatePromptSchema, UsageSchema
```

---

## Validierung (Zod)

```typescript
// lib/validation.ts
const CreatePromptSchema = z.object({
  title: z.string().min(3).max(200),
  titleEn: z.string().optional(),
  content: z.string().min(10),
  contentEn: z.string().optional(),
  category: z.enum(['Writing', 'Email', 'Analyse', 'Excel']),
  difficulty: z.enum(['Einstieg', 'Fortgeschritten', 'Profi']),
  authorId: z.number().int().positive(),
  challengeId: z.number().int().positive().optional(),
});

const UsageSchema = z.object({
  promptId: z.number().int().positive(),
  userId: z.number().int().positive(),
});
```

---

## Performance-Anforderungen

| Metrik | Zielwert |
|--------|----------|
| GET /api/prompts Response Time (p95) | < 200ms |
| Kein `include: { votes: true }` — Vote-Aggregat via `groupBy` | Pflicht |
| POST /api/prompts Response Time (p95) | < 300ms |

---

## Sicherheit

- [x] Input-Validierung via Zod auf POST /api/prompts und POST /api/usage
- [x] Rate-Limiting auf POST-Routes
- [x] Kein Raw SQL — Prisma ORM für alle Abfragen
- [x] `authorId` wird serverseitig gegen Datenbank validiert

---

## Tests

### Unit-Tests (`tests/unit/`)
- [ ] `validation.test.ts`: `CreatePromptSchema` — valide/invalide Inputs (fehlende Pflichtfelder, ungültige Kategorie, zu kurzer Inhalt)

### E2E-Tests (`tests/e2e/`)
- [ ] `prompt-library.spec.ts` — Happy Path: Prompt einreichen → erscheint in Bibliothek → Modal öffnen → Kopieren
- [ ] `prompt-library.spec.ts` — Filter: nach Kategorie filtern → nur passende Cards sichtbar
- [ ] `prompt-library.spec.ts` — Benutzt: Button klicken → FloatingPoints erscheint, usageCount steigt

---

## Abhängigkeiten

| Abhängigkeit | Typ | Warum |
|-------------|-----|-------|
| Feature 01 – Identity | benötigt | `authorId` referenziert User |
| Feature 04 – Gamification | benötigt | `awardPoints()` aus `lib/points.ts` |
| Prisma Client | benötigt | Datenbankzugriff |

---

## Änderungshistorie

| Version | Datum | CR | Änderung |
|---------|-------|----|---------|
| 1.0 | 2026-04-22 | — | Erstversion |
