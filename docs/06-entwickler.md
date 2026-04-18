# Entwicklerdokumentation

## Projektstruktur

```
prompt-arena/
├── app/                      # Next.js App Router
│   ├── api/                  # REST API Endpunkte
│   │   ├── challenges/       # GET /api/challenges
│   │   ├── prompts/          # GET + POST /api/prompts
│   │   ├── usage/            # POST /api/usage
│   │   ├── users/            # GET + POST /api/users
│   │   │   └── [id]/         # GET /api/users/:id
│   │   └── votes/            # POST /api/votes
│   ├── dashboard/            # Startseite mit Challenge + Aktivität
│   ├── leaderboard/          # Rangliste
│   ├── library/              # Prompt-Bibliothek
│   ├── profile/              # Nutzerprofil
│   ├── submit/               # Prompt einreichen
│   ├── globals.css           # Globale Stile + Utility-Klassen
│   └── layout.tsx            # Root-Layout (Navigation + Font)
├── components/               # Wiederverwendbare React-Komponenten
├── docs/                     # Generierte Dokumentation (diese Dateien)
├── hooks/                    # Custom React Hooks
│   └── useCurrentUser.ts     # Aktive Nutzer-ID aus localStorage
├── lib/                      # Shared Hilfsbibliotheken
│   ├── constants.ts          # Alle Magic Values (Farben, Kategorien, Level)
│   ├── db-helpers.ts         # Server-only Prisma-Hilfsfunktionen
│   ├── points.ts             # Gamification-Logik (Punkte + Level)
│   ├── prisma.ts             # Prisma-Client Singleton
│   ├── rate-limit.ts         # In-Memory Sliding-Window Rate Limiter
│   ├── types.ts              # TypeScript Domain-Typen
│   └── validation.ts         # Zod-Schemas für alle API-Inputs
├── prisma/
│   ├── schema.prisma         # Datenbankschema
│   └── seed.ts               # Seed-Skript mit Beispieldaten
├── scripts/
│   ├── generate-docs.ts      # Dokumentationsgenerator (dieses Skript)
│   └── watch-docs.ts         # Datei-Watcher für automatische Regenerierung
└── next.config.mjs           # Next.js Konfiguration + Security Headers
```

---

## Wichtige Konventionen

### Neue Kategorie hinzufügen
1. `lib/constants.ts` → Eintrag in `CATEGORY_CONFIG` ergänzen
2. `lib/validation.ts` → `CATEGORIES`-Array ergänzen
3. `prisma/schema.prisma` → keine Änderung nötig (String-Feld)
4. Fertig – alle Komponenten importieren aus `constants.ts`

### Neuen API-Endpunkt hinzufügen
1. Datei anlegen: `app/api/<name>/route.ts`
2. Zod-Schema in `lib/validation.ts` definieren
3. Rate-Limit aus `lib/rate-limit.ts` anwenden
4. Datei mit JSDoc-Kommentar dokumentieren (wird autom. in docs/ übernommen)

### Punkte ändern
1. Wert in `lib/points.ts → POINTS` anpassen
2. Beschriftung in `lib/constants.ts → POINTS_GUIDE` synchronisieren

### Mock-Auth erweitern
Die Nutzer-ID liegt in `localStorage['promptarena_user_id']`.
Änderungen werden via `window.dispatchEvent(new CustomEvent('userChanged'))` gebroadcastet.
Der `useCurrentUser`-Hook in `hooks/useCurrentUser.ts` abonniert dieses Event.

---

## Code-Qualitätsprinzipien

- **Single Source of Truth**: Magic Values in `lib/constants.ts`, nie inline
- **Zod-Validierung**: Alle API-Inputs werden mit `safeParse` geprüft – kein `req.json()` ohne Schema
- **Fehlerformat**: Alle Fehlerantworten haben die Form `{ "error": "..." }`
- **Punkte-Logik**: Immer über `awardPoints()` aus `lib/db-helpers.ts`
- **Kein Raw-SQL**: Ausschliesslich Prisma-Client-Methoden verwenden
- **TypeScript strict**: Keine `any`-Types – Domain-Typen aus `lib/types.ts`

---

## Verfügbare Scripts

| Befehl | Skript |
|---|---|
| `npm run dev` | `next dev` |
| `npm run build` | `next build` |
| `npm run start` | `next start` |
| `npm run lint` | `next lint` |
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | `prisma migrate dev --name init` |
| `npm run db:seed` | `tsx prisma/seed.ts` |
| `npm run db:reset` | `node -e "if(process.env.NODE_ENV==='production'){console.error('ERROR: db:reset is disabled in production!');process.exit(1)}" && npm run db:reset:dev` |
| `npm run db:reset:dev` | `prisma migrate reset --force && tsx prisma/seed.ts` |
| `npm run docs` | `tsx scripts/generate-docs.ts` |
| `npm run docs:watch` | `tsx scripts/watch-docs.ts` |
| `npm run setup:hooks` | `git config core.hooksPath .githooks` |
| `npm run postinstall` | `prisma generate` |
| `npm run prepare` | `[ "$CI" = "true" ] && echo 'Skipping git hooks in CI' || npm run setup:hooks` |
| `npm run test:unit` | `vitest run` |
| `npm run test:unit:watch` | `vitest` |
| `npm run test:unit:coverage` | `vitest run --coverage` |
| `npm run test:e2e` | `playwright test` |
| `npm run test:e2e:headed` | `playwright test --headed` |
| `npm run test` | `npm run test:unit && npm run test:e2e` |

---

## Sicherheits-Checkliste (vor jedem Deployment)

- [ ] Zod-Schema für jeden neuen POST-Endpunkt vorhanden
- [ ] Rate-Limit-Check als erste Zeile jedes Handlers
- [ ] Keine Raw-SQL-Queries eingebaut
- [ ] Security Headers in `next.config.mjs` noch vollständig
- [ ] `lib/validation.ts` bei neuen Enum-Werten aktualisiert
- [ ] `prisma.config.ts` existiert nicht (Prisma 5 – Datei nicht benötigt)



---
*Automatisch generiert am 18.04.2026, 22:28 · [Quellcode](https://github.com/your-org/prompt-arena)*
