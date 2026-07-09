# User-Registrierung & Identität – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 01
- **Abgeleitet von**: `specs/business/01-identity.md` v1.0
- **Letzte Änderung**: 2026-04-22

> **Hinweis**: E-Mail + Passwort und die Entfernung von `department` wurden seither über `specs/technical/12-email-auth.md` eingeführt. Details unten sind teilweise historisch.

---

## Technische Akzeptanzkriterien

- [x] **AC-01-001**: `POST /api/users` erstellt einen neuen User mit `name`, berechnet `avatarColor` (Round-Robin aus Palette) und gibt `UserWithStats` mit Status 201 zurück.
  - **Referenz**: BAC-01-001
  - **Testbar durch**: E2E, Unit

- [x] **AC-01-002**: `GET /api/users` gibt alle User als `UserWithStats[]` sortiert nach `totalPoints DESC` zurück, mit Cache-Control-Header `public, s-maxage=20, stale-while-revalidate=60`.
  - **Referenz**: BAC-01-003
  - **Testbar durch**: E2E

- [x] **AC-01-003**: `GET /api/users/[id]` gibt einen einzelnen User mit `rank` (Position in Gesamtliste) und `prompts` zurück; antwortet mit 404 wenn User nicht gefunden.
  - **Referenz**: BAC-01-005
  - **Testbar durch**: E2E

- [x] **AC-01-004**: Der aktive User wird im Browser via `localStorage['promptarena_user_id']` persistiert; `UserPicker`-Dropdown liest und schreibt diesen Wert ohne Seiten-Neuladen.
  - **Referenz**: BAC-01-002, BAC-01-003
  - **Testbar durch**: E2E

- [x] **AC-01-005**: `UserPicker` öffnet Registrierungsformular bei Auswahl „Neuer Benutzer"; nach Absenden wird der neue User automatisch ausgewählt.
  - **Referenz**: BAC-01-001
  - **Testbar durch**: E2E

- [x] **AC-01-006**: Avatar-Farbe wird serverseitig per Round-Robin aus der Farbpalette in `lib/constants.ts` zugewiesen — nicht clientseitig.
  - **Referenz**: BAC-01-004
  - **Testbar durch**: Unit

- [x] **AC-01-007**: `POST /api/auth/login` mit `{ userId }` setzt HMAC-SHA256-signierten HttpOnly-Cookie `user_session`; validiert dass der User in der DB existiert; rate-limited.
  - **Referenz**: BAC-01-002
  - **Testbar durch**: E2E

- [x] **AC-01-008**: `POST /api/auth/logout` löscht Cookie `user_session` (`Max-Age=0`) und gibt `{ ok: true }` zurück.
  - **Referenz**: BAC-01-002
  - **Testbar durch**: E2E

- [x] **AC-01-009**: `GET /api/auth/me` liest `user_session`-Cookie, verifiziert HMAC-Signatur und gibt den zugehörigen User zurück; 401 wenn kein gültiger Cookie vorhanden.
  - **Referenz**: BAC-01-002
  - **Testbar durch**: E2E

### Konto löschen (CR-002)

- [x] **AC-01-010**: Prisma: `User.deletedAt DateTime?` (+ Index) markiert gelöschte Konten (Tombstone); Modell wird per Migration `add_account_deletion_and_password_reset` eingeführt.
  - **Referenz**: BAC-01-009, BAC-01-010 · **Code**: `prisma/schema.prisma`
- [x] **AC-01-011**: `DELETE /api/account` — verlangt gültige Session (nur eigenes Konto) + Passwort-Bestätigung; anonymisiert (`name → "Gelöschter Nutzer #<id>"`, `passwordHash`/`emailHash`/`emailEncrypted → null`, `deletedAt = now`), löscht offene Reset-Tokens, entfernt den Session-Cookie. Falsches Passwort → 401; unauthentifiziert → 401; rate-limited (`authLimiter`).
  - **Referenz**: BAC-01-007…011 · **Code**: `app/api/account/route.ts` · **Testbar durch**: E2E
- [x] **AC-01-012**: Gelöschte Konten sind unsichtbar: `GET /api/users` filtert `deletedAt: null`, `GET /api/users/[id]` liefert 404, `GET /api/auth/me` liefert `null`. Ein Login mit den alten Daten scheitert (E-Mail freigegeben, Passwort entfernt).
  - **Referenz**: BAC-01-003, BAC-01-008 · **Code**: `app/api/users/route.ts`, `app/api/users/[id]/route.ts`, `app/api/auth/me/route.ts`
- [x] **AC-01-013**: Profilseite zeigt eine „Gefahrenzone" mit „Konto löschen"-Button; Klick öffnet einen Bestätigungsdialog (Passwort-Eingabe). Nach Erfolg Hard-Redirect auf `/login`.
  - **Referenz**: BAC-01-006, BAC-01-007 · **Code**: `app/(user)/profile/page.tsx` · **Testbar durch**: Manual/Preview

### Passwort zurücksetzen per E-Mail (CR-003)

- [x] **AC-01-014**: Prisma: `PasswordResetToken { id, userId, tokenHash @unique, expiresAt, usedAt?, createdAt }` (nur Token-**Hash** gespeichert, Cascade-Delete am User).
  - **Referenz**: BAC-01-015, BAC-01-018 · **Code**: `prisma/schema.prisma`
- [x] **AC-01-015**: `lib/reset-token.ts` (Token erzeugen = 32 Byte hex, `hashResetToken` = SHA-256, `resetTokenExpiry` = +1h, `isTestOrDevEnv`) + `lib/mailer.ts` (pluggbarer Transport, Default = Log-/Mock-Transport; `sendPasswordResetEmail` deutschsprachig).
  - **Referenz**: BAC-01-014, BAC-01-015 · **Code**: `lib/reset-token.ts`, `lib/mailer.ts` · **Testbar durch**: Unit
- [x] **AC-01-016**: `POST /api/auth/password-reset/request` — **immer** neutrale Antwort (kein Enumeration-Leak); bei existierendem, nicht gelöschtem Konto: alte offene Tokens verwerfen, neues Token anlegen, Reset-Mail senden. Nur in Dev/CI/E2E zusätzlich `devResetUrl`. Rate-limited (`authLimiter`).
  - **Referenz**: BAC-01-012, BAC-01-013, BAC-01-014, BAC-01-017 · **Code**: `app/api/auth/password-reset/request/route.ts` · **Testbar durch**: E2E
- [x] **AC-01-017**: `POST /api/auth/password-reset/confirm` — validiert Token (existiert, nicht abgelaufen, nicht benutzt, Konto nicht gelöscht); setzt neues Passwort, markiert Token als benutzt und invalidiert alle weiteren offenen Tokens (Transaktion). Ungültig/abgelaufen/benutzt → 400. Rate-limited.
  - **Referenz**: BAC-01-015, BAC-01-016 · **Code**: `app/api/auth/password-reset/confirm/route.ts` · **Testbar durch**: E2E
- [x] **AC-01-018**: Anmeldeseite zeigt Link „Passwort vergessen?" → `/forgot-password` (E-Mail-Eingabe, neutrale Bestätigung, Dev-Link-Hinweis).
  - **Referenz**: BAC-01-012 · **Code**: `app/(auth)/login/page.tsx`, `app/(auth)/forgot-password/page.tsx`
- [x] **AC-01-019**: `/reset-password?token=…` — neues Passwort setzen (Bestätigungsfeld, gleiche Regeln); Erfolg → Weiter zur Anmeldung. Öffentlicher Pfad in `middleware.ts`.
  - **Referenz**: BAC-01-016 · **Code**: `app/(auth)/reset-password/page.tsx`, `middleware.ts`

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
- [ ] `validation.test.ts`: `CreateUserSchema` — valide und invalide Inputs (leerer Name, zu langer Name)
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
| 1.1 | 2026-07-08 | CR-002 | Konto löschen: AC-01-010…013 |
| 1.2 | 2026-07-08 | CR-003 | Passwort-Reset per E-Mail: AC-01-014…019 |
