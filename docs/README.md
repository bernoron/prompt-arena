# PromptArena – Dokumentation

> Version 2.0.0 · Interne Unternehmensanwendung

Diese Dokumentation wird **automatisch aus dem Quellcode generiert** und ist stets aktuell.

---

## Inhalt

| Dokument | Beschreibung |
|---|---|
| [**Rekonstruktions-Prompt**](./00-rekonstruktions-prompt.md) | Ein-Datei-Prompt zum Wiederaufbau der App mit jedem KI-Tool |
| [Konzept & Anforderungen](./01-konzept.md) | Zweck, Use Cases, funktionale und nichtfunktionale Anforderungen |
| [Nutzerdokumentation](./02-nutzerdoku.md) | Anleitung für Endnutzer |
| [Architektur](./03-architektur.md) | Systemarchitektur, Komponenten, Datenfluss |
| [API-Referenz](./04-api-referenz.md) | Alle REST-Endpunkte mit Parametern und Antwortformaten |
| [Datenmodell](./05-datenmodell.md) | Datenbankschema, Entitäten und Relationen |
| [Entwicklerdokumentation](./06-entwickler.md) | Codestruktur, Konventionen, Sicherheit |
| [Onboarding](./07-onboarding.md) | Schnelleinstieg für neue Teammitglieder |

---

## Schnellübersicht

**PromptArena** ist eine gamifizierte interne Webanwendung, die Mitarbeitende motiviert,
KI-Prompts zu teilen, zu bewerten und weiterzuentwickeln.

### Tech-Stack

| Schicht | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend | Next.js API Routes (Edge-kompatibel) |
| Datenbank | SQLite via Prisma ORM |
| Validierung | Zod |
| Sprache | TypeScript |



---
*Automatisch generiert am 14.04.2026, 14:14 · [Quellcode](https://github.com/your-org/prompt-arena)*
