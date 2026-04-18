# Architektur

## 1. Systemübersicht

PromptArena ist eine **monolithische Next.js-Anwendung** (Full-Stack) mit einem
integrierten API-Layer. Frontend und Backend laufen als einziger Prozess.

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                    │
│  React 18 + Tailwind CSS + Next.js App Router          │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (fetch)
┌──────────────────────▼──────────────────────────────────┐
│                  Next.js Server                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  App Router Pages (RSC + Client Components)    │   │
│  │  /dashboard  /library  /submit  /leaderboard   │   │
│  │  /profile                                       │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  API Routes  /api/prompts  /api/votes            │   │
│  │              /api/users    /api/usage            │   │
│  │              /api/challenges                     │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  Zod Validation  │  Rate Limiter                │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  Prisma ORM (Prisma Client v5)                  │   │
│  └──────────────────────┬──────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │ SQLite File
┌─────────────────────────▼───────────────────────────────┐
│                  SQLite (dev.db)                        │
│  User  Prompt  Vote  WeeklyChallenge  ChallengeSubmit.  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Seiten (App Router)

| Route | Datei |
|---|---|
| `/` | app/page.tsx (Redirect → /dashboard) |
| `/(user)` | app/(user)/page.tsx |

---

## 3. Komponenten

- **CategoryBadge**
- **DifficultyBadge**
- **FloatingPoints**
- **LevelBadge**
- **LevelUpModal**
- **Navigation**
- **PromptCard**
- **PromptModal**
- **UserPicker**
- **WeeklyChallengeCard**

### Komponentenprinzipien
- **Server Components** wo immer möglich (keine interaktiven State-Updates)
- **Client Components** (`'use client'`) nur wenn Browser-APIs oder React-Hooks benötigt
- **Kein Prop-Drilling** dank `useCurrentUser`-Hook für die Nutzer-ID
- **Design-System** über Tailwind Utility Classes + globale Klassen in `globals.css`

---

## 4. Datenfluss

```
Nutzer-Aktion (z.B. Prompt bewerten)
  │
  ├─► React Component (Client)
  │     Ruft fetch('/api/votes', { method: 'POST', body: ... }) auf
  │
  ├─► API Route /api/votes
  │     1. Rate-Limit-Check (IP → writeLimiter)
  │     2. Zod-Validierung (VoteSchema.safeParse)
  │     3. Prüft ob Vote bereits existiert (first-vote detection)
  │     4. prisma.vote.upsert(...)
  │     5. awardPoints() nur bei neuem Vote
  │     6. NextResponse.json(vote)
  │
  └─► SQLite via Prisma
        Vote-Record upsert + User.totalPoints increment
        + User.level recalculate
```

---

## 5. Authentifizierung (Mock-Auth)

Die App nutzt **localStorage-basierte Mock-Authentifizierung** – konzipiert für den
internen Einsatz ohne IT-Infrastruktur-Overhead.

```
localStorage['promptarena_user_id'] = "42"   // gespeicherte Nutzer-ID
window.dispatchEvent(new CustomEvent('userChanged'))  // cross-component sync
```

Der `useCurrentUser`-Hook abstrahiert dieses Pattern in allen Client-Komponenten.

> **Hinweis für Produktivbetrieb:** Für sensiblere Daten sollte eine
> NextAuth.js- oder SSO-Integration ergänzt werden.

---

## 6. Sicherheitsarchitektur

| Massnahme | Implementierung |
|---|---|
| Input-Validierung | Zod-Schemas in `lib/validation.ts` für alle API-Inputs |
| Rate Limiting | Sliding-Window-Limiter in `lib/rate-limit.ts` (30 W / 120 R pro Min/IP) |
| Security Headers | CSP, X-Frame-Options, Referrer-Policy in `next.config.mjs` |
| SQL-Injection | Prisma ORM (parametrisierte Queries, kein Raw-SQL) |
| Enum-Validierung | Kategorien und Schwierigkeit durch Zod-Enum eingeschränkt |
| Duplikat-Votes | DB-Unique-Constraint `@@unique([promptId, userId])` |
| Points-Farming | Points nur bei erstem Vote (Pre-Upsert-Check) |

---

## 7. Abhängigkeiten

| Paket | Version |
|---|---|
| `@prisma/client` | ^5.22.0 |
| `@types/canvas-confetti` | ^1.9.0 |
| `canvas-confetti` | ^1.9.4 |
| `next` | 14.2.35 |
| `prisma` | ^5.22.0 |
| `react` | ^18 |
| `react-dom` | ^18 |
| `tsx` | ^4.21.0 |
| `zod` | ^3.23.8 |



---
*Automatisch generiert am 18.04.2026, 22:28 · [Quellcode](https://github.com/your-org/prompt-arena)*
