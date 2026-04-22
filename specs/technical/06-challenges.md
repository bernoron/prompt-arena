# Wöchentliche Challenges – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 06
- **Abgeleitet von**: `specs/business/06-challenges.md` v1.0
- **Letzte Änderung**: 2026-04-22

---

## Technische Akzeptanzkriterien

- [ ] **AC-06-001**: `GET /api/challenges` gibt aktive Challenges als `WeeklyChallengeData[]` zurück (gefiltert nach `isActive: true`); Admin-Zugriff gibt alle zurück.
  - **Referenz**: BAC-06-001
  - **Testbar durch**: E2E

- [ ] **AC-06-002**: `POST /api/prompts` mit `challengeId` erstellt zusätzlich einen `ChallengeSubmission`-Eintrag und vergibt `POINTS.CHALLENGE_SUBMIT` (30) an den Autor.
  - **Referenz**: BAC-06-002
  - **Testbar durch**: E2E

- [ ] **AC-06-003**: `/submit`-Seite zeigt `WeeklyChallengeCard` wenn `GET /api/challenges` mindestens eine aktive Challenge liefert; Checkbox `challengeId` im POST-Body mitschicken.
  - **Referenz**: BAC-06-001, BAC-06-002
  - **Testbar durch**: E2E

- [ ] **AC-06-004**: `POST /api/admin/challenges` erstellt eine neue Challenge (anfangs inaktiv).
  - **Referenz**: BAC-06-003
  - **Testbar durch**: E2E

- [ ] **AC-06-005**: `PUT /api/admin/challenges/[id]` mit `{ isActive: true }` setzt alle anderen Challenges auf `isActive: false` via Transaktion.
  - **Referenz**: BAC-06-004
  - **Testbar durch**: E2E

- [ ] **AC-06-006**: `PUT /api/admin/challenges/[id]` mit `{ isActive: false }` beendet eine Challenge.
  - **Referenz**: BAC-06-004
  - **Testbar durch**: E2E

---

## API-Vertrag

### GET /api/challenges
**Query-Parameter:** keine (nur aktive zurückgegeben; Admin-Kontext durch Middleware)

**Response `200`:**
```json
[
  {
    "id": 1,
    "title": "Die beste E-Mail-Vorlage",
    "description": "Reicht den besten E-Mail-Prompt dieser Woche ein!",
    "startDate": "2026-01-13T00:00:00.000Z",
    "endDate": "2026-01-19T23:59:00.000Z",
    "isActive": true,
    "submissionCount": 5
  }
]
```

**Fehler:**
| Code | Grund |
|------|-------|
| 500 | Datenbankfehler |

---

### POST /api/admin/challenges
**Geschützt durch:** Admin-Session-Cookie (via Middleware)

**Body:**
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `title` | string | ja | Min 3, max 200 Zeichen |
| `description` | string | ja | Min 10 Zeichen |
| `startDate` | string | ja | ISO-8601 Datum |
| `endDate` | string | ja | ISO-8601 Datum |

**Response `201`:** `WeeklyChallenge`-Objekt (mit `isActive: false`)

**Fehler:**
| Code | Grund |
|------|-------|
| 400 | Zod-Validierungsfehler |
| 401 | Kein gültiger Admin-Cookie |

---

### PUT /api/admin/challenges/[id]
**Geschützt durch:** Admin-Session-Cookie

**Body:** Partial `WeeklyChallenge` (mindestens eines: `isActive`, `title`, `description`, `startDate`, `endDate`)

**Logik bei `isActive: true`:**
```typescript
await prisma.$transaction([
  prisma.weeklyChallenge.updateMany({ where: { isActive: true }, data: { isActive: false } }),
  prisma.weeklyChallenge.update({ where: { id }, data: { isActive: true } }),
]);
```

**Response `200`:** Aktualisiertes `WeeklyChallenge`-Objekt

**Fehler:**
| Code | Grund |
|------|-------|
| 400 | Zod-Validierungsfehler oder ungültige ID |
| 401 | Kein gültiger Admin-Cookie |
| 404 | Challenge nicht gefunden |

---

## Datenmodell

```prisma
model WeeklyChallenge {
  id          Int      @id @default(autoincrement())
  title       String
  description String
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean  @default(false)

  submissions ChallengeSubmission[]
}

model ChallengeSubmission {
  id          Int      @id @default(autoincrement())
  challengeId Int
  promptId    Int
  userId      Int
  createdAt   DateTime @default(now())

  challenge WeeklyChallenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)
  prompt    Prompt          @relation(fields: [promptId], references: [id], onDelete: Cascade)
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([challengeId])
  @@index([userId])
}
```

**Ergänzungen auf bestehenden Modellen:**
```prisma
model User {
  challengeSubmissions ChallengeSubmission[]
}

model Prompt {
  challengeSubmissions ChallengeSubmission[]
}
```

**Migrationen nötig:** ja (neue Modelle)

---

## Komponenten-Struktur

```
app/(user)/submit/
├── page.tsx                          // Einreichungsseite (AC-06-003)
└── components/
    └── WeeklyChallengeCard.tsx       // Anzeige der aktiven Challenge + Checkbox (AC-06-003)

app/admin/challenges/
└── page.tsx                          // Admin Challenge-Verwaltung (AC-06-004, AC-06-005, AC-06-006)

app/api/challenges/
└── route.ts                          // GET (AC-06-001)

app/api/admin/challenges/
├── route.ts                          // GET + POST (AC-06-004)
└── [id]/
    └── route.ts                      // PUT (AC-06-005, AC-06-006)

lib/
├── points.ts                         // POINTS.CHALLENGE_SUBMIT = 30, POINTS.CHALLENGE_WIN = 100
├── types.ts                          // WeeklyChallengeData Interface
└── validation.ts                     // CreateChallengeSchema, UpdateChallengeSchema
```

---

## Validierung (Zod)

```typescript
// lib/validation.ts
const CreateChallengeSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const UpdateChallengeSchema = CreateChallengeSchema.partial().extend({
  isActive: z.boolean().optional(),
});
```

---

## Performance-Anforderungen

| Metrik | Zielwert |
|--------|----------|
| GET /api/challenges Response Time (p95) | < 100ms |
| PUT /api/admin/challenges (Aktivierung via Transaktion) | < 200ms |

---

## Sicherheit

- [x] Alle `/api/admin/*` Routen durch `middleware.ts` geschützt (Admin-Session-Cookie-Check)
- [x] Input-Validierung via Zod auf alle Admin-POST/PUT-Routen
- [x] Transaktion bei Aktivierung — verhindert Zustand mit mehreren aktiven Challenges
- [x] Rate-Limiting auf öffentlichem GET /api/challenges

---

## Tests

### Unit-Tests (`tests/unit/`)
- Keine eigene Logik-Funktion (Punkte via `awardPoints` abgedeckt in Feature 04)

### E2E-Tests (`tests/e2e/`)
- [ ] `challenges.spec.ts` — Happy Path: Aktive Challenge sichtbar auf `/submit` → Prompt mit Challenge einreichen → Punkte vergeben
- [ ] `challenges.spec.ts` — Admin: Challenge erstellen → aktivieren → prüfen dass andere deaktiviert → beenden

---

## Abhängigkeiten

| Abhängigkeit | Typ | Warum |
|-------------|-----|-------|
| Feature 01 – Identity | benötigt | `userId` auf `ChallengeSubmission` |
| Feature 02 – Prompt-Bibliothek | benötigt | Challenge-Einreichung erstellt regulären Prompt + Submission |
| Feature 04 – Gamification | benötigt | `awardPoints()` für Einreichungs- und Gewinner-Punkte |
| Feature 07 – Admin-Panel | benötigt | Admin-Authentifizierung via Middleware |

---

## Änderungshistorie

| Version | Datum | CR | Änderung |
|---------|-------|----|---------|
| 1.0 | 2026-04-22 | — | Erstversion |
