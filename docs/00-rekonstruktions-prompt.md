# Rekonstruktions-Prompt

> Kopiere den Prompt-Block unten vollständig in dein Vibe-Coding-Tool (Cursor, Copilot Chat,
> Claude, Gemini, etc.). Er enthält alle Informationen, um die PromptArena-Anwendung von
> Grund auf neu zu bauen.

---

```
Baue eine vollständige Next.js 14 App namens "PromptArena" – eine gamifizierte öffentliche
Webanwendung zum Teilen, Bewerten und Entdecken von KI-Prompts.

════════════════════════════════════════════════════════════
TECH-STACK
════════════════════════════════════════════════════════════
- Next.js 14 mit App Router und TypeScript
- React 18, Tailwind CSS
- Prisma 5 ORM mit SQLite (DATABASE_URL="file:./dev.db")
- Zod für API-Input-Validierung
- Keine Auth-Library – eigener Cookie-basierter Login (E-Mail + Passwort, scrypt-Hashing, HMAC-signierter Session-Cookie)

ABHÄNGIGKEITEN (package.json dependencies):
  "@prisma/adapter-better-sqlite3": "^7.8.0",
  "@prisma/client": "^7.8.0",
  "@types/canvas-confetti": "^1.9.0",
  "better-sqlite3": "^12.11.1",
  "canvas-confetti": "^1.9.4",
  "next": "^16.2.10",
  "prisma": "^7.8.0",
  "react": "^19.2.7",
  "react-dom": "^19.2.7",
  "tsx": "^4.21.0",
  "zod": "^4.4.3"

════════════════════════════════════════════════════════════
DATENBANKSCHEMA (prisma/schema.prisma – exakt so übernehmen)
════════════════════════════════════════════════════════════
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
}

// @spec AC-12-002, AC-01-010
model User {
  id           Int      @id @default(autoincrement())
  name           String
  avatarColor    String
  passwordHash   String?
  emailHash      String?  @unique
  emailEncrypted String?
  totalPoints    Int      @default(0)
  level        String   @default("Prompt-Lehrling")
  createdAt    DateTime @default(now())
  // Set when the user self-deletes their account (CR-002). The row is kept as a
  // tombstone so authored prompts/votes stay referentially valid but anonymised:
  // name → "Gelöschter Nutzer #<id>", credential + PII columns nulled.
  deletedAt      DateTime?
  onboardingCompletedAt DateTime? // @spec AC-14-001 – NULL = Einführung noch nicht gesehen

  prompts              Prompt[]
  votes                Vote[]
  challengeSubmissions ChallengeSubmission[]
  favorites            Favorite[]
  usageEvents          UsageEvent[]
  lessonProgress       LessonProgress[]
  feedbacks            Feedback[]
  lessonFeedbacks      LessonFeedback[]
  topicSuggestions     TopicSuggestion[]
  pointsLedger         PointsLedger[]
  passwordResetTokens  PasswordResetToken[]

  @@unique([name])
  @@index([totalPoints])
  @@index([deletedAt])
}

// @spec AC-01-014
// One-time, time-limited password reset tokens (CR-003). Only the SHA-256 hash
// of the token is stored — the raw token lives solely in the emailed link, so a
// database read never exposes a usable reset credential. A token is valid once:
// usedAt is stamped on redemption and every other unused token for the user is
// invalidated at the same time.
model PasswordResetToken {
  id        Int       @id @default(autoincrement())
  userId    Int
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

// Idempotency + audit trail for one-time point awards (vote, favorite,
// lesson completion). The unique constraint is the actual guarantee that a
// given (userId, action, refId) combination is only ever awarded once —
// awardPoints() relies on catching its violation rather than a pre-check,
// closing the check-then-act race a plain SELECT-before-INSERT has.
//
// Deliberately NOT used for prompt usage: repeated "used this prompt" clicks
// are allowed to award points again each time (see lib/points.ts), so there
// is nothing to deduplicate there.
model PointsLedger {
  id        Int      @id @default(autoincrement())
  userId    Int
  action    String   // 'VOTE' | 'FAVORITE' | 'LESSON_COMPLETE'
  refId     Int      // meaning depends on action — see call sites in lib/services + routes
  delta     Int
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, action, refId])
  @@index([userId])
}

// ─── Learning Path ────────────────────────────────────────────────────────────

model LearningModule {
  id          Int      @id @default(autoincrement())
  slug        String   @unique
  title       String
  description String
  icon        String
  order       Int
  lessons     Lesson[]
}

model Lesson {
  id       Int    @id @default(autoincrement())
  slug     String
  moduleId Int
  title    String
  content  String  // JSON: ContentBlock[]
  order    Int
  points   Int     @default(15)

  module          LearningModule   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  progress        LessonProgress[]
  lessonFeedbacks LessonFeedback[]

  @@unique([moduleId, slug])
  @@index([moduleId])
}

model LessonProgress {
  id          Int      @id @default(autoincrement())
  userId      Int
  lessonId    Int
  completedAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([userId])
}

model PromptCategory {
  id    Int    @id @default(autoincrement())
  slug  String @unique          // 'writing', 'email' — used in API/validation
  label String                  // 'Writing', 'Email' — displayed in UI
  icon  String                  // Emoji displayed in badges
  color String                  // Tailwind color name, e.g. 'teal'
  order Int    @default(0)      // Display order in filters

  prompts Prompt[]

  @@index([order])
}

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
  categoryRef          PromptCategory?       @relation(fields: [category], references: [slug])
  votes                Vote[]
  challengeSubmissions ChallengeSubmission[]
  favorites            Favorite[]
  usageEvents          UsageEvent[]

  @@index([authorId])
  @@index([category])
  @@index([usageCount])
  @@index([createdAt])
}

model Vote {
  id        Int      @id @default(autoincrement())
  promptId  Int
  userId    Int
  value     Int
  createdAt DateTime @default(now())

  prompt Prompt @relation(fields: [promptId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@unique([promptId, userId])
  @@index([userId])
}

model Favorite {
  id            Int      @id @default(autoincrement())
  promptId      Int
  userId        Int
  isActive      Boolean  @default(true)   // false = user un-favorited (soft-delete)
  pointsAwarded Boolean  @default(false)  // true = author already received FAVORITE_PROMPT points
  createdAt     DateTime @default(now())

  prompt Prompt @relation(fields: [promptId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@unique([promptId, userId])
  @@index([userId])
  @@index([userId, isActive])
}

model UsageEvent {
  id        Int      @id @default(autoincrement())
  promptId  Int
  userId    Int
  createdAt DateTime @default(now())

  prompt Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([promptId, userId])
  @@index([userId])
}

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

  challenge WeeklyChallenge @relation(fields: [challengeId], references: [id])
  prompt    Prompt          @relation(fields: [promptId], references: [id])
  user      User            @relation(fields: [userId], references: [id])

  @@index([challengeId])
  @@index([userId])
  @@index([promptId])
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

model Feedback {
  id          Int      @id @default(autoincrement())
  userId      Int
  category    String   // BUG | IMPROVEMENT | IDEA | PRAISE
  text        String
  contextType String   @default("GENERAL") // GENERAL | LESSON | PROMPT
  contextId   Int?     // lessonId or promptId
  contextPath String?  // window.location.pathname
  status      String   @default("OPEN")    // OPEN | DONE
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([contextType])
  @@index([status])
  @@index([createdAt])
}

model LessonFeedback {
  id        Int      @id @default(autoincrement())
  userId    Int
  lessonId  Int
  helpful   Boolean
  text      String?
  createdAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([lessonId])
}

model TopicSuggestion {
  id          Int      @id @default(autoincrement())
  userId      Int
  title       String
  description String?
  status      String   @default("OPEN") // OPEN | PLANNED | DONE | REJECTED
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
}


════════════════════════════════════════════════════════════
GAMIFICATION-LOGIK
════════════════════════════════════════════════════════════
Punkte pro Aktion:
  SUBMIT_PROMPT: 20
  PROMPT_USED: 5
  VOTE_ON_PROMPT: 3
  FAVORITE_PROMPT: 10
  CHALLENGE_SUBMIT: 30
  CHALLENGE_WIN: 100
  COMPLETE_LESSON: 15

Level-Schwellenwerte:
  Prompt-Lehrling: ab 0 Pts
  Prompt-Handwerker: ab 100 Pts
  Prompt-Schmied: ab 300 Pts
  KI-Botschafter: ab 600 Pts

Level wird bei jedem Punkte-Award neu berechnet und in User.level gespeichert.
Für einen neuen Vote: erst prüfen ob Vote existiert, Punkte nur beim ERSTEN Vote.

════════════════════════════════════════════════════════════
SEITEN (app/ mit App Router)
════════════════════════════════════════════════════════════
- / → app/page.tsx (Redirect → /dashboard)
- /forgot-password → app/(auth)/forgot-password/page.tsx
- /login → app/(auth)/login/page.tsx
- /register → app/(auth)/register/page.tsx
- /reset-password → app/(auth)/reset-password/page.tsx
- /dashboard → app/(user)/dashboard/page.tsx
- /favorites → app/(user)/favorites/page.tsx
- /leaderboard → app/(user)/leaderboard/page.tsx
- /learn → app/(user)/learn/page.tsx
- /learn/[moduleSlug] → app/(user)/learn/[moduleSlug]/page.tsx
- /learn/[moduleSlug]/[lessonSlug] → app/(user)/learn/[moduleSlug]/[lessonSlug]/page.tsx
- /library → app/(user)/library/page.tsx
- /library/[id] → app/(user)/library/[id]/page.tsx
- /profile → app/(user)/profile/page.tsx
- /submit → app/(user)/submit/page.tsx
- /admin → app/admin/(panel)/page.tsx
- /admin/challenges → app/admin/(panel)/challenges/page.tsx
- /admin/feedback → app/admin/(panel)/feedback/page.tsx
- /admin/feedback/suggestions → app/admin/(panel)/feedback/suggestions/page.tsx
- /admin/prompts → app/admin/(panel)/prompts/page.tsx
- /admin/users → app/admin/(panel)/users/page.tsx
- /admin/login → app/admin/login/page.tsx

Dashboard (/dashboard):
  - Dark hero mit Nutzer-Avatar, Punkten, Level, XP-Fortschrittsbalken
  - Aktive Wochen-Challenge als Gradient-Card
  - Aktivitätsfeed der letzten Prompts
  - Punkte-Guide in der Sidebar

Bibliothek (/library):
  - Grid mit PromptCards (3 Spalten Desktop, 2 Tablet, 1 Mobile)
  - Filter nach Kategorie + Freitext-Suche (300ms debounce)
  - Modal mit DE/EN-Tabs, Bewertungssternen, Copy-Button, "Ich hab's genutzt"-Button
  - Zweisprachiger Tab nur sichtbar wenn EN ≠ DE

Einreichen (/submit):
  - Formular: Titel DE (Pflicht), Prompt DE (Pflicht), Kategorie (Pflicht),
    Schwierigkeit (Pflicht), Titel EN (optional), Prompt EN (optional)
  - Kategorie-Auswahl als Buttons, nicht Dropdown
  - Vorschau-Panel rechts
  - Fehlende Pflichtfelder als rote Pill-Badges angezeigt
  - EN-Felder fallen bei leerem Wert auf DE zurück (Fallback im POST-Body)
  - Optional: Verlinkung mit aktiver Wochen-Challenge

Rangliste (/leaderboard):
  - Dark purple hero header
  - Podium für Top 3 (👑 #1 mit Goldring, 🥈 #2, 🥉 #3)
  - Tabelle Rang 4–10
  - Eigener Rang immer sichtbar, auch wenn ausserhalb Top 10

Profil (/profile):
  - Dark hero mit farbigem Avatar, Name, Level-Badge
  - XP-Fortschrittsbalken mit Punkten und nächstem Level
  - Badge-Übersicht (X/7 errungen)
  - Alle eigenen Prompts als Cards

════════════════════════════════════════════════════════════
KOMPONENTEN (components/)
════════════════════════════════════════════════════════════
- CategoryBadge.tsx
- DifficultyBadge.tsx
- FeedbackButton.tsx
- FeedbackModal.tsx
- FloatingPoints.tsx
- LessonFeedback.tsx
- LevelBadge.tsx
- LevelUpModal.tsx
- Navigation.tsx
- OnboardingFunnel.tsx
- PromptCard.tsx
- PromptDetailActions.tsx
- PromptModal.tsx
- SessionProvider.tsx
- TopicSuggestionModal.tsx
- UserMenu.tsx
- WeeklyChallengeCard.tsx

Navigation:
  - Dark navy (#0F172A) Hintergrund
  - Logo "Prompt**Arena**" mit Gradient-Icon "PA"
  - Links: Dashboard, Bibliothek, Rangliste, Profil
  - Aktiver Link: bg-emerald-500/20 text-emerald-400
  - Submit-Button mit Gradient linear-gradient(135deg, #059669, #0891b2)
  - UserMenu rechts mit dark=true Prop

UserMenu:
  - dark Prop für Navbar-Kontext
  - Liest den Nutzer aus useSession() (React Context, siehe SessionProvider)
  - Zeigt Avatar + Name, Dropdown mit Profil-Link und Abmelden
  - Kein eigener Datenzugriff — die Identität kommt vom (user)-Layout

PromptCard:
  - Farbiger border-t-4 oben je nach Kategorie (accentBorder aus CATEGORY_CONFIG)
  - hover:-translate-y-1 hover:shadow-lg Lift-Effekt
  - Mono-Font-Vorschau im grauen bg-Block
  - EN-Titel nur angezeigt wenn ≠ DE-Titel

LevelBadge, CategoryBadge:
  - Importieren LEVEL_CONFIG / CATEGORY_CONFIG aus lib/constants.ts
  - size Prop: 'sm' | 'md'

════════════════════════════════════════════════════════════
HOOKS (hooks/)
════════════════════════════════════════════════════════════
useCurrentUser.ts:
  'use client' hook
  - Liest die Nutzer-ID aus dem SessionProvider-Context (components/SessionProvider.tsx)
  - Kein localStorage, kein Event-Bus — die Session kommt vom (user)-Layout
  - Gibt number | null zurück

════════════════════════════════════════════════════════════
API-ROUTEN (app/api/)
════════════════════════════════════════════════════════════
- DELETE /api/account
- GET /api/admin/categories
- POST /api/admin/categories
- PATCH /api/admin/categories/[id]
- DELETE /api/admin/categories/[id]
- GET /api/admin/challenges
- POST /api/admin/challenges
- PATCH /api/admin/challenges/[id]
- DELETE /api/admin/challenges/[id]
- GET /api/admin/feedback
- GET /api/admin/feedback/suggestions
- PATCH /api/admin/feedback/suggestions/[id]
- PATCH /api/admin/feedback/[id]
- DELETE /api/admin/feedback/[id]
- POST /api/admin/login
- POST /api/admin/logout
- DELETE /api/admin/prompts/[id]
- GET /api/admin/stats
- GET /api/admin/users
- PATCH /api/admin/users/[id]
- DELETE /api/admin/users/[id]
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/password-reset/confirm
- POST /api/auth/password-reset/request
- POST /api/auth/register
- GET /api/categories
- POST /api/categories
- GET /api/challenges
- GET /api/favorites
- POST /api/favorites
- GET /api/feedback/lesson
- POST /api/feedback/lesson
- PUT /api/feedback/lesson/[id]
- POST /api/feedback
- POST /api/feedback/suggestions
- GET /api/health
- GET /api/learn
- POST /api/learn/[moduleSlug]/[lessonSlug]/complete
- GET /api/learn/[moduleSlug]/[lessonSlug]
- POST /api/onboarding
- GET /api/prompts
- POST /api/prompts
- GET /api/prompts/trending
- POST /api/usage
- GET /api/users
- POST /api/users
- GET /api/users/[id]
- POST /api/votes

Jede Route folgt diesem Muster:
  1. Rate-Limit-Check: if (!writeLimiter.check(getClientIp(req))) return 429
  2. Zod-Validierung: const result = Schema.safeParse(body); if (!result.success) return 400
  3. Prisma-Operation
  4. Bei Fehler: return { error: '...' }, status 500

GET /api/users       – alle User nach totalPoints DESC
POST /api/users      – Nutzer anlegen, avatarColor round-robin aus AVATAR_COLORS
GET /api/users/[id]  – Nutzerprofil mit Prompts (inkl. avgRating, voteCount), globalem Rang
GET /api/prompts     – alle Prompts; optionale Query-Params: category, search, userId
POST /api/prompts    – Prompt anlegen, +20 Pts; optional Challenge verknüpfen (+30 Pts)
                       Challenge muss existieren und isActive=true sein
POST /api/votes      – Stern-Rating upsert; Punkte NUR beim ersten Vote (+3 Pts)
POST /api/usage      – usageCount++, Autor erhält +5 Pts
GET /api/challenges  – aktive WeeklyChallenge (isActive=true) oder null

════════════════════════════════════════════════════════════
LIB-DATEIEN (lib/)
════════════════════════════════════════════════════════════

constants.ts – SINGLE SOURCE OF TRUTH für alle Magic Values:
  AVATAR_COLORS = ['#1D9E75', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444',
                   '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16']
  CATEGORY_CONFIG = {
    Writing:  { icon: '✍️', bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   accentBorder: 'border-t-teal-400'   },
    Email:    { icon: '📧', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', accentBorder: 'border-t-indigo-400' },
    Analysis: { icon: '📊', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', accentBorder: 'border-t-orange-400' },
    Excel:    { icon: '📈', bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  accentBorder: 'border-t-green-400'  },
  }
  LEVEL_CONFIG = {
    'Prompt-Lehrling':   { icon: '📚', bg: 'bg-slate-100',  ... },
    'Prompt-Handwerker': { icon: '🔨', bg: 'bg-blue-50',    ... },
    'Prompt-Schmied':    { icon: '⚒️', bg: 'bg-amber-50',   ... },
    'KI-Botschafter':    { icon: '🏅', bg: 'bg-emerald-50', ... },
  }
  POINTS_GUIDE = [{ icon, action, pts }]

validation.ts – Zod-Schemas:
  CreateUserSchema:   { name: string min2 max80 }
  CreatePromptSchema: { title: min3 max120, titleEn?: max120, content: min10 max4000,
                        contentEn?: max4000, category: enum, difficulty: enum,
                        authorId: positiveInt, challengeId?: positiveInt }
  VoteSchema:         { promptId: positiveInt, userId: positiveInt, value: int 1-5 }
  UsageSchema:        { promptId: positiveInt }
  PathId:             string → positive integer transform
  validationError():  gibt { status: 400, body: { error: string } } zurück

rate-limit.ts – In-Memory Sliding-Window:
  createRateLimiter({ windowMs, max }) → { check(key): boolean }
  writeLimiter = { windowMs: 60_000, max: 30 }
  readLimiter  = { windowMs: 60_000, max: 120 }
  getClientIp(req): liest x-forwarded-for oder x-real-ip

db-helpers.ts:
  awardPoints(userId, points): increment totalPoints, recalculate + persist level
  calcAvgRating(votes): Durchschnitt gerundet auf 1 Dezimalstelle, 0 wenn keine Votes

prisma.ts – Singleton für Prisma Client (verhindert mehrere Connections im Dev-HMR)

════════════════════════════════════════════════════════════
DESIGN-SYSTEM
════════════════════════════════════════════════════════════
- Font: Inter (Google Fonts)
- Hintergrund: bg-slate-100
- Navigation: Hintergrund #0F172A (dark navy)
- Primär-Gradient: linear-gradient(135deg, #059669, #0891b2) (emerald → cyan)
- Cards: bg-white rounded-2xl border border-slate-200 shadow-sm
- Card Hover: hover:-translate-y-1 hover:shadow-lg transition-all duration-200
- Hero-Banner auf Seiten: dark gradient mit Glasmorphismus-Akzenten
- Level-XP-Bar: Gradient emerald→cyan
- Kategorie-Akzentfarben als border-t-4 auf PromptCards

════════════════════════════════════════════════════════════
SICHERHEIT (next.config.mjs)
════════════════════════════════════════════════════════════
Security Headers auf jede Response:
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  X-DNS-Prefetch-Control: off
  Content-Security-Policy:
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data:;
    connect-src 'self';
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self'

════════════════════════════════════════════════════════════
NPM SCRIPTS
════════════════════════════════════════════════════════════
dev           → next dev
build         → next build
db:generate   → prisma generate
db:migrate    → prisma migrate dev --name init
db:seed       → tsx prisma/seed.ts
db:reset      → prisma migrate reset --force && tsx prisma/seed.ts
docs          → tsx scripts/generate-docs.ts
docs:watch    → tsx scripts/watch-docs.ts

════════════════════════════════════════════════════════════
SETUP-REIHENFOLGE
════════════════════════════════════════════════════════════
1. npx create-next-app@14 prompt-arena --typescript --tailwind --app --no-src-dir
2. npm install prisma @prisma/client zod tsx recharts
3. Prisma initialisieren: npx prisma init --datasource-provider sqlite
4. schema.prisma ersetzen (siehe oben)
5. .env anlegen: DATABASE_URL="file:./dev.db"
6. npm run db:migrate
7. Seed-Script schreiben und npm run db:seed
8. lib/ Dateien anlegen (constants, points, types, db-helpers, validation, rate-limit, prisma)
9. hooks/useCurrentUser.ts anlegen
10. API-Routen implementieren (Muster: Rate-Limit → Zod → Prisma)
11. Komponenten implementieren (aus constants.ts importieren)
12. Seiten implementieren
13. next.config.mjs mit Security Headers ergänzen
14. npm run dev → http://localhost:3000
```



---
*Automatisch generiert am 16.07.2026, 22:26 · [Quellcode](https://github.com/your-org/prompt-arena)*
