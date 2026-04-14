# Feature: Wöchentliche Challenges

## Metadaten
- **Status**: `implemented`
- **Feature-Nr**: 06
- **Letzte Änderung**: 2026-04-13

---

## User Story
Als Mitarbeiter will ich an wöchentlichen Themen-Challenges teilnehmen, um Bonus-Punkte zu verdienen und neue Prompt-Kategorien zu erkunden.

---

## Akzeptanzkriterien

- [x] **AC-06-001**: Aktive Challenge abrufen (GET /api/challenges)
- [x] **AC-06-002**: Prompt zu aktiver Challenge einreichen → +30 Punkte
- [x] **AC-06-003**: Challenge-Card auf Submit-Seite sichtbar wenn aktive Challenge vorhanden
- [x] **AC-06-004**: Admin kann Challenge erstellen, aktivieren und beenden
- [x] **AC-06-005**: Nur eine Challenge kann gleichzeitig aktiv sein
- [x] **AC-06-006**: Challenge-Gewinner erhält +100 Punkte (Admin vergibt)

---

## API-Vertrag

### GET /api/challenges
**Response 200**: `WeeklyChallengeData[]` (nur aktive, oder alle wenn admin)
```json
[{ "id": 1, "title": "...", "description": "...", "startDate": "ISO", "endDate": "ISO", "isActive": true, "submissionCount": 5 }]
```

### POST /api/prompts (mit challengeId)
**Body**: `{ ..., challengeId: number }`
**Seiteneffekte**: Prompt erstellen + ChallengeSubmission erstellen + `awardPoints(authorId, 30)`

### Admin: POST /api/admin/challenges
**Body**: `{ title, description, startDate, endDate }`
**Response 201**: WeeklyChallenge

### Admin: PUT /api/admin/challenges/[id]
**Body**: `{ isActive?: boolean, ... }`
**Logik**: Wenn `isActive: true` → alle anderen Challenges auf `isActive: false` setzen

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

  challenge WeeklyChallenge @relation(...)
  prompt    Prompt          @relation(...)
  user      User            @relation(...)

  @@index([challengeId])
  @@index([userId])
}
```

---

## UI-Verhalten

### Seite: `/submit`
- `WeeklyChallengeCard` erscheint wenn `GET /api/challenges` eine aktive Challenge zurückgibt
- Checkbox "Für diese Challenge einreichen"
- Bei Auswahl: `challengeId` im POST-Body mitgeschickt

### Admin: `/admin/challenges`
- Liste aller Challenges mit Status-Badges
- "Aktivieren"-Button: setzt isActive = true (deaktiviert andere)
- "Beenden"-Button: setzt isActive = false
- "Challenge erstellen"-Formular

---

## Punkte-Impact
| Aktion | Punkte | Empfänger |
|--------|--------|-----------|
| Challenge-Einreichung | +30 | Einreicher |
| Challenge gewonnen | +100 | Gewinner (Admin vergibt) |

---

## Tests

### E2E
- Happy Path: Aktive Challenge sichtbar auf /submit → Prompt mit Challenge einreichen
- Admin: Challenge erstellen → aktivieren → beenden

### Unit
- Keine separate Logik-Funktion (Punkte via awardPoints abgedeckt)
