# Datenmodell

## Entity-Relationship-Diagramm

```
User 1──n Prompt
User 1──n Vote
User 1──n ChallengeSubmission

Prompt 1──n Vote
Prompt 1──n ChallengeSubmission

WeeklyChallenge 1──n ChallengeSubmission
```

---

## Entitäten

### User

| Feld | Typ | Pflicht | Hinweise |
|---|---|---|---|
| `id` | `Int` | Pflicht | @id @default(autoincrement()) |
| `name` | `String` | Pflicht |  |
| `department` | `String` | Pflicht |  |
| `avatarColor` | `String` | Pflicht |  |
| `totalPoints` | `Int` | Pflicht | @default(0) |
| `level` | `String` | Pflicht | @default("Prompt-Lehrling") |
| `createdAt` | `DateTime` | Pflicht | @default(now()) |
| `prompts` | `Prompt[]` | Pflicht |  |
| `votes` | `Vote[]` | Pflicht |  |
| `challengeSubmissions` | `ChallengeSubmission[]` | Pflicht |  |
| `favorites` | `Favorite[]` | Pflicht |  |
| `lessonProgress` | `LessonProgress[]` | Pflicht |  |

---

### LearningModule

| Feld | Typ | Pflicht | Hinweise |
|---|---|---|---|
| `id` | `Int` | Pflicht | @id @default(autoincrement()) |
| `slug` | `String` | Pflicht | @unique |
| `title` | `String` | Pflicht |  |
| `description` | `String` | Pflicht |  |
| `icon` | `String` | Pflicht |  |
| `order` | `Int` | Pflicht |  |
| `lessons` | `Lesson[]` | Pflicht |  |

---

### Lesson

| Feld | Typ | Pflicht | Hinweise |
|---|---|---|---|
| `id` | `Int` | Pflicht | @id @default(autoincrement()) |
| `slug` | `String` | Pflicht |  |
| `moduleId` | `Int` | Pflicht |  |
| `title` | `String` | Pflicht |  |
| `content` | `String` | Pflicht | JSON: ContentBlock[] |
| `order` | `Int` | Pflicht |  |
| `points` | `Int` | Pflicht | @default(15) |
| `module` | `LearningModule` | Pflicht | @relation(fields: [moduleId], references: [id], onDelete: Cascade) |
| `progress` | `LessonProgress[]` | Pflicht |  |

---

### LessonProgress

| Feld | Typ | Pflicht | Hinweise |
|---|---|---|---|
| `id` | `Int` | Pflicht | @id @default(autoincrement()) |
| `userId` | `Int` | Pflicht |  |
| `lessonId` | `Int` | Pflicht |  |
| `completedAt` | `DateTime` | Pflicht | @default(now()) |
| `user` | `User` | Pflicht | @relation(fields: [userId], references: [id], onDelete: Cascade) |
| `lesson` | `Lesson` | Pflicht | @relation(fields: [lessonId], references: [id], onDelete: Cascade) |

---

### Prompt

| Feld | Typ | Pflicht | Hinweise |
|---|---|---|---|
| `id` | `Int` | Pflicht | @id @default(autoincrement()) |
| `title` | `String` | Pflicht |  |
| `titleEn` | `String` | Pflicht |  |
| `content` | `String` | Pflicht |  |
| `contentEn` | `String` | Pflicht |  |
| `category` | `String` | Pflicht |  |
| `difficulty` | `String` | Pflicht |  |
| `authorId` | `Int` | Pflicht |  |
| `usageCount` | `Int` | Pflicht | @default(0) |
| `createdAt` | `DateTime` | Pflicht | @default(now()) |
| `author` | `User` | Pflicht | @relation(fields: [authorId], references: [id]) |
| `votes` | `Vote[]` | Pflicht |  |
| `challengeSubmissions` | `ChallengeSubmission[]` | Pflicht |  |
| `favorites` | `Favorite[]` | Pflicht |  |

---

### Vote

| Feld | Typ | Pflicht | Hinweise |
|---|---|---|---|
| `id` | `Int` | Pflicht | @id @default(autoincrement()) |
| `promptId` | `Int` | Pflicht |  |
| `userId` | `Int` | Pflicht |  |
| `value` | `Int` | Pflicht |  |
| `createdAt` | `DateTime` | Pflicht | @default(now()) |
| `prompt` | `Prompt` | Pflicht | @relation(fields: [promptId], references: [id]) |
| `user` | `User` | Pflicht | @relation(fields: [userId], references: [id]) |

---

### Favorite

| Feld | Typ | Pflicht | Hinweise |
|---|---|---|---|
| `id` | `Int` | Pflicht | @id @default(autoincrement()) |
| `promptId` | `Int` | Pflicht |  |
| `userId` | `Int` | Pflicht |  |
| `createdAt` | `DateTime` | Pflicht | @default(now()) |
| `prompt` | `Prompt` | Pflicht | @relation(fields: [promptId], references: [id]) |
| `user` | `User` | Pflicht | @relation(fields: [userId], references: [id]) |

---

### WeeklyChallenge

| Feld | Typ | Pflicht | Hinweise |
|---|---|---|---|
| `id` | `Int` | Pflicht | @id @default(autoincrement()) |
| `title` | `String` | Pflicht |  |
| `description` | `String` | Pflicht |  |
| `startDate` | `DateTime` | Pflicht |  |
| `endDate` | `DateTime` | Pflicht |  |
| `isActive` | `Boolean` | Pflicht | @default(false) |
| `submissions` | `ChallengeSubmission[]` | Pflicht |  |

---

### ChallengeSubmission

| Feld | Typ | Pflicht | Hinweise |
|---|---|---|---|
| `id` | `Int` | Pflicht | @id @default(autoincrement()) |
| `challengeId` | `Int` | Pflicht |  |
| `promptId` | `Int` | Pflicht |  |
| `userId` | `Int` | Pflicht |  |
| `createdAt` | `DateTime` | Pflicht | @default(now()) |
| `challenge` | `WeeklyChallenge` | Pflicht | @relation(fields: [challengeId], references: [id]) |
| `prompt` | `Prompt` | Pflicht | @relation(fields: [promptId], references: [id]) |
| `user` | `User` | Pflicht | @relation(fields: [userId], references: [id]) |

---

## Gamification-Werte (aus lib/points.ts)

### Punkte pro Aktion

| Aktion | Punkte |
|---|---|
| SUBMIT_PROMPT | +20 |
| PROMPT_USED | +5 |
| VOTE_ON_PROMPT | +3 |
| FAVORITE_PROMPT | +10 |
| CHALLENGE_SUBMIT | +30 |
| CHALLENGE_WIN | +100 |
| COMPLETE_LESSON | +15 |

### Level-Schwellenwerte

| Level | Ab | Bis |
|---|---|---|
| Prompt-Lehrling | 0 Pts | 99 Pts |
| Prompt-Handwerker | 100 Pts | 299 Pts |
| Prompt-Schmied | 300 Pts | 599 Pts |
| KI-Botschafter | 600 Pts | ∞ |

---

## Datenbanktyp
SQLite (Datei: `prisma/dev.db`). Die Datenbank wird über Prisma Migrate verwaltet.
Für Produktivbetrieb empfiehlt sich PostgreSQL (nur `schema.prisma` anpassen).



---
*Automatisch generiert am 23.04.2026, 06:46 · [Quellcode](https://github.com/your-org/prompt-arena)*
