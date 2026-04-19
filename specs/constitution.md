# Constitution – PromptArena

> Diese Datei ist das Gesetz. Kein Code wird geschrieben, der gegen diese Prinzipien verstößt.
> Claude liest diese Datei vor jedem `/specify`, `/plan`, `/tasks` und `/implement`.

---

## 1. Sprache & Stil

- UI-Texte: **Deutsch** (Ausnahme: technische Labels, Code-Kommentare auf Englisch)
- Prompt-Inhalte: **zweisprachig** – jedes Prompt hat `title` + `titleEn`, `content` + `contentEn`
- TypeScript: **strict mode**, kein `any`, keine `as`-Casts ohne Kommentar

---

## 2. Code-Qualität (nicht verhandelbar)

| Regel | Begründung |
|-------|-----------|
| Kein `any` in TypeScript | Typfehler werden zur Laufzeit nicht entdeckt |
| Kein Raw SQL | Prisma schützt vor Injection und hält Schema/Query in Sync |
| Keine Magic Values inline | Immer `lib/constants.ts` oder `lib/points.ts` |
| Zod-Validierung auf jedem POST-Body | Unvalidierter Input ist die häufigste Sicherheitslücke |
| Rate-Limiting auf jeder Route | Schutz vor Scraping und Missbrauch |
| Kein `console.log` in Produktion | Immer `lib/logger.ts` verwenden |

---

## 3. Architektur

- **Next.js 14 App Router**: Server Components by default, `'use client'` nur wenn nötig
- **Zwei Route Groups**: `app/(user)/` mit Navigation-Bar, `app/admin/` mit Sidebar
- **API-Routen**: Alle unter `app/api/`, kein serverseitiger Code in Page-Komponenten
- **Prisma 5 + SQLite**: Für lokale Deployments; Postgres via `DATABASE_URL` in Produktion
- **Shared Types**: Immer `lib/types.ts` — keine lokalen Interface-Definitionen in Pages
- **Shared Validation**: Immer `lib/validation.ts` — Zod-Schemas gehören nicht in die Route selbst

---

## 4. Testing (jedes Feature braucht beides)

| Test-Typ | Tool | Was wird getestet |
|----------|------|-------------------|
| Unit | Vitest | Logik-Funktionen (points, validation, helpers) |
| E2E | Playwright | User-Journeys von der UI aus |

- Jedes neue Feature hat mindestens **1 E2E-Happy-Path** und **1 Edge-Case**
- Akzeptanzkriterien aus der Feature-Spec werden direkt zu Test-Assertions
- Keine gemockten Datenbank-Verbindungen in E2E — immer gegen die echte Test-DB

---

## 5. Sicherheit

- Admin-Routen: immer durch `middleware.ts` geschützt (Session-Cookie-Check)
- Kein Passwort-Hashing für Admin nötig (internes Tool, einzelner Admin-User)
- User-IDs: immer positiv, immer via `PathId.safeParse()` validiert
- Keine sensiblen Daten in Logs (kein Passwort, kein Cookie-Wert)

---

## 6. Gamification-Regeln

Punkte werden **einmalig** pro Trigger vergeben. Entfernen einer Aktion gibt keine Punkte zurück.

| Aktion | Punkte | Empfänger |
|--------|--------|-----------|
| Prompt einreichen | +20 | Einreicher |
| Prompt wird benutzt | +5 | Autor |
| Prompt bewertet | +3 | Bewerter |
| Prompt favorisiert (erstmalig) | +10 | Autor |
| Challenge-Einreichung | +30 | Einreicher |
| Challenge gewonnen | +100 | Gewinner |
| Lektion abschliessen (einmalig) | +15 | Lernender |

Level-Schwellen: 0–99 Lehrling · 100–299 Handwerker · 300–599 Schmied · 600+ KI-Botschafter

---

## 7. SDD-Workflow

```
Neues Feature:  /specify <beschreibung>  →  /plan  →  /tasks  →  /implement
Bugfix:         Erst relevante Spec lesen → Code ändern → AC prüfen
Breaking Change: Erst constitution.md anpassen → dann Spec → dann Code
```

**Spec ist die Wahrheit. Code folgt der Spec — nie umgekehrt.**
