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
| `/forgot-password` | app/(auth)/forgot-password/page.tsx |
| `/login` | app/(auth)/login/page.tsx |
| `/register` | app/(auth)/register/page.tsx |
| `/reset-password` | app/(auth)/reset-password/page.tsx |
| `/dashboard` | app/(user)/dashboard/page.tsx |
| `/favorites` | app/(user)/favorites/page.tsx |
| `/leaderboard` | app/(user)/leaderboard/page.tsx |
| `/learn` | app/(user)/learn/page.tsx |
| `/learn/[moduleSlug]` | app/(user)/learn/[moduleSlug]/page.tsx |
| `/learn/[moduleSlug]/[lessonSlug]` | app/(user)/learn/[moduleSlug]/[lessonSlug]/page.tsx |
| `/library` | app/(user)/library/page.tsx |
| `/library/[id]` | app/(user)/library/[id]/page.tsx |
| `/profile` | app/(user)/profile/page.tsx |
| `/submit` | app/(user)/submit/page.tsx |
| `/admin` | app/admin/(panel)/page.tsx |
| `/admin/challenges` | app/admin/(panel)/challenges/page.tsx |
| `/admin/feedback` | app/admin/(panel)/feedback/page.tsx |
| `/admin/feedback/suggestions` | app/admin/(panel)/feedback/suggestions/page.tsx |
| `/admin/prompts` | app/admin/(panel)/prompts/page.tsx |
| `/admin/users` | app/admin/(panel)/users/page.tsx |
| `/admin/login` | app/admin/login/page.tsx |

---

## 3. Komponenten

- **CategoryBadge**
- **DifficultyBadge**
- **FeedbackButton**
- **FeedbackModal**
- **FloatingPoints**
- **LessonFeedback**
- **LevelBadge**
- **LevelUpModal**
- **Navigation**
- **OnboardingFunnel**
- **PromptCard**
- **PromptDetailActions**
- **PromptModal**
- **SessionProvider**
- **TopicSuggestionModal**
- **UserMenu**
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

## 5. Authentifizierung

Nutzer melden sich mit E-Mail und Passwort an. Das Backend setzt einen
HMAC-signierten, HttpOnly-Cookie (`user_session`); Passwörter werden mit
scrypt gehasht. Der signierte Cookie ist die **einzige** Quelle der Wahrheit —
es gibt keinen localStorage-Spiegel und keinen Client-Event-Bus mehr.

`lib/session.ts` liest den Cookie serverseitig (`getSessionUser()`) und gibt
den vollständigen Nutzer an das `(user)`-Layout (Server Component) weiter.
Das Layout reicht ihn über `<SessionProvider>` (React Context) an alle
Client-Komponenten durch:

```
app/(user)/layout.tsx  (Server Component)
  → getSessionUser()               // liest + verifiziert den Cookie
  → <SessionProvider user={user}>  // React Context, einmal pro Navigation befüllt
      → useSession()                // voller Nutzer (Name, Avatar, Punkte, Level)
      → useCurrentUser()            // nur die ID, für schlanke Konsumenten
```

Ein Login/Logout löst immer eine Next.js-Navigation aus, wodurch das Layout
den Cookie neu auswertet — ein manueller Sync-Mechanismus ist dafür nicht nötig.

---

## 6. Sicherheitsarchitektur

| Massnahme | Implementierung |
|---|---|
| Input-Validierung | Zod-Schemas in `lib/validation.ts` für alle API-Inputs |
| Rate Limiting | Sliding-Window-Limiter in `lib/rate-limit.ts` (30 W / 120 R pro Min/IP, 10 Auth-Versuche / 15 Min); Speicher gedeckelt (max. 10 000 Keys) |
| Client-IP-Ermittlung | `getClientIp()` vertraut nur Plattform-Headern (`Fly-Client-IP`, `CF-Connecting-IP`, `X-Real-IP`) bzw. dem **letzten** `X-Forwarded-For`-Hop — der erste Eintrag ist Client-fälschbar |
| User-Sessions | HMAC-SHA256-signierter HttpOnly-Cookie `{userId}.{issuedAt}.{sig}`; serverseitiger Ablauf nach 30 Tagen; `Secure` + `SameSite=strict` |
| Admin-Sessions | HMAC-signiertes Token mit Nonce + Timestamp, 7 Tage gültig; Middleware- **und** Handler-seitige Prüfung (Defence in Depth) |
| Passwörter | scrypt mit zufälligem Salt (`lib/password.ts`); Timing-safe-Vergleich; Dummy-Hash gegen User-Enumeration beim Login |
| E-Mail-Daten | AES-256-GCM-verschlüsselt at rest + HMAC-Blind-Index für Uniqueness (`lib/email-crypto.ts`) |
| Security Headers | CSP (inkl. `object-src 'none'`, `frame-ancestors 'none'`), HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy in `next.config.mjs` |
| Request-ID | Middleware überschreibt eingehende `x-request-id`-Header — Log-Injection über gefälschte IDs ist nicht möglich |
| Image Optimizer | Deaktiviert (`images.unoptimized`) — `/_next/image` als DoS-Angriffsfläche entfällt |
| SQL-Injection | Prisma ORM (parametrisierte Queries, kein Raw-SQL) |
| Enum-Validierung | Kategorien und Schwierigkeit durch Zod-Enum eingeschränkt |
| Duplikat-Votes | DB-Unique-Constraint `@@unique([promptId, userId])` |
| Points-Farming | Points nur bei erstem Vote (Pre-Upsert-Check) |
| Startup-Check | `instrumentation.ts` verweigert Produktions-Start ohne `ADMIN_SECRET`, `USER_SECRET`, `EMAIL_SECRET`, `DATABASE_URL` |

---

## 7. Abhängigkeiten

| Paket | Version |
|---|---|
| `@prisma/adapter-better-sqlite3` | ^7.8.0 |
| `@prisma/client` | ^7.8.0 |
| `@types/canvas-confetti` | ^1.9.0 |
| `better-sqlite3` | ^12.11.1 |
| `canvas-confetti` | ^1.9.4 |
| `next` | ^16.2.10 |
| `prisma` | ^7.8.0 |
| `react` | ^19.2.7 |
| `react-dom` | ^19.2.7 |
| `tsx` | ^4.21.0 |
| `zod` | ^4.4.3 |



---
*Automatisch generiert am 09.07.2026, 21:29 · [Quellcode](https://github.com/your-org/prompt-arena)*
