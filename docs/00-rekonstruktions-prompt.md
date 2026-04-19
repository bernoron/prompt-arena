# Rekonstruktions-Prompt

> Kopiere den Prompt-Block unten vollständig in dein Vibe-Coding-Tool (Cursor, Copilot Chat,
> Claude, Gemini, etc.). Er enthält alle Informationen, um die PromptArena-Anwendung von
> Grund auf neu zu bauen.

---

```
Baue eine vollständige Next.js 14 App namens "PromptArena" – eine gamifizierte interne
Webanwendung für Mitarbeitende eines Unternehmens zum Teilen, Bewerten und Entdecken
von KI-Prompts.

════════════════════════════════════════════════════════════
TECH-STACK
════════════════════════════════════════════════════════════
- Next.js 14 mit App Router und TypeScript
- React 18, Tailwind CSS
- Prisma 5 ORM mit SQLite (DATABASE_URL="file:./dev.db")
- Zod für API-Input-Validierung
- Keine Auth-Library – Mock-Auth via localStorage

ABHÄNGIGKEITEN (package.json dependencies):
  "@prisma/client": "^5.22.0",
  "@types/canvas-confetti": "^1.9.0",
  "canvas-confetti": "^1.9.4",
  "next": "14.2.35",
  "prisma": "^5.22.0",
  "react": "^18",
  "react-dom": "^18",
  "tsx": "^4.21.0",
  "zod": "^3.23.8"

════════════════════════════════════════════════════════════
DATENBANKSCHEMA (prisma/schema.prisma – exakt so übernehmen)
════════════════════════════════════════════════════════════
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           Int      @id @default(autoincrement())
  name         String
  department   String
  avatarColor  String
  totalPoints  Int      @default(0)
  level        String   @default("Prompt-Lehrling")
  createdAt    DateTime @default(now())

  prompts              Prompt[]
  votes                Vote[]
  challengeSubmissions ChallengeSubmission[]
  favorites            Favorite[]
  lessonProgress       LessonProgress[]

  @@index([totalPoints])
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

  module   LearningModule  @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  progress LessonProgress[]

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
  votes                Vote[]
  challengeSubmissions ChallengeSubmission[]
  favorites            Favorite[]

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
  id        Int      @id @default(autoincrement())
  promptId  Int
  userId    Int
  createdAt DateTime @default(now())

  prompt Prompt @relation(fields: [promptId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

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
- /(user) → app/(user)/page.tsx

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
  - Abteilungsvergleich als horizontale Balken rechts

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
- FloatingPoints.tsx
- LevelBadge.tsx
- LevelUpModal.tsx
- Navigation.tsx
- PromptCard.tsx
- PromptModal.tsx
- UserPicker.tsx
- WeeklyChallengeCard.tsx

Navigation:
  - Dark navy (#0F172A) Hintergrund
  - Logo "Prompt**Arena**" mit Gradient-Icon "PA"
  - Links: Dashboard, Bibliothek, Rangliste, Profil
  - Aktiver Link: bg-emerald-500/20 text-emerald-400
  - Submit-Button mit Gradient linear-gradient(135deg, #059669, #0891b2)
  - UserPicker rechts mit dark=true Prop

UserPicker:
  - dark Prop für Navbar-Kontext
  - Lädt Nutzerliste beim Öffnen neu (frische Punkte)
  - Register-Formular eingebettet im Dropdown
  - localStorage-Key: 'promptarena_user_id'
  - Cross-Component-Sync via window.dispatchEvent(new CustomEvent('userChanged'))

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
  - Liest userId aus localStorage('promptarena_user_id')
  - Abonniert window-Event 'userChanged' für Cross-Component-Sync
  - Gibt number | null zurück

════════════════════════════════════════════════════════════
API-ROUTEN (app/api/)
════════════════════════════════════════════════════════════
- GET /api/admin/challenges
- POST /api/admin/challenges
- PATCH /api/admin/challenges/[id]
- DELETE /api/admin/challenges/[id]
- POST /api/admin/login
- POST /api/admin/logout
- DELETE /api/admin/prompts/[id]
- GET /api/admin/stats
- PATCH /api/admin/users/[id]
- DELETE /api/admin/users/[id]
- GET /api/challenges
- GET /api/favorites
- POST /api/favorites
- GET /api/health
- GET /api/learn
- POST /api/learn/[moduleSlug]/[lessonSlug]/complete
- GET /api/learn/[moduleSlug]/[lessonSlug]
- GET /api/prompts
- POST /api/prompts
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
  USER_ID_KEY = 'promptarena_user_id'
  AVATAR_COLORS = ['#1D9E75', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444',
                   '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16']
  DEPARTMENTS = ['Schaden', 'Vertrieb', 'IT', 'HR', 'Finanzen', 'Recht', 'Marketing', 'Aktuariat']
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
  CreateUserSchema:   { name: string min2 max80, department: string }
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
*Automatisch generiert am 19.04.2026, 21:36 · [Quellcode](https://github.com/your-org/prompt-arena)*
