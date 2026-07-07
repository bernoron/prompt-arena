# Einstiegs-Funnel für neue Nutzer:innen – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 14
- **Abgeleitet von**: `specs/business/14-onboarding-funnel.md` v1.0
- **Letzte Änderung**: 2026-07-07

---

## Technische Akzeptanzkriterien

- [x] **AC-14-001**: `User`-Modell bekommt Feld `onboardingCompletedAt DateTime?` (nullable). `NULL` = Einführung wurde noch nicht abgeschlossen/übersprungen. Die Migration befüllt dieses Feld bei allen **bestehenden** Zeilen sofort mit einem Zeitstempel (Backfill), damit Bestandsnutzer nicht rückwirkend erfasst werden.
  - **Referenz**: BAC-14-006
  - **Testbar durch**: Manual (Migration lokal ausführen, `SELECT` auf Bestandsdaten prüfen)

- [x] **AC-14-002**: `getSessionUser()` (`lib/session.ts`) selektiert `onboardingCompletedAt` zusätzlich und gibt es als ISO-String oder `null` im `UserWithStats`-Objekt zurück.
  - **Referenz**: BAC-14-001, BAC-14-005
  - **Testbar durch**: Unit / E2E

- [x] **AC-14-003**: `components/OnboardingFunnel.tsx` (Client Component, in `app/(user)/layout.tsx` neben `FeedbackButton` gemountet) rendert ein Modal, sobald `useSession().onboardingCompletedAt === null` ist. Kein Modal, wenn der Wert gesetzt ist oder kein User eingeloggt ist.
  - **Referenz**: BAC-14-001
  - **Testbar durch**: E2E

- [x] **AC-14-004**: `lib/constants.ts` exportiert `ONBOARDING_STEPS`: ein Array mit mindestens 5 Einträgen (`icon`, `title`, `body`), die die Kernfunktionen abdecken: Prompt-Bibliothek & Benutzen, Prompts einreichen, Punkte/Level/Rangliste, Lernpfad, Challenges. `OnboardingFunnel` rendert jeweils einen Eintrag pro Schritt mit „Weiter"-Button.
  - **Referenz**: BAC-14-002
  - **Testbar durch**: Unit (Struktur der Konstante) / Manual (Inhalt)

- [x] **AC-14-005**: Auf jedem Schritt ist ein „Überspringen"-Link sichtbar. Klick beendet die Einführung sofort (identisches Verhalten wie Abschluss des letzten Schritts).
  - **Referenz**: BAC-14-003
  - **Testbar durch**: E2E

- [x] **AC-14-006**: Der letzte Schritt zeigt statt „Weiter" zwei CTA-Links („Zur Prompt-Bibliothek" → `/library`, „Lernpfad starten" → `/learn`), die die Einführung beenden und zur jeweiligen Seite navigieren.
  - **Referenz**: BAC-14-004
  - **Testbar durch**: E2E

- [x] **AC-14-007**: `POST /api/onboarding` setzt `onboardingCompletedAt = now()` für den Session-User (via `requireUser()`, `writeLimiter`). Wird sowohl bei „Überspringen" als auch beim Abschluss des letzten Schritts aufgerufen, bevor das Modal geschlossen wird. Client aktualisiert lokal (State), damit das Modal ohne Reload verschwindet.
  - **Referenz**: BAC-14-003, BAC-14-004, BAC-14-005
  - **Testbar durch**: E2E, Unit (Route-Handler)

- [x] **AC-14-008**: `UserMenu.tsx` bekommt einen neuen Eintrag „Einführung erneut ansehen", der zu `/dashboard?tour=1` navigiert. `OnboardingFunnel` öffnet sich bei vorhandenem `?tour=1`-Query-Parameter unabhängig vom `onboardingCompletedAt`-Status (ohne diesen zurückzusetzen) und entfernt den Parameter aus der URL beim Schliessen.
  - **Referenz**: BAC-14-007
  - **Testbar durch**: E2E

- [x] **AC-14-009**: Modal-Layout ist mit Tailwind responsive (max. Breite auf Desktop, volle Breite mit Innenabstand auf Mobile, Buttons untereinander auf schmalen Viewports); manuell auf Mobile-Viewport (375px) geprüft.
  - **Referenz**: BAC-14-008
  - **Testbar durch**: Manual / E2E (Viewport-Check)

---

## API-Vertrag

### POST /api/onboarding
Kein Body nötig — der User kommt aus dem Session-Cookie (analog `POST /api/usage`).

**Response `200`:**
```json
{ "ok": true, "onboardingCompletedAt": "2026-07-07T10:15:00.000Z" }
```

**Fehler:**
| Code | Grund |
|------|-------|
| 401 | Nicht authentifiziert (`requireUser`) |
| 429 | Rate-Limit (`writeLimiter`) überschritten |

Aufruf ist idempotent: ein zweiter Aufruf überschreibt lediglich den Zeitstempel, keine
Fehlerbedingung.

---

## Datenmodell

```prisma
model User {
  // ...bestehende Felder
  onboardingCompletedAt DateTime? // @spec AC-14-001 – NULL = Einführung noch nicht gesehen
}
```

**Migrationen nötig:** ja
**Migration-Datei:** `prisma/migrations/20260707120000_add_onboarding_completed_at/`

Die Migration enthält zwei Schritte:
1. `ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" DATETIME;`
2. Backfill: `UPDATE "User" SET "onboardingCompletedAt" = "createdAt" WHERE "onboardingCompletedAt" IS NULL;`
   — macht alle zum Zeitpunkt des Deployments bestehenden Accounts sofort „fertig", ohne
   dass ihnen die Einführung angezeigt wird (BAC-14-006). Nur Accounts, die **nach** dieser
   Migration neu angelegt werden, starten mit `NULL` und sehen die Einführung.

**Seed-Anpassung:** `prisma/seed.ts` muss bei allen dort erzeugten Demo-Usern
(`prisma.user.create(...)`, Zeilen 26/219/230) `onboardingCompletedAt: new Date()` mitgeben —
sonst würde jeder bestehende E2E-Test, der sich mit einem Seed-User einloggt, unerwartet auf
das Onboarding-Modal treffen.

---

## Komponenten-Struktur

```
app/(user)/layout.tsx              // <OnboardingFunnel /> zusätzlich zu <FeedbackButton /> (AC-14-003)

components/
├── OnboardingFunnel.tsx            // Client Component: Modal, Schritt-Logik, ?tour=1 (AC-14-003..006, AC-14-008, AC-14-009)
└── UserMenu.tsx                    // + Link "Einführung erneut ansehen" (AC-14-008)

lib/
├── constants.ts                    // ONBOARDING_STEPS (AC-14-004)
├── types.ts                        // UserWithStats.onboardingCompletedAt (AC-14-002)
└── session.ts                      // getSessionUser() selektiert neues Feld (AC-14-002)

app/api/onboarding/
└── route.ts                        // POST — markiert Einführung als erledigt (AC-14-007)

prisma/
├── schema.prisma                   // User.onboardingCompletedAt (AC-14-001)
└── seed.ts                         // onboardingCompletedAt für Seed-User setzen
```

---

## Validierung (Zod)

Kein Request-Body → kein neues Zod-Schema. `POST /api/onboarding` validiert nur die Session
(`requireUser`), analog zu Routen ohne Nutzereingabe.

---

## Performance-Anforderungen

| Metrik | Zielwert |
|--------|----------|
| Zusätzliche Spalte, kein neuer Join | 0 zusätzliche Queries beim normalen Seitenaufruf (Feld wird im bestehenden `getSessionUser()`-Query mitgelesen) |
| POST /api/onboarding Response Time (p95) | < 150ms |
| Bundle Size Increase (OnboardingFunnel, nur bei eingeloggten Usern geladen) | < 8KB |

---

## Sicherheit

- [ ] `requireUser()` leitet die User-ID ausschliesslich aus dem Session-Cookie ab — kein
  Client-übergebenes `userId` im Body (kein IDOR)
- [ ] Rate-Limiting via `writeLimiter` auf `POST /api/onboarding`
- [ ] Keine neuen sensiblen Daten; `onboardingCompletedAt` ist rein funktional (kein PII)

---

## Tests

### Unit-Tests (`tests/unit/`)
- [ ] `constants.test.ts`: `ONBOARDING_STEPS` — mindestens 5 Einträge, jeder mit nicht-leerem
  `title` und `body`

### E2E-Tests (`tests/e2e/`)
- [ ] `onboarding.spec.ts` Szenario „Happy Path": neuer User registriert sich → landet auf
  `/dashboard` → Onboarding-Modal sichtbar → durch alle Schritte klicken → letzter Schritt
  zeigt CTA-Links → Klick auf „Zur Prompt-Bibliothek" navigiert zu `/library` und schliesst
  das Modal → erneuter Aufruf von `/dashboard` zeigt das Modal nicht mehr
- [ ] `onboarding.spec.ts` Szenario „Überspringen": neuer User registriert sich → klickt auf
  Schritt 1 „Überspringen" → Modal schliesst sofort → Reload von `/dashboard` zeigt kein
  Modal mehr
- [ ] `onboarding.spec.ts` Szenario „Erneut ansehen": User mit bereits abgeschlossener
  Einführung ruft `/dashboard?tour=1` auf → Modal öffnet sich manuell

---

## Abhängigkeiten

| Abhängigkeit | Typ | Warum |
|-------------|-----|-------|
| Feature 01 (Identität) | benötigt | `getSessionUser()`/`requireUser()` für Session-User |
| Feature 04 (Gamification) | benötigt | Dashboard als primärer Landing-Ort nach Login |
| Feature 08 (Lernpfad) | benötigt | CTA-Ziel `/learn` im letzten Schritt |
| Feature 02 (Prompt-Bibliothek) | benötigt | CTA-Ziel `/library` im letzten Schritt |
| `prisma/seed.ts` | betroffen | Muss Seed-User als „onboarding erledigt" markieren |

---

## Änderungshistorie

| Version | Datum | CR | Änderung |
|---------|-------|----|---------|
| 1.0 | 2026-07-07 | — | Erstversion |
