# User-Registrierung & Identität – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 01
- **Abgeleitet von**: `specs/business/01-identity.md` v1.0
- **Letzte Änderung**: 2026-04-22

---

## Technische Akzeptanzkriterien

- [ ] **AC-01-001**: `POST /api/users` erstellt einen neuen User mit `name`, `department`, berechnet `avatarColor` (Round-Robin aus Palette) und gibt `UserWithStats` mit Status 201 zurück.
  - **Referenz**: BAC-01-001
  - **Testbar durch**: E2E, Unit

- [ ] **AC-01-002**: `GET /api/users` gibt alle User als `UserWithStats[]` sortiert nach `totalPoints DESC` zurück, mit Cache-Control-Header `public, s-maxage=20, stale-while-revalidate=60`.
  - **Referenz**: BAC-01-003
  - **Testbar durch**: E2E

- [ ] **AC-01-003**: `GET /api/users/[id]` gibt einen einzelnen User mit `rank` (Position in Gesamtliste) und `prompts` zurück; antwortet mit 404 wenn User nicht gefunden.
  - **Referenz**: BAC-01-005
  - **Testbar durch**: E2E

- [ ] **AC-01-004**: Der aktive User wird im Browser via `localStorage['promptarena_user_id']` persistiert; `UserPicker`-Dropdown liest und schreibt diesen Wert ohne Seiten-Neuladen.
  - **Referenz**: BAC-01-002, BAC-01-003
  - **Testbar durch**: E2E

- [ ] **AC-01-005**: `UserPicker` öffnet Registrierungsformular bei Auswahl „Neuer Benutzer"; nach Absenden wird der neue User automatisch ausgewählt.
  - **Referenz**: BAC-01-001
  - **Testbar durch**: E2E

- [ ] **AC-01-006**: Avatar-Farbe wird serverseitig per Round-Robin aus der Farbpalette in `lib/constants.ts` zugewiesen — nicht clientseitig.
  - **Referenz**: BAC-01-004
  - **Testbar durch**: Unit

---

## API-Vertrag

### GET /api/users
**Query-Parameter:** keine

**Response `200`:**
```json
[
  {
    "id": 1,
    "name": "Max Mustermann",
    "department": "IT",
    "avatarColor": "#6366f1",
    "totalPoints": 150,
    "level": "Prompt-Handwerker",
    "createdAt": "2026-01-15T08:00:00.000Z"
  }
]
```

**Header:** `Cache-Control: public, s-maxage=20, stale-while-revalidate=60`

**Fehler:**
| Code | Grund |
|------|-------|
| 500 | Datenbankfehler |

---

### POST /api/users
**Body:**
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `name` | string | ja | Min 2, max 60 Zeichen |
| `department` | string | ja | Abteilungsname |

**Response `201`:** `UserWithStats`

**Fehler:**
| Code | Grund |
|------|-------|
| 400 | Zod-Validierungsfehler (`{ "error": "Validation", "details": [...] }`) |
| 500 | Datenbankfehler |

---

### GET /api/users/[id]
**Path-Parameter:** `id` — positive Ganzzahl, via `PathId.safeParse()` validiert

**Response `200`:**
```json
{
  "id": 1,
  "name": "Max Mustermann",
  "department": "IT",
  "avatarColor": "#6366f1",
  "totalPoints": 150,
  "level": "Prompt-Handwerker",
  "createdAt": "2026-01-15T08:00:00.000Z",
  "rank": 3,
  "prompts": [...]
}
```

**Fehler:**
| Code | Grund |
|------|-------|
| 400 | Ungültige ID (kein gültiger Zahlen-Wert) |
| 404 | User nicht gefunden |

---

## Datenmodell

```prisma
model User {
  id          Int      @id @default(autoincrement())
  name        String
  department  String
  avatarColor String
  totalPoints Int      @default(0)
  level       String   @default("Prompt-Lehrling")
  createdAt   DateTime @default(now())

  prompts              Prompt[]
  votes                Vote[]
  challengeSubmissions ChallengeSubmission[]
  favorites            Favorite[]
  lessonProgress       LessonProgress[]

  @@index([totalPoints])
}
```

**Migrationen nötig:** ja (Initialschema)
**Migration-Datei:** `prisma/migrations/` (initiale Migration)

---

## Komponenten-Struktur

```
app/(user)/layout.tsx               // Enthält UserPicker in Navigation (AC-01-004, AC-01-005)
app/(user)/profile/[id]/
└── page.tsx                        // Server Component — lädt User via GET /api/users/[id] (AC-01-003)

components/
├── UserPicker.tsx                  // Client Component — Dropdown + Registrierungsformular (AC-01-004, AC-01-005)
└── UserAvatar.tsx                  // Zeigt Avatarfarbe + Initialen (AC-01-006)

app/api/users/
├── route.ts                        // GET + POST (AC-01-001, AC-01-002)
└── [id]/
    └── route.ts                    // GET (AC-01-003)

lib/
├── constants.ts                    // AVATAR_COLORS Palette (AC-01-006)
├── types.ts                        // UserWithStats, UserWithDetails Interfaces
└── validation.ts                   // CreateUserSchema (Zod)
```

---

## Validierung (Zod)

```typescript
// lib/validation.ts
const CreateUserSchema = z.object({
  name: z.string().min(2).max(60),
  department: z.string().min(1),
});

// lib/constants.ts
export const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
];
```

---

## Performance-Anforderungen

| Metrik | Zielwert |
|--------|----------|
| GET /api/users Response Time (p95) | < 200ms |
| GET /api/users/[id] Response Time (p95) | < 200ms |
| POST /api/users Response Time (p95) | < 300ms |

---

## Sicherheit

- [x] Input-Validierung via Zod auf POST /api/users
- [x] `PathId.safeParse()` auf alle ID-Parameter
- [x] Rate-Limiting auf POST /api/users
- [x] Keine sensiblen Daten im Client-State (kein Passwort, kein Session-Token für reguläre User)

---

## Tests

### Unit-Tests (`tests/unit/`)
- [ ] `validation.test.ts`: `CreateUserSchema` — valide und invalide Inputs (leerer Name, zu langer Name, fehlende Abteilung)
- [ ] `constants.test.ts`: `AVATAR_COLORS` — Array nicht leer, alle Werte valide Hex-Codes

### E2E-Tests (`tests/e2e/`)
- [ ] `identity.spec.ts` — Happy Path: User registrieren → erscheint im UserPicker → auswählen → localStorage gesetzt
- [ ] `identity.spec.ts` — Edge Case: Leerer Name → Validierungsfehler sichtbar

---

## Abhängigkeiten

| Abhängigkeit | Typ | Warum |
|-------------|-----|-------|
| Prisma Client | benötigt | Datenbankzugriff |
| Zod | benötigt | Input-Validierung |
| `lib/constants.ts` | benötigt | Farbpalette für Avatar |

---

## Änderungshistorie

| Version | Datum | CR | Änderung |
|---------|-------|----|---------|
| 1.0 | 2026-04-22 | — | Erstversion |
