# Feature: Benutzer-Identität

## Metadaten
- **Status**: `implemented`
- **Feature-Nr**: 01
- **Letzte Änderung**: 2026-04-13

---

## User Story
Als Mitarbeiter will ich mich mit Name und Abteilung registrieren, damit ich Prompts einreichen, bewerten und Punkte sammeln kann, ohne ein Passwort zu benötigen.

---

## Akzeptanzkriterien

- [x] **AC-01-001**: Ein neuer User kann sich mit `name` und `department` registrieren → erhält `id`, `avatarColor`, `level`
- [x] **AC-01-002**: Alle User können als geordnete Liste (totalPoints desc) abgerufen werden
- [x] **AC-01-003**: Ein einzelner User kann mit seiner ID abgerufen werden (inkl. Prompts + globaler Rang)
- [x] **AC-01-004**: Der aktive User wird im Browser via `localStorage['promptarena_user_id']` gespeichert
- [x] **AC-01-005**: UserPicker-Dropdown zeigt alle User und ermöglicht Wechsel ohne Seitenneuladen
- [x] **AC-01-006**: Avatar-Farbe wird automatisch zugewiesen (Round-Robin aus Farbpalette)

---

## API-Vertrag

### GET /api/users
**Response 200**: `UserWithStats[]` (sortiert nach totalPoints desc)
```json
[{ "id": 1, "name": "Max", "department": "IT", "avatarColor": "#...", "totalPoints": 150, "level": "Prompt-Handwerker", "createdAt": "ISO" }]
```
**Cache-Control**: `public, s-maxage=20, stale-while-revalidate=60`

### POST /api/users
**Body**: `{ "name": string (min 2, max 60), "department": string }`
**Response 201**: `UserWithStats`
**Response 400**: `{ "error": "Validation", "details": [...] }`

### GET /api/users/[id]
**Response 200**: `UserWithStats & { rank: number, prompts: PromptWithDetails[] }`
**Response 404**: `{ "error": "Not found" }`

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

---

## UI-Verhalten

### Komponente: `UserPicker`
- Dropdown zeigt alle User mit Avatar-Farbe, Name, Abteilung
- Auswahl speichert ID in localStorage und lädt Seite neu (oder triggert Context-Update)
- "Neuer Benutzer" öffnet Registrierungsformular (Name + Department)
- Aktiver User wird in Navigation oben rechts angezeigt

---

## Punkte-Impact
Keine direkte Punkte-Vergabe bei Registrierung.

---

## Tests

### E2E
- Happy Path: User registrieren → erscheint im UserPicker → auswählen → localStorage gesetzt
- Edge Case: Leerer Name → Validierungsfehler

### Unit
- `CreateUserSchema`: valide und invalide Inputs
