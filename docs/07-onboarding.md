# Onboarding – Schnelleinstieg

## Voraussetzungen

| Tool | Version | Prüfen mit |
|---|---|---|
| Node.js | ≥ 18 | `node --version` |
| npm | ≥ 9 | `npm --version` |
| Git | beliebig | `git --version` |

---

## Lokale Entwicklungsumgebung einrichten

```bash
# 1. Repository klonen
git clone <repo-url>
cd prompt-arena

# 2. Abhängigkeiten installieren (inkl. Zod, Prisma, Next.js ...)
npm install

# 3. Umgebungsvariablen anlegen
echo 'DATABASE_URL="file:./dev.db"' > .env

# 4. Datenbank erstellen und migrieren
npm run db:migrate

# 5. Beispieldaten laden
npm run db:seed

# 6. Entwicklungsserver starten
npm run dev
# → http://localhost:3000
```

Die App läuft jetzt lokal. Wechsle in der App oben rechts den Nutzer, um die
Gamification-Funktionen auszuprobieren.

---

## Schnell-Orientierung

| Ich will... | Ich schaue in... |
|---|---|
| Eine neue Kategorie hinzufügen | `lib/constants.ts` + `lib/validation.ts` |
| Punkte anpassen | `lib/points.ts` + `lib/constants.ts` (POINTS_GUIDE) |
| Eine neue Seite anlegen | `app/<name>/page.tsx` erstellen |
| Einen neuen API-Endpunkt bauen | `app/api/<name>/route.ts` + Zod-Schema |
| Die Datenbank ändern | `prisma/schema.prisma` → `npm run db:migrate` |
| Komponenten anpassen | `components/<Name>.tsx` |
| Mock-Auth verstehen | `hooks/useCurrentUser.ts` |
| Die Doku regenerieren | `npm run docs` |
| Seed-Daten ändern | `prisma/seed.ts` → `npm run db:reset` |

---

## Wichtige Architekturentscheidungen

### Warum SQLite?
Für ein internes Tool ohne Cloud-Infrastruktur ist SQLite die einfachste Option –
kein Datenbankserver nötig, kein Verbindungs-Pooling. Für Skalierung einfach
`schema.prisma` auf PostgreSQL umstellen (Prisma macht den Rest).

### Warum localStorage statt echte Auth?
Die App ist für vertrauenswürdiges Intranet konzipiert. Echter Login-Overhead
(NextAuth, SSO) wäre für den Anwendungsfall überdimensioniert. Die User-ID im
localStorage ist kein Security-Mechanismus, sondern Convenience.

### Warum Zod?
TypeScript prüft Typen nur zur Compile-Zeit. Zur Laufzeit können API-Clients beliebige
Daten senden. Zod validiert und parst Eingaben zur Laufzeit und gibt typsichere
Objekte zurück – in einer Zeile pro Endpunkt.

### Warum kein Redux / Zustand-Library?
Der App-State ist minimal: aktive Nutzer-ID (localStorage + Event), geladene Daten
(lokaler useState). Kein globaler State nötig. `useCurrentUser`-Hook reicht.

---

## Erste Aufgaben für neue Entwickelnde

1. **App lokal starten** (Schritte oben) und alle Seiten durchklicken
2. **Datenbankschema lesen** (`prisma/schema.prisma`) – 5 Modelle, klare Relationen
3. **Eine API-Route lesen** (`app/api/prompts/route.ts`) – zeigt das Muster: Rate-Limit → Validierung → DB
4. **`lib/constants.ts` lesen** – alle Magic Values, verstehe die Struktur
5. **Eine kleine Änderung testen**: Füge eine neue Abteilung in `DEPARTMENTS` ein und registriere einen Testnutzer

---

## Wo bekomme ich Hilfe?

- **Architekturübersicht**: [docs/03-architektur.md](./03-architektur.md)
- **API-Endpunkte**: [docs/04-api-referenz.md](./04-api-referenz.md)
- **Datenbank**: [docs/05-datenmodell.md](./05-datenmodell.md)
- **Code-Konventionen**: [docs/06-entwickler.md](./06-entwickler.md)
- **Projektverantwortliche**: Projektleitung / IT-Team ansprechen



---
*Automatisch generiert am 15.03.2026, 11:31 · [Quellcode](https://github.com/your-org/prompt-arena)*
