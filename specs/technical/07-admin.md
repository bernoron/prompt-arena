# Admin-Panel – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 07
- **Abgeleitet von**: `specs/business/07-admin.md` v1.0
- **Letzte Änderung**: 2026-04-22

---

## Technische Akzeptanzkriterien

- [ ] **AC-07-001**: `POST /api/admin/login` prüft `body.password` gegen `process.env.ADMIN_PASSWORD`; bei Erfolg setzt `HttpOnly`-Cookie `admin_session` mit signiertem Wert und gibt `{ ok: true }` zurück.
  - **Referenz**: BAC-07-001
  - **Testbar durch**: E2E

- [ ] **AC-07-002**: `POST /api/admin/logout` löscht Cookie `admin_session` (setzt `Max-Age=0`) und gibt `{ ok: true }` zurück.
  - **Referenz**: BAC-07-007
  - **Testbar durch**: E2E

- [ ] **AC-07-003**: `middleware.ts` prüft Cookie `admin_session` auf allen `/admin/*`-Pfaden (ausser `/admin/login`); bei fehlendem/ungültigem Cookie → `NextResponse.redirect('/admin/login')`.
  - **Referenz**: BAC-07-002
  - **Testbar durch**: E2E

- [ ] **AC-07-004**: `GET /api/admin/stats` gibt `{ users, prompts, votes, challenges }` als Gesamtzahlen zurück.
  - **Referenz**: BAC-07-003
  - **Testbar durch**: E2E

- [ ] **AC-07-005**: `GET /api/admin/prompts` gibt alle Prompts mit Autor-Info zurück; `PUT /api/admin/prompts/[id]` aktualisiert Felder; `DELETE /api/admin/prompts/[id]` löscht Prompt (kaskadierend: Votes, Favorites, Submissions).
  - **Referenz**: BAC-07-004
  - **Testbar durch**: E2E

- [ ] **AC-07-006**: Admin-Challenge-Verwaltung via `GET/POST /api/admin/challenges` und `PUT /api/admin/challenges/[id]` (Spec in Feature 06 detailliert).
  - **Referenz**: BAC-07-005
  - **Testbar durch**: E2E

- [ ] **AC-07-007**: `GET /api/admin/users` und `GET/PUT /api/admin/users/[id]` für Nutzerverwaltung.
  - **Referenz**: BAC-07-006
  - **Testbar durch**: E2E

- [ ] **AC-07-008**: Admin-Layout verwendet separate `app/admin/layout.tsx` mit Sidebar (keine User-Navigation, kein UserPicker).
  - **Referenz**: BAC-07-003 (Abgrenzung vom User-Bereich)
  - **Testbar durch**: E2E, Manual

---

## API-Vertrag

### POST /api/admin/login
**Body:**
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `password` | string | ja | Klartext-Passwort |

**Response `200`:** `{ "ok": true }` + setzt Cookie `admin_session=<signed-value>; HttpOnly; SameSite=Strict; Path=/admin`
**Response `401`:** `{ "error": "Ungültiges Passwort" }`

---

### POST /api/admin/logout
**Response `200`:** `{ "ok": true }` + löscht Cookie (`Max-Age=0`)

---

### GET /api/admin/stats
**Geschützt durch:** Middleware (Cookie-Check)

**Response `200`:**
```json
{
  "users": 42,
  "prompts": 187,
  "votes": 856,
  "challenges": 12
}
```

---

### GET /api/admin/prompts
**Geschützt durch:** Middleware

**Response `200`:** Alle Prompts mit `author: { id, name, department }`

---

### PUT /api/admin/prompts/[id]
**Geschützt durch:** Middleware

**Body:** Partial Prompt (eines oder mehrere: `title`, `titleEn`, `content`, `contentEn`, `category`, `difficulty`)

**Response `200`:** Aktualisiertes Prompt-Objekt

**Fehler:**
| Code | Grund |
|------|-------|
| 400 | Ungültige ID oder Zod-Validierungsfehler |
| 404 | Prompt nicht gefunden |

---

### DELETE /api/admin/prompts/[id]
**Geschützt durch:** Middleware

**Response `204`:** Kein Body

**Kaskadierende Löschung via Prisma `onDelete: Cascade`:** Votes, Favorites, ChallengeSubmissions werden mitgelöscht.

---

### GET /api/admin/users
**Geschützt durch:** Middleware

**Response `200`:** Alle User mit Basis-Statistiken

---

### PUT /api/admin/users/[id]
**Geschützt durch:** Middleware

**Body:** Partial User (`name`, `department` editierbar)

**Response `200`:** Aktualisierter User

---

## Datenmodell

Kein eigenes Prisma-Modell — Admin-Authentifizierung via Umgebungsvariablen:

```env
ADMIN_PASSWORD=<sicheres-passwort>
ADMIN_SESSION_SECRET=<zufälliger-32-byte-hex-string>
```

Cookie-Signierung via `ADMIN_SESSION_SECRET` — verhindert Client-seitiges Fälschen.

**Migrationen nötig:** nein

---

## Komponenten-Struktur

```
app/admin/
├── layout.tsx                        // Admin-Layout mit Sidebar, Logout-Button (AC-07-008)
├── login/
│   └── page.tsx                      // Passwort-Formular (AC-07-001)
├── page.tsx                          // Dashboard: Stat-Karten (AC-07-004)
├── prompts/
│   └── page.tsx                      // Prompt-Verwaltungstabelle (AC-07-005)
├── challenges/
│   └── page.tsx                      // Challenge-Verwaltung (AC-07-006)
└── users/
    └── page.tsx                      // Nutzerverwaltung (AC-07-007)

app/api/admin/
├── login/
│   └── route.ts                      // POST (AC-07-001)
├── logout/
│   └── route.ts                      // POST (AC-07-002)
├── stats/
│   └── route.ts                      // GET (AC-07-004)
├── prompts/
│   ├── route.ts                      // GET (AC-07-005)
│   └── [id]/
│       └── route.ts                  // PUT + DELETE (AC-07-005)
├── challenges/
│   ├── route.ts                      // GET + POST (AC-07-006)
│   └── [id]/
│       └── route.ts                  // PUT (AC-07-006)
└── users/
    ├── route.ts                      // GET (AC-07-007)
    └── [id]/
        └── route.ts                  // GET + PUT (AC-07-007)

middleware.ts                         // Cookie-Check für /admin/* (AC-07-003)

lib/
└── admin-auth.ts                     // Cookie-Signierung/-Verifikation, SESSION_COOKIE_NAME
```

---

## Validierung (Zod)

```typescript
// lib/validation.ts
const AdminLoginSchema = z.object({
  password: z.string().min(1),
});

const UpdatePromptSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  titleEn: z.string().optional(),
  content: z.string().min(10).optional(),
  contentEn: z.string().optional(),
  category: z.enum(['Writing', 'Email', 'Analyse', 'Excel']).optional(),
  difficulty: z.enum(['Einstieg', 'Fortgeschritten', 'Profi']).optional(),
});
```

---

## Performance-Anforderungen

| Metrik | Zielwert |
|--------|----------|
| GET /api/admin/stats Response Time (p95) | < 200ms |
| GET /api/admin/prompts Response Time (p95) | < 500ms |

---

## Sicherheit

- [x] `ADMIN_PASSWORD` nur in Umgebungsvariable — nie in Code oder Datenbank
- [x] Cookie `HttpOnly` — kein JavaScript-Zugriff auf Session-Token
- [x] Cookie `SameSite=Strict` — CSRF-Schutz
- [x] `middleware.ts` schützt alle `/admin/*`-Routen ausser `/admin/login`
- [x] Kein Passwort-Hashing nötig (einzelner Admin, internes Tool — kein Angriffsszenario für Brute-Force aus dem Unternehmensnetz)
- [x] Rate-Limiting auf `POST /api/admin/login`
- [x] Keine sensiblen Daten in Logs (`lib/logger.ts`)

---

## Tests

### Unit-Tests (`tests/unit/`)
- Keine (Admin-Auth ist HTTP-Cookie-basiert, nicht sinnvoll unit-testbar ohne HTTP-Mocks)

### E2E-Tests (`tests/e2e/`)
- [ ] `admin.spec.ts` — Login: falsches Passwort → Fehlermeldung sichtbar
- [ ] `admin.spec.ts` — Login: korrektes Passwort → Redirect zu `/admin`
- [ ] `admin.spec.ts` — Guard: `/admin` ohne Cookie → Redirect zu `/admin/login`
- [ ] `admin.spec.ts` — Dashboard: Statistik-Karten laden korrekte Zahlen
- [ ] `admin.spec.ts` — Logout: Nach Abmelden kein Zugang zu `/admin`

---

## Abhängigkeiten

| Abhängigkeit | Typ | Warum |
|-------------|-----|-------|
| Feature 02 – Prompt-Bibliothek | benötigt | Admin verwaltet Prompts |
| Feature 06 – Challenges | benötigt | Admin verwaltet Challenges |
| `middleware.ts` | benötigt | Zentraler Schutz aller Admin-Routen |
| Umgebungsvariable `ADMIN_PASSWORD` | benötigt | Passwort für Login |

---

## Änderungshistorie

| Version | Datum | CR | Änderung |
|---------|-------|----|---------|
| 1.0 | 2026-04-22 | — | Erstversion |
