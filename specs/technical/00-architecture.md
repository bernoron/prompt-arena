# Technischer Plan – PromptArena

## Stack (feststehend)

| Schicht | Technologie | Begründung |
|---------|------------|------------|
| Framework | Next.js 16 App Router (React 19) | File-based Routing, Server Components, API Routes; async Request-APIs (`params`/`cookies()` sind Promises) |
| Datenbank | Prisma 5 + SQLite | Dateibasiert, kein separater DB-Server nötig |
| Styling | TailwindCSS | Utility-first, kein Build-Overhead |
| Validierung | Zod | TypeScript-first, wiederverwendbare Schemas |
| Unit-Tests | Vitest | Schnell, ESM-native |
| E2E-Tests | Playwright | Verlässlich, cross-browser |
| Deployment | Docker | Reproduzierbar, portable |

## Architektur

```
app/
├── (user)/          # Route Group: Navigation-Bar, öffentliche Routen
│   ├── layout.tsx   # Navigation + UserPicker eingebunden
│   ├── page.tsx     # Home
│   ├── dashboard/
│   ├── library/
│   ├── favorites/
│   ├── leaderboard/
│   ├── profile/
│   └── submit/
├── admin/           # Route Group: Sidebar, passwortgeschützt via middleware
│   ├── (panel)/     # Innere Group: Panel-Layout
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── challenges/
│   │   ├── prompts/
│   │   └── users/
│   └── login/
└── api/             # REST-API Routes
    ├── users/
    ├── prompts/
    ├── votes/
    ├── usage/
    ├── favorites/
    ├── challenges/
    ├── health/
    └── admin/
        ├── login/
        ├── logout/
        ├── challenges/
        ├── prompts/
        ├── stats/
        └── users/
```

## Schlüsseldateien

| Datei | Zweck |
|-------|-------|
| `lib/constants.ts` | Alle Magic Values: Kategorien, Level, Farben |
| `lib/points.ts` | Gamification-Logik: Punkte-Konstanten, Level-Berechnung |
| `lib/types.ts` | Shared TypeScript-Interfaces für API-Responses |
| `lib/validation.ts` | Alle Zod-Schemas für POST-Bodies |
| `lib/db-helpers.ts` | Server-only Prisma-Helpers (awardPoints, calcAvgRating) |
| `middleware.ts` | Admin-Auth-Guard + Request-ID-Injection |
| `prisma/schema.prisma` | DB-Schema (einzige Wahrheit für Datenstruktur) |

## Datenfluss

```
Browser → Next.js Route Handler → Zod Validate → Prisma Query → JSON Response
                                        ↓
                                 Rate Limiter (readLimiter / writeLimiter)
```

## Sicherheitsarchitektur

Die Anwendung ist öffentlich im Internet erreichbar — jede Route wird als
angreifbar behandelt.

| Ebene | Massnahme |
|---|---|
| Transport | HSTS (2 Jahre, includeSubDomains); Cookies `Secure` + `HttpOnly` + `SameSite=strict` |
| Browser | CSP mit `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`; X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy |
| Authentisierung | User: HMAC-signierter Cookie `{userId}.{issuedAt}.{sig}` mit serverseitigem 30-Tage-Ablauf. Admin: HMAC-Token (Nonce + Timestamp), 7 Tage |
| Autorisierung | Middleware-Guard für `/admin/*` und alle User-Seiten; jede Admin-API prüft zusätzlich in-handler (`requireAdmin`); Schreib-APIs erzwingen Session-userId (`resolveUserId` — kein IDOR über Body-userId) |
| Rate Limiting | Jeder Route-Handler: `readLimiter` (120/min), `writeLimiter` (30/min), `authLimiter` (10/15 min). IP aus vertrauenswürdigen Proxy-Headern (letzter XFF-Hop, nie der erste); Store auf 10 000 Keys gedeckelt |
| Input | Zod-Schema auf jedem POST/PATCH; Längenlimits; Namens-Regex blockiert HTML-Metazeichen (Stored-XSS) |
| Daten | Passwörter: scrypt + Salt; E-Mails: AES-256-GCM at rest + HMAC-Blind-Index; kein Raw-SQL (Prisma) |
| Betrieb | `instrumentation.ts` bricht Produktions-Start ohne vollständige Secrets ab; Fehlerdetails werden Clients nie gezeigt; `x-request-id` wird von der Middleware überschrieben (kein Log-Spoofing); Image-Optimizer deaktiviert |

**Bekannte Restrisiken (Stand Audit 2026-07):**
- `script-src 'unsafe-inline'` in der CSP ist für Next.js-Hydration nötig; Nonce-basierte CSP wäre der nächste Härtungsschritt.
- Admin-Sessions sind stateless und können vor Ablauf (7 Tage) nicht serverseitig widerrufen werden.
- Next.js 14.2.x hat offene Advisories (überwiegend DoS/Cache-Poisoning), die erst in Next 16 gefixt sind → Framework-Upgrade als eigener Change Request geplant. Mitigiert: Image-Optimizer deaktiviert, kein `next/image` im Einsatz, keine betroffene Rewrites-/i18n-Konfiguration.
- Rate Limiting ist prozesslokal — bei Multi-Replica-Deployment durch Redis-basierte Lösung ersetzen.

## Performance-Strategie
- Keine `include: { votes: true }` — immer `groupBy`-Aggregat statt alle Vote-Zeilen laden
- Parallel-Queries via `Promise.all()` wo keine Abhängigkeit
- HTTP-Cache-Header auf öffentlichen GET-Endpunkten (`s-maxage=20`)
- `awardPoints`: Level-Update nur wenn sich Level tatsächlich ändert

## Bidirektionaler Spec↔Code-Sync
- Jedes Akzeptanzkriterium hat eine ID: `AC-[Feature-Nr]-[Nr]` (z.B. `AC-01-003`)
- Code der ein AC implementiert trägt einen Kommentar: `// @spec AC-01-003`
- `scripts/spec-sync.mjs` scannt Code + Specs → zeigt welche ACs implementiert/offen sind
- `.claude/settings.json` PostToolUse-Hook: nach jeder Code-Änderung automatisch `spec-sync` ausführen
