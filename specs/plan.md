# Technischer Plan – PromptArena

## Stack (feststehend)

| Schicht | Technologie | Begründung |
|---------|------------|------------|
| Framework | Next.js 14 App Router | File-based Routing, Server Components, API Routes |
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
| `lib/constants.ts` | Alle Magic Values: Kategorien, Level, Farben, Departments |
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
