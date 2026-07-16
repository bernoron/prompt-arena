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
| Client-Auth-State verstehen | `hooks/useCurrentUser.ts` |
| Die Doku regenerieren | `npm run docs` |
| Seed-Daten ändern | `prisma/seed.ts` → `npm run db:reset` |

---

## Wichtige Architekturentscheidungen

### Warum SQLite?
Für eine schlanke Web-App ohne Cloud-Infrastruktur ist SQLite die einfachste Option –
kein Datenbankserver nötig, kein Verbindungs-Pooling. Für Skalierung einfach
`schema.prisma` auf PostgreSQL umstellen (Prisma macht den Rest).

### Warum kein NextAuth / SSO?
Login läuft über E-Mail + Passwort mit einem eigenen, schlanken Cookie-basierten
Session-Mechanismus (scrypt-Hashing, HMAC-signierter Cookie). Für den Umfang der
App wäre eine volle Auth-Library wie NextAuth überdimensioniert. Der Cookie ist
die einzige Quelle der Wahrheit — `lib/session.ts` löst ihn serverseitig auf
und reicht das Ergebnis per React Context an Client-Komponenten weiter.

### Warum Zod?
TypeScript prüft Typen nur zur Compile-Zeit. Zur Laufzeit können API-Clients beliebige
Daten senden. Zod validiert und parst Eingaben zur Laufzeit und gibt typsichere
Objekte zurück – in einer Zeile pro Endpunkt.

### Warum kein Redux / Zustand-Library?
Der App-State ist minimal: Identität kommt einmal pro Navigation aus dem
Session-Context (`SessionProvider`), Seitendaten leben in lokalem `useState`.
Kein globaler State nötig.

---

## Erste Aufgaben für neue Entwickelnde

1. **App lokal starten** (Schritte oben) und alle Seiten durchklicken
2. **Datenbankschema lesen** (`prisma/schema.prisma`) – 5 Modelle, klare Relationen
3. **Eine API-Route lesen** (`app/api/prompts/route.ts`) – zeigt das Muster: Rate-Limit → Validierung → DB
4. **`lib/constants.ts` lesen** – alle Magic Values, verstehe die Struktur
5. **Eine kleine Änderung testen**: Füge eine neue Kategorie in `lib/constants.ts` hinzu und registriere einen Testnutzer

---

## Wo bekomme ich Hilfe?

- **Architekturübersicht**: [docs/03-architektur.md](./03-architektur.md)
- **API-Endpunkte**: [docs/04-api-referenz.md](./04-api-referenz.md)
- **Datenbank**: [docs/05-datenmodell.md](./05-datenmodell.md)
- **Code-Konventionen**: [docs/06-entwickler.md](./06-entwickler.md)
- **Projektverantwortliche**: Projektleitung / IT-Team ansprechen



---
*Automatisch generiert am 16.07.2026, 23:20 · [Quellcode](https://github.com/your-org/prompt-arena)*
