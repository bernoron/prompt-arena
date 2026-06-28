# E-Mail-Authentifizierung – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 12
- **Abgeleitet von**: `specs/business/12-email-auth.md` v1.0
- **Letzte Änderung**: 2026-06-28

---

## Technische Akzeptanzkriterien

### Datenhaltung & Kryptographie

- [x] **AC-12-001**: `lib/email-crypto.ts` exportiert `encryptEmail(plain: string): string`, `decryptEmail(stored: string): string` und `hashEmail(email: string): string`. Verschlüsselung: AES-256-GCM mit zufälligem IV (16 Byte); Format: `<ivHex>:<ciphertextHex>:<authTagHex>`. Hash: HMAC-SHA256 auf `email.toLowerCase().trim()`, key = `EMAIL_SECRET`.
  - **Referenz**: BAC-12-003
  - **Testbar durch**: Unit-Test

- [ ] **AC-12-002**: Prisma-Schema: `User.emailHash String? @unique` (HMAC-Blind-Index für Uniqueness-Check) und `User.emailEncrypted String?` (AES-Ciphertext). `User.department` behält `String @default("")` — wird nicht mehr bei Registrierung gesetzt, bleibt für Bestandsdaten erhalten.
  - **Referenz**: BAC-12-001, BAC-12-003, BAC-12-004
  - **Testbar durch**: Migration + DB-Inspect

### Registrierung

- [x] **AC-12-003**: `RegisterSchema` in `lib/validation.ts` ändert sich: `department` entfällt; neu: `email: z.string().trim().email().max(254)`. Passwort-Validierung (min 8) bleibt.
  - **Referenz**: BAC-12-001
  - **Testbar durch**: Unit-Test

- [x] **AC-12-004**: `POST /api/auth/register` prüft `emailHash` auf Eindeutigkeit vor dem Erstellen. Bei Duplikat: HTTP 409 `"Diese E-Mail-Adresse ist bereits registriert."`. Bei Erfolg: speichert `emailHash` (HMAC) + `emailEncrypted` (AES), kein `department`. Gibt `{ ok: true, userId, name, avatarColor }` zurück (Status 201).
  - **Referenz**: BAC-12-002, BAC-12-003
  - **Testbar durch**: E2E-Test

- [x] **AC-12-005**: Registrierungsseite `app/register/page.tsx` zeigt Felder: Name, E-Mail, Passwort, Passwort bestätigen. Kein Abteilungsfeld. E-Mail-Input: `type="email"`, `autoComplete="email"`.
  - **Referenz**: BAC-12-001
  - **Testbar durch**: Manual / Screenshot

### Admin-Ansicht

- [x] **AC-12-006**: `GET /api/admin/users` gibt `emailDecrypted: string | null` zurück — der Server ruft `decryptEmail(user.emailEncrypted)` auf; bei fehlenden Daten `null`. Keine Klartextspeicherung in der API-Response-Schicht.
  - **Referenz**: BAC-12-005
  - **Testbar durch**: E2E / Manual

- [ ] **AC-12-007**: Admin-Nutzerübersicht (`app/admin/(panel)/users/page.tsx`) zeigt E-Mail-Spalte. Leere E-Mail (`null`) erscheint als `—`.
  - **Referenz**: BAC-12-005
  - **Testbar durch**: Manual

### Konfiguration

- [ ] **AC-12-008**: `.env.example` enthält `EMAIL_SECRET="<32-char-min-random-string>"`. Fehlt `EMAIL_SECRET` in der Produktionsumgebung, gibt `POST /api/auth/register` HTTP 503 zurück. In Dev ohne `EMAIL_SECRET` wird ein Fallback-Dev-Key genutzt (analog zu `USER_SECRET`-Verhalten im Dev-Mode).
  - **Referenz**: BAC-12-003
  - **Testbar durch**: Unit-Test / Manual

### Tests

- [ ] **AC-12-009**: `tests/unit/lib/email-crypto.test.ts` — prüft: encrypt→decrypt roundtrip, zwei Verschlüsselungen derselben E-Mail produzieren unterschiedliche Ciphertexte (random IV), hashEmail ist deterministisch, Manipulation des Ciphertexts wirft Fehler.
  - **Referenz**: BAC-12-003
  - **Testbar durch**: Unit-Test

---

## API-Vertrag

### POST /api/auth/register (Änderung)

**Body (neu):**
```json
{ "name": "Max Muster", "email": "max@example.com", "password": "mindestens8" }
```

**Response 201:**
```json
{ "ok": true, "userId": 42, "name": "Max Muster", "avatarColor": "#14B8A6" }
```

**Fehler:**
| Code | Grund |
|------|-------|
| 400 | Zod-Validierungsfehler (E-Mail ungültig, Passwort zu kurz) |
| 409 | E-Mail bereits registriert |
| 503 | EMAIL_SECRET nicht konfiguriert (Produktion) |

### GET /api/admin/users (Erweiterung)

Gibt zusätzlich pro User:
```json
{ "emailDecrypted": "max@example.com" }
```

---

## Datenmodell

```prisma
model User {
  id              Int      @id @default(autoincrement())
  name            String
  department      String   @default("")   // kept for legacy, no longer set on register
  avatarColor     String
  passwordHash    String?
  emailHash       String?  @unique        // HMAC-SHA256 blind index
  emailEncrypted  String?                 // AES-256-GCM ciphertext
  totalPoints     Int      @default(0)
  level           String   @default("Prompt-Lehrling")
  createdAt       DateTime @default(now())
  // ... relations unchanged
}
```

**Migrationen nötig:** ja
**Migration-Datei:** `prisma/migrations/YYYYMMDDHHMMSS_add_email_fields/`

---

## Neue Datei

```
lib/
└── email-crypto.ts    // AES-256-GCM encrypt/decrypt + HMAC hash (AC-12-001)
```

---

## Validierung (Zod)

```typescript
// lib/validation.ts
export const RegisterSchema = z.object({
  name:     z.string().trim().min(2).max(80),
  email:    z.string().trim().email().max(254),
  password: z.string().min(8).max(100),
});
```

---

## Sicherheit

- [ ] AES-256-GCM (authenticated encryption) — Integritätsschutz via Auth-Tag
- [ ] Zufälliger IV pro Verschlüsselungsvorgang — gleiche E-Mail → unterschiedlicher Ciphertext
- [ ] HMAC-Blind-Index für Uniqueness-Check ohne Klartext in DB
- [ ] `EMAIL_SECRET` wird nie an den Client gesendet
- [ ] Rate-Limiting bleibt auf `/api/auth/register`
- [ ] E-Mail-Validierung via Zod (`z.string().email()`)

---

## Tests

### Unit-Tests (`tests/unit/`)
- [ ] `tests/unit/lib/email-crypto.test.ts`: roundtrip, IV-randomness, Determinismus des Hash, Tamper-Detection

### E2E-Tests (`tests/e2e/`)
- [ ] `tests/e2e/feedback.spec.ts` `createAndLoginUser()`: nutzt neues Schema ohne department (bereits so implementiert)
- [ ] Manuell: Registrierung mit doppelter E-Mail → 409

---

## Abhängigkeiten

| Abhängigkeit | Typ | Warum |
|-------------|-----|-------|
| Feature 01 (Auth) | erweitert | RegisterSchema + /api/auth/register werden geändert |

---

## Änderungshistorie

| Version | Datum | CR | Änderung |
|---------|-------|----|---------|
| 1.0 | 2026-06-28 | — | Erstversion |
