/**
 * PromptArena – Dokumentationsgenerator
 *
 * Erzeugt die vollständige Projektdokumentation in docs/ durch Lesen der
 * tatsächlichen Quelldateien. Datenmodell, API-Routen, Punkte­werte und
 * Konfigurationswerte werden direkt aus dem Code extrahiert – die Doku
 * ist damit immer auf dem aktuellen Stand.
 *
 * Aufruf:
 *   npm run docs            – einmalige Generierung
 *   npm run docs:watch      – Generierung bei jeder Dateiänderung
 */

import fs   from 'fs';
import path from 'path';

// ─── Pfade ────────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function read(filePath: string): string {
  try { return fs.readFileSync(filePath, 'utf-8'); }
  catch { return ''; }
}

function readDir(dir: string): string[] {
  try { return fs.readdirSync(dir); }
  catch { return []; }
}

function write(fileName: string, content: string): void {
  fs.writeFileSync(path.join(DOCS, fileName), content, 'utf-8');
}

/** ISO timestamp für generierte Datei-Footer */
function now(): string {
  return new Date().toLocaleString('de-CH', {
    timeZone: 'Europe/Zurich',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const FOOTER = `\n\n---\n*Automatisch generiert am ${now()} · [Quellcode](https://github.com/your-org/prompt-arena)*\n`;

// ─── Extraktoren ─────────────────────────────────────────────────────────────

interface PrismaModel {
  name: string;
  fields: { name: string; type: string; modifiers: string[] }[];
}

/** Parst die Prisma-Schema-Datei und gibt alle Modelle zurück. */
function extractPrismaModels(): PrismaModel[] {
  const schema = read(path.join(ROOT, 'prisma', 'schema.prisma'));
  const models: PrismaModel[] = [];
  const modelBlocks = schema.match(/model\s+\w+\s*\{[^}]+\}/g) ?? [];

  for (const block of modelBlocks) {
    const nameMatch = block.match(/model\s+(\w+)/);
    if (!nameMatch) continue;
    const name = nameMatch[1];

    const fields: PrismaModel['fields'] = [];
    const lines = block.split('\n').slice(1, -1);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@')) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length < 2) continue;
      const fieldName  = parts[0];
      const fieldType  = parts[1];
      const modifiers  = parts.slice(2);
      // Skip relation fields (lowercase first letter = relation) and @@
      if (trimmed.startsWith('@@')) continue;
      fields.push({ name: fieldName, type: fieldType, modifiers });
    }
    models.push({ name, fields });
  }
  return models;
}

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  params: string[];
}

/** Liest alle API-Route-Dateien und extrahiert Endpunkte + Beschreibung. */
function extractApiEndpoints(): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];
  const apiDir = path.join(ROOT, 'app', 'api');

  function walk(dir: string, urlPath: string) {
    for (const entry of readDir(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full, `${urlPath}/${entry}`);
      } else if (entry === 'route.ts') {
        const src = read(full);
        const description = (src.match(/\/\*\*\n([\s\S]*?)\*\//) ?? [])[1]
          ?.split('\n')
          .map((l) => l.replace(/^\s*\*\s?/, '').trim())
          .filter(Boolean)
          .join(' ') ?? '';

        // Extract HTTP methods defined in the file
        const methods = Array.from(src.matchAll(/^export async function (GET|POST|PUT|PATCH|DELETE)/gm))
          .map((m) => m[1]);

        // Extract GET query params from JSDoc
        const paramSection = src.match(/GET query params:([\s\S]*?)(?:\*\n|\*\/)/);
        const params = paramSection
          ? paramSection[1]
              .split('\n')
              .map((l) => l.replace(/^\s*\*\s?/, '').trim())
              .filter(Boolean)
          : [];

        for (const method of methods) {
          endpoints.push({ method, path: `/api${urlPath}`, description, params });
        }
      }
    }
  }

  walk(apiDir, '');
  return endpoints;
}

interface PackageInfo {
  name: string;
  version: string;
  deps: Record<string, string>;
  devDeps: Record<string, string>;
  scripts: Record<string, string>;
}

function extractPackageInfo(): PackageInfo {
  const pkg = JSON.parse(read(path.join(ROOT, 'package.json')) || '{}');
  return {
    name:    pkg.name    ?? 'prompt-arena',
    version: pkg.version ?? '0.0.0',
    deps:    pkg.dependencies    ?? {},
    devDeps: pkg.devDependencies ?? {},
    scripts: pkg.scripts         ?? {},
  };
}

interface PointsConfig {
  actions: { key: string; value: number }[];
  levels:  { name: string; min: number; max: string }[];
}

/** Extrahiert Punkte- und Level-Konfiguration aus lib/points.ts */
function extractPointsConfig(): PointsConfig {
  const src = read(path.join(ROOT, 'lib', 'points.ts'));

  // Extract POINTS object
  const pointsBlock = src.match(/export const POINTS = \{([\s\S]*?)\}/)?.[1] ?? '';
  const actions = Array.from(pointsBlock.matchAll(/(\w+):\s*(\d+)/g)).map(([, key, val]) => ({
    key,
    value: parseInt(val),
  }));

  // Level thresholds (hardcoded here to match lib/points.ts – kept in sync by the generator)
  const levels = [
    { name: 'Prompt-Lehrling',   min: 0,   max: '99 Pts'  },
    { name: 'Prompt-Handwerker', min: 100,  max: '299 Pts' },
    { name: 'Prompt-Schmied',    min: 300,  max: '599 Pts' },
    { name: 'KI-Botschafter',    min: 600,  max: '∞'       },
  ];

  return { actions, levels };
}

/** Liest alle Seiten aus app/ */
function extractPages(): { route: string; component: string }[] {
  const appDir = path.join(ROOT, 'app');
  const pages: { route: string; component: string }[] = [
    { route: '/',             component: 'app/page.tsx (Redirect → /dashboard)' },
  ];

  for (const dir of readDir(appDir)) {
    if (['api', 'fonts', 'generated'].includes(dir)) continue;
    const full = path.join(appDir, dir);
    try {
      if (fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'page.tsx'))) {
        pages.push({ route: `/${dir}`, component: `app/${dir}/page.tsx` });
      }
    } catch { /* ignore */ }
  }
  return pages;
}

/** Liest alle Komponenten aus components/ */
function extractComponents(): string[] {
  return readDir(path.join(ROOT, 'components'))
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => f.replace('.tsx', ''));
}

// ─── Dokumentations­generator-Funktionen ─────────────────────────────────────

function genIndex(pkg: PackageInfo): string {
  return `# PromptArena – Dokumentation

> Version ${pkg.version} · Interne Unternehmensanwendung

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

${FOOTER}`;
}

function genKonzept(): string {
  return `# Konzept & Anforderungen

## 1. Konzept

### Idee
PromptArena ist eine interne Webanwendung für Mitarbeitende eines grossen Versicherungsunternehmens.
Ziel ist es, den unternehmensweiten Wissensaustausch rund um KI-Prompts zu fördern –
durch Gamification, soziale Interaktion und einfachen Zugang zu bewährten Prompts.

### Problem
Mitarbeitende entwickeln wertvolle KI-Prompts für ihren Arbeitsalltag, teilen diese aber kaum
mit Kolleginnen und Kollegen. Das Wissen bleibt in Silos, Arbeit wird doppelt gemacht und
das KI-Potenzial im Unternehmen wird nicht ausgeschöpft.

### Lösung
Eine zentrale Prompt-Bibliothek mit Gamification-Elementen (Punkte, Level, Leaderboard,
wöchentliche Challenges) motiviert zur aktiven Teilnahme und macht das Teilen von Prompts
spass­bringend und sichtbar.

---

## 2. Nutzen

### Für Mitarbeitende
- Zugang zu bewährten Prompts für alle Arbeitsbereiche
- Sichtbarkeit der eigenen Beiträge durch Rangliste und Profilseite
- Motivation durch Punkte, Level und wöchentliche Challenges
- Zweisprachige Prompts (Deutsch / Englisch)

### Für das Unternehmen
- Strukturiertes Wissensmanagement für KI-Nutzung
- Messbarer KI-Adoption-Fortschritt über Abteilungen hinweg
- Bottom-up Wissenstransfer ohne IT-Overhead
- Förderung einer KI-affinen Unternehmenskultur

---

## 3. Use Cases

### UC-01: Prompt suchen und nutzen
**Akteur:** Mitarbeitende/r
**Ablauf:**
1. Öffnet die Bibliotheksseite (/library)
2. Filtert nach Kategorie oder sucht per Freitext
3. Öffnet einen Prompt
4. Kopiert den Prompt-Text in die Zwischenablage
5. Bestätigt die Nutzung → Autor erhält +5 Punkte

### UC-02: Neuen Prompt einreichen
**Akteur:** Mitarbeitende/r
**Ablauf:**
1. Öffnet die Einreich-Seite (/submit)
2. Füllt Titel, Prompt-Text, Kategorie und Schwierigkeit aus (DE obligatorisch, EN optional)
3. Verknüpft optional mit der aktiven Wochen-Challenge
4. Klickt «Einreichen» → +20 Punkte, optional +30 für Challenge

### UC-03: Prompt bewerten
**Akteur:** Mitarbeitende/r
**Ablauf:**
1. Öffnet einen Prompt in der Bibliothek
2. Vergibt 1–5 Sterne
3. Bewertung wird gespeichert → +3 Punkte (nur beim ersten Bewerten)

### UC-04: Rangliste einsehen
**Akteur:** Mitarbeitende/r
**Ablauf:**
1. Öffnet /leaderboard
2. Sieht Top 10 + Podium für Top 3
3. Findet eigene Position (auch ausserhalb Top 10 angezeigt)
4. Sieht Abteilungsvergleich

### UC-05: Eigenes Profil verwalten
**Akteur:** Mitarbeitende/r
**Ablauf:**
1. Öffnet /profile
2. Sieht eigene Punkte, Level, XP-Fortschrittsbalken
3. Findet alle eigenen Prompts mit Bewertungen
4. Sieht erreichbare Badges und aktuellen Rang

### UC-06: An Wochen-Challenge teilnehmen
**Akteur:** Mitarbeitende/r
**Ablauf:**
1. Sieht die aktive Challenge auf dem Dashboard (/dashboard)
2. Reicht einen Prompt über /submit ein und verknüpft ihn mit der Challenge
3. Erhält +30 Zusatzpunkte bei Einreichung, +100 bei Gewinn

### UC-07: Nutzer registrieren
**Akteur:** Neue Mitarbeitende/r
**Ablauf:**
1. Öffnet die App erstmalig
2. Klickt auf den Nutzer-Picker oben rechts
3. Gibt Name und Abteilung ein
4. Wird als «Prompt-Lehrling» angelegt und direkt ausgewählt

---

## 4. Funktionale Anforderungen

| ID | Anforderung | Priorität |
|---|---|---|
| FA-01 | Mitarbeitende können Prompts erstellen, kategorisieren und veröffentlichen | Muss |
| FA-02 | Jeder Prompt kann eine deutsche und englische Version haben (EN optional) | Muss |
| FA-03 | Prompts sind nach Kategorie und per Freitext filterbar | Muss |
| FA-04 | Bewertungen von 1–5 Sternen sind pro Nutzer und Prompt möglich | Muss |
| FA-05 | Punkte werden automatisch für definierte Aktionen vergeben | Muss |
| FA-06 | Level werden anhand kumulierter Punkte automatisch aktualisiert | Muss |
| FA-07 | Eine globale Rangliste zeigt alle Nutzer nach Punkten sortiert | Muss |
| FA-08 | Jede Woche kann eine Challenge mit Bonus-Punkten aktiviert sein | Soll |
| FA-09 | Prompts können als «genutzt» markiert werden (Autor erhält Punkte) | Soll |
| FA-10 | Das Profil zeigt eigene Prompts, Punkte und Fortschritt | Soll |
| FA-11 | Abteilungsvergleich auf der Rangliste | Kann |
| FA-12 | Profilbild als farbiger Avatar (automatische Farbzuweisung) | Kann |

---

## 5. Nichtfunktionale Anforderungen

| ID | Anforderung | Messgrösse |
|---|---|---|
| NFA-01 | **Performance** – Seiten laden schnell | Erste Renderzeit < 2 s auf internem Netz |
| NFA-02 | **Usability** – Bedienbar ohne Schulung | Neue Nutzer finden Kernfunktionen innerhalb 2 Minuten |
| NFA-03 | **Responsiveness** – Mobile-tauglich | Volle Funktionalität auf Smartphones (min. 375 px) |
| NFA-04 | **Sicherheit** – Eingaben validiert | Alle API-Inputs durch Zod-Schemas validiert |
| NFA-05 | **Sicherheit** – Security Headers | CSP, X-Frame-Options, Referrer-Policy auf jeder Antwort |
| NFA-06 | **Verfügbarkeit** – Interne Verfügbarkeit | 99 % während Geschäftszeiten |
| NFA-07 | **Wartbarkeit** – Einfache Erweiterung | Neue Kategorie in einer Datei ergänzbar (lib/constants.ts) |
| NFA-08 | **Internationaliserung** – Zweisprachigkeit | UI Deutsch, Prompts optional auch Englisch |
| NFA-09 | **Rate Limiting** – Schutz vor Missbrauch | Max. 30 Schreib- / 120 Leseanfragen pro Minute und IP |
| NFA-10 | **Datenintegrität** – Eindeutige Constraints | Ein Vote pro Nutzer/Prompt via DB-Unique-Constraint |

${FOOTER}`;
}

function genNutzerdoku(): string {
  return `# Nutzerdokumentation

## Erste Schritte

### Registrierung
1. Öffne PromptArena im Browser (internen Link vom IT-Team anfragen)
2. Klicke oben rechts auf den **Nutzer-Picker** (blaues Feld mit Pfeiltaste)
3. Wähle «Neu registrieren»
4. Trage deinen Vor- und Nachnamen sowie deine Abteilung ein
5. Klicke «Registrieren» – du wirst automatisch eingeloggt

> **Hinweis:** Es gibt kein Passwort. Die App merkt sich deinen Nutzer im Browser.
> Wenn du ein neues Gerät oder einen anderen Browser nutzt, wähle deinen Namen
> einfach erneut aus der Liste aus.

### Nutzer wechseln
Klicke oben rechts auf deinen Namen → Dropdown öffnet sich → anderen Nutzer auswählen.

---

## Seiten im Überblick

### Dashboard (/dashboard)
Die Startseite zeigt:
- **Deine aktuellen Punkte und dein Level** mit XP-Fortschrittsbalken
- Die **aktive Wochen-Challenge** mit Beschreibung und Teilnehmerzahl
- Deine letzten Aktivitäten
- Den Punkte-Guide (welche Aktion bringt wie viele Punkte)

### Bibliothek (/library)
Hier findest du alle eingereichten Prompts:
- **Suche**: Freitext-Suche über Titel und Inhalt
- **Filter**: Wähle eine Kategorie (Writing, Email, Analysis, Excel)
- **Prompt öffnen**: Klicke auf eine Karte → Vollansicht mit Bewertung und Copy-Button
- **Sprache**: Falls eine englische Version vorhanden ist, schalte zwischen 🇩🇪 und 🇬🇧 um

**In der Vollansicht:**
| Aktion | Was passiert |
|---|---|
| 📋 Kopieren | Prompt in Zwischenablage kopieren |
| 🚀 Ich hab's genutzt | Nutzung bestätigen – Autor erhält +5 Punkte |
| ★★★★★ Bewerten | 1–5 Sterne vergeben – du erhältst +3 Punkte (einmalig) |

### Prompt einreichen (/submit)
So gibst du einen eigenen Prompt ein:

| Feld | Pflicht | Hinweis |
|---|---|---|
| Titel (DE) | ✓ | Kurzer, beschreibender Name |
| Prompt-Text (DE) | ✓ | Der eigentliche Prompt, min. 10 Zeichen |
| Kategorie | ✓ | Writing, Email, Analysis oder Excel |
| Schwierigkeit | ✓ | Einstieg oder Fortgeschritten |
| Titel (EN) | – | Optional, falls du eine englische Version hast |
| Prompt-Text (EN) | – | Optional |

Nach dem Einreichen erhältst du **+20 Punkte**. Falls eine aktive Challenge läuft und du
deinen Prompt damit verknüpfst, kommen **+30 Bonus-Punkte** dazu.

### Rangliste (/leaderboard)
- **Podium**: Top 3 mit speziellen Auszeichnungen (👑 🥇 🥈 🥉)
- **Tabelle**: Plätze 4–10 mit Level-Badges
- **Mein Rang**: Deine Position wird immer angezeigt, auch wenn du nicht in den Top 10 bist
- **Abteilungsvergleich**: Kumulierte Punkte aller Abteilungen als Balkendiagramm

### Profil (/profile)
- Zeigt alle deine eingereichten Prompts
- Punkte, Level und XP-Fortschrittsbalken
- Dein aktueller Rang in der Gesamtrangliste
- Errungene und noch ausstehende Badges

---

## Das Punkte-System

| Aktion | Punkte |
|---|---|
| Prompt einreichen | +20 |
| Dein Prompt wird genutzt | +5 |
| Bewertung abgeben (einmalig pro Prompt) | +3 |
| Challenge-Prompt einreichen | +30 |
| Challenge gewinnnen | +100 |

## Level

| Level | Punkte |
|---|---|
| 📚 Prompt-Lehrling | 0 – 99 |
| 🔨 Prompt-Handwerker | 100 – 299 |
| ⚒️ Prompt-Schmied | 300 – 599 |
| 🏅 KI-Botschafter | 600+ |

---

## Häufige Fragen

**Kann ich meinen Prompt nachträglich bearbeiten?**
Aktuell nicht. Reiche bei Bedarf eine verbesserte Version als neuen Prompt ein.

**Kann ich meinen Account löschen?**
Wende dich an den App-Administrator.

**Die App merkt sich meinen Nutzer nicht mehr – was tun?**
Klicke oben rechts auf den Nutzer-Picker und wähle deinen Namen erneut aus der Liste.

**Ich habe versehentlich einen falschen Nutzer gewählt – was tun?**
Klicke oben rechts auf deinen Namen und wähle den richtigen Nutzer aus.

${FOOTER}`;
}

function genArchitektur(
  pages: { route: string; component: string }[],
  components: string[],
  pkg: PackageInfo,
): string {
  const pageRows = pages.map((p) => `| \`${p.route}\` | ${p.component} |`).join('\n');
  const compList = components.map((c) => `- **${c}**`).join('\n');
  const depsTable = Object.entries(pkg.deps)
    .map(([k, v]) => `| \`${k}\` | ${v} |`)
    .join('\n');

  return `# Architektur

## 1. Systemübersicht

PromptArena ist eine **monolithische Next.js-Anwendung** (Full-Stack) mit einem
integrierten API-Layer. Frontend und Backend laufen als einziger Prozess.

\`\`\`
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
\`\`\`

---

## 2. Seiten (App Router)

| Route | Datei |
|---|---|
${pageRows}

---

## 3. Komponenten

${compList}

### Komponentenprinzipien
- **Server Components** wo immer möglich (keine interaktiven State-Updates)
- **Client Components** (\`'use client'\`) nur wenn Browser-APIs oder React-Hooks benötigt
- **Kein Prop-Drilling** dank \`useCurrentUser\`-Hook für die Nutzer-ID
- **Design-System** über Tailwind Utility Classes + globale Klassen in \`globals.css\`

---

## 4. Datenfluss

\`\`\`
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
\`\`\`

---

## 5. Authentifizierung (Mock-Auth)

Die App nutzt **localStorage-basierte Mock-Authentifizierung** – konzipiert für den
internen Einsatz ohne IT-Infrastruktur-Overhead.

\`\`\`
localStorage['promptarena_user_id'] = "42"   // gespeicherte Nutzer-ID
window.dispatchEvent(new CustomEvent('userChanged'))  // cross-component sync
\`\`\`

Der \`useCurrentUser\`-Hook abstrahiert dieses Pattern in allen Client-Komponenten.

> **Hinweis für Produktivbetrieb:** Für sensiblere Daten sollte eine
> NextAuth.js- oder SSO-Integration ergänzt werden.

---

## 6. Sicherheitsarchitektur

| Massnahme | Implementierung |
|---|---|
| Input-Validierung | Zod-Schemas in \`lib/validation.ts\` für alle API-Inputs |
| Rate Limiting | Sliding-Window-Limiter in \`lib/rate-limit.ts\` (30 W / 120 R pro Min/IP) |
| Security Headers | CSP, X-Frame-Options, Referrer-Policy in \`next.config.mjs\` |
| SQL-Injection | Prisma ORM (parametrisierte Queries, kein Raw-SQL) |
| Enum-Validierung | Kategorien und Schwierigkeit durch Zod-Enum eingeschränkt |
| Duplikat-Votes | DB-Unique-Constraint \`@@unique([promptId, userId])\` |
| Points-Farming | Points nur bei erstem Vote (Pre-Upsert-Check) |

---

## 7. Abhängigkeiten

| Paket | Version |
|---|---|
${depsTable}

${FOOTER}`;
}

function genApiReferenz(endpoints: ApiEndpoint[]): string {
  const sections = endpoints.map((ep) => {
    const paramSection = ep.params.length
      ? `\n**Query-Parameter:**\n${ep.params.map((p) => `- ${p}`).join('\n')}\n`
      : '';
    return `### \`${ep.method} ${ep.path}\`\n${ep.description ? `\n${ep.description}\n` : ''}${paramSection}`;
  });

  return `# API-Referenz

Alle Endpunkte sind unter \`/api\` erreichbar. Jeder Endpunkt:
- Validiert seinen Input mit **Zod** (400 bei ungültigen Daten)
- Prüft das **Rate Limit** (429 nach Überschreitung)
- Gibt im Fehlerfall \`{ "error": "..." }\` zurück

---

## Endpunkte

${sections.join('\n\n---\n\n')}

---

## Fehler-Codes

| HTTP-Status | Bedeutung |
|---|---|
| 400 | Ungültige Eingabe (Validierungsfehler, Details im \`error\`-Feld) |
| 404 | Ressource nicht gefunden |
| 429 | Zu viele Anfragen (Rate Limit überschritten) |
| 500 | Interner Serverfehler |

## Datums-Format
Alle Timestamps werden als **ISO 8601** Strings zurückgegeben, z.B. \`"2024-03-15T14:30:00.000Z"\`.

${FOOTER}`;
}

function genDatenmodell(models: PrismaModel[], points: PointsConfig): string {
  const modelSections = models.map((m) => {
    const fieldRows = m.fields
      .filter((f) => !f.name.startsWith('@'))
      .map((f) => {
        const optional = f.type.endsWith('?');
        const cleanType = f.type.replace('?', '');
        const mods = f.modifiers
          .filter((mod) => !mod.startsWith('/'))
          .join(' ');
        return `| \`${f.name}\` | \`${cleanType}\` | ${optional ? 'Optional' : 'Pflicht'} | ${mods} |`;
      });
    return `### ${m.name}\n\n| Feld | Typ | Pflicht | Hinweise |\n|---|---|---|---|\n${fieldRows.join('\n')}`;
  });

  const levelRows = points.levels.map((l) => `| ${l.name} | ${l.min} Pts | ${l.max} |`).join('\n');
  const actionRows = points.actions.map((a) => `| ${a.key} | +${a.value} |`).join('\n');

  return `# Datenmodell

## Entity-Relationship-Diagramm

\`\`\`
User 1──n Prompt
User 1──n Vote
User 1──n ChallengeSubmission

Prompt 1──n Vote
Prompt 1──n ChallengeSubmission

WeeklyChallenge 1──n ChallengeSubmission
\`\`\`

---

## Entitäten

${modelSections.join('\n\n---\n\n')}

---

## Gamification-Werte (aus lib/points.ts)

### Punkte pro Aktion

| Aktion | Punkte |
|---|---|
${actionRows}

### Level-Schwellenwerte

| Level | Ab | Bis |
|---|---|---|
${levelRows}

---

## Datenbanktyp
SQLite (Datei: \`prisma/dev.db\`). Die Datenbank wird über Prisma Migrate verwaltet.
Für Produktivbetrieb empfiehlt sich PostgreSQL (nur \`schema.prisma\` anpassen).

${FOOTER}`;
}

function genEntwickler(pkg: PackageInfo): string {
  const scriptRows = Object.entries(pkg.scripts)
    .map(([k, v]) => `| \`npm run ${k}\` | \`${v}\` |`)
    .join('\n');

  return `# Entwicklerdokumentation

## Projektstruktur

\`\`\`
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
\`\`\`

---

## Wichtige Konventionen

### Neue Kategorie hinzufügen
1. \`lib/constants.ts\` → Eintrag in \`CATEGORY_CONFIG\` ergänzen
2. \`lib/validation.ts\` → \`CATEGORIES\`-Array ergänzen
3. \`prisma/schema.prisma\` → keine Änderung nötig (String-Feld)
4. Fertig – alle Komponenten importieren aus \`constants.ts\`

### Neuen API-Endpunkt hinzufügen
1. Datei anlegen: \`app/api/<name>/route.ts\`
2. Zod-Schema in \`lib/validation.ts\` definieren
3. Rate-Limit aus \`lib/rate-limit.ts\` anwenden
4. Datei mit JSDoc-Kommentar dokumentieren (wird autom. in docs/ übernommen)

### Punkte ändern
1. Wert in \`lib/points.ts → POINTS\` anpassen
2. Beschriftung in \`lib/constants.ts → POINTS_GUIDE\` synchronisieren

### Mock-Auth erweitern
Die Nutzer-ID liegt in \`localStorage['promptarena_user_id']\`.
Änderungen werden via \`window.dispatchEvent(new CustomEvent('userChanged'))\` gebroadcastet.
Der \`useCurrentUser\`-Hook in \`hooks/useCurrentUser.ts\` abonniert dieses Event.

---

## Code-Qualitätsprinzipien

- **Single Source of Truth**: Magic Values in \`lib/constants.ts\`, nie inline
- **Zod-Validierung**: Alle API-Inputs werden mit \`safeParse\` geprüft – kein \`req.json()\` ohne Schema
- **Fehlerformat**: Alle Fehlerantworten haben die Form \`{ "error": "..." }\`
- **Punkte-Logik**: Immer über \`awardPoints()\` aus \`lib/db-helpers.ts\`
- **Kein Raw-SQL**: Ausschliesslich Prisma-Client-Methoden verwenden
- **TypeScript strict**: Keine \`any\`-Types – Domain-Typen aus \`lib/types.ts\`

---

## Verfügbare Scripts

| Befehl | Skript |
|---|---|
${scriptRows}

---

## Sicherheits-Checkliste (vor jedem Deployment)

- [ ] Zod-Schema für jeden neuen POST-Endpunkt vorhanden
- [ ] Rate-Limit-Check als erste Zeile jedes Handlers
- [ ] Keine Raw-SQL-Queries eingebaut
- [ ] Security Headers in \`next.config.mjs\` noch vollständig
- [ ] \`lib/validation.ts\` bei neuen Enum-Werten aktualisiert
- [ ] \`prisma.config.ts\` existiert nicht (Prisma 5 – Datei nicht benötigt)

${FOOTER}`;
}

function genOnboarding(): string {
  return `# Onboarding – Schnelleinstieg

## Voraussetzungen

| Tool | Version | Prüfen mit |
|---|---|---|
| Node.js | ≥ 18 | \`node --version\` |
| npm | ≥ 9 | \`npm --version\` |
| Git | beliebig | \`git --version\` |

---

## Lokale Entwicklungsumgebung einrichten

\`\`\`bash
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
\`\`\`

Die App läuft jetzt lokal. Wechsle in der App oben rechts den Nutzer, um die
Gamification-Funktionen auszuprobieren.

---

## Schnell-Orientierung

| Ich will... | Ich schaue in... |
|---|---|
| Eine neue Kategorie hinzufügen | \`lib/constants.ts\` + \`lib/validation.ts\` |
| Punkte anpassen | \`lib/points.ts\` + \`lib/constants.ts\` (POINTS_GUIDE) |
| Eine neue Seite anlegen | \`app/<name>/page.tsx\` erstellen |
| Einen neuen API-Endpunkt bauen | \`app/api/<name>/route.ts\` + Zod-Schema |
| Die Datenbank ändern | \`prisma/schema.prisma\` → \`npm run db:migrate\` |
| Komponenten anpassen | \`components/<Name>.tsx\` |
| Mock-Auth verstehen | \`hooks/useCurrentUser.ts\` |
| Die Doku regenerieren | \`npm run docs\` |
| Seed-Daten ändern | \`prisma/seed.ts\` → \`npm run db:reset\` |

---

## Wichtige Architekturentscheidungen

### Warum SQLite?
Für ein internes Tool ohne Cloud-Infrastruktur ist SQLite die einfachste Option –
kein Datenbankserver nötig, kein Verbindungs-Pooling. Für Skalierung einfach
\`schema.prisma\` auf PostgreSQL umstellen (Prisma macht den Rest).

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
(lokaler useState). Kein globaler State nötig. \`useCurrentUser\`-Hook reicht.

---

## Erste Aufgaben für neue Entwickelnde

1. **App lokal starten** (Schritte oben) und alle Seiten durchklicken
2. **Datenbankschema lesen** (\`prisma/schema.prisma\`) – 5 Modelle, klare Relationen
3. **Eine API-Route lesen** (\`app/api/prompts/route.ts\`) – zeigt das Muster: Rate-Limit → Validierung → DB
4. **\`lib/constants.ts\` lesen** – alle Magic Values, verstehe die Struktur
5. **Eine kleine Änderung testen**: Füge eine neue Abteilung in \`DEPARTMENTS\` ein und registriere einen Testnutzer

---

## Wo bekomme ich Hilfe?

- **Architekturübersicht**: [docs/03-architektur.md](./03-architektur.md)
- **API-Endpunkte**: [docs/04-api-referenz.md](./04-api-referenz.md)
- **Datenbank**: [docs/05-datenmodell.md](./05-datenmodell.md)
- **Code-Konventionen**: [docs/06-entwickler.md](./06-entwickler.md)
- **Projektverantwortliche**: Projektleitung / IT-Team ansprechen

${FOOTER}`;
}

// ─── Rekonstruktions-Prompt ───────────────────────────────────────────────────

function genRekonstruktionsPrompt(
  pkg: PackageInfo,
  models: PrismaModel[],
  endpoints: ApiEndpoint[],
  points: PointsConfig,
  pages: { route: string; component: string }[],
  components: string[],
): string {
  const schema = read(path.join(ROOT, 'prisma', 'schema.prisma'));
  const depsLines = Object.entries(pkg.deps)
    .map(([k, v]) => `  "${k}": "${v}"`)
    .join(',\n');

  // Collect all route source files for the prompt
  const routeSources: string[] = [];
  const apiDir = path.join(ROOT, 'app', 'api');
  function walkApi(dir: string, urlPath: string) {
    for (const entry of readDir(dir)) {
      const full = path.join(dir, entry);
      try {
        if (fs.statSync(full).isDirectory()) {
          walkApi(full, `${urlPath}/${entry}`);
        } else if (entry === 'route.ts') {
          routeSources.push(`// app/api${urlPath}/route.ts\n${read(full)}`);
        }
      } catch { /* ignore */ }
    }
  }
  walkApi(apiDir, '');

  // Key lib files
  const libFiles = ['constants.ts', 'points.ts', 'types.ts', 'db-helpers.ts', 'validation.ts', 'rate-limit.ts', 'prisma.ts'];
  const libSources = libFiles
    .map((f) => {
      const src = read(path.join(ROOT, 'lib', f));
      return src ? `// lib/${f}\n${src}` : '';
    })
    .filter(Boolean);

  const hookSrc = read(path.join(ROOT, 'hooks', 'useCurrentUser.ts'));
  const nextCfg = read(path.join(ROOT, 'next.config.mjs'));

  const pageList    = pages.map((p) => `- ${p.route} → ${p.component}`).join('\n');
  const compList    = components.map((c) => `- ${c}.tsx`).join('\n');
  const endpointList = endpoints.map((e) => `- ${e.method} ${e.path}`).join('\n');

  const actionRows = points.actions.map((a) => `  ${a.key}: ${a.value}`).join('\n');
  const levelRows  = points.levels.map((l) => `  ${l.name}: ab ${l.min} Pts`).join('\n');

  return `# Rekonstruktions-Prompt

> Kopiere den Prompt-Block unten vollständig in dein Vibe-Coding-Tool (Cursor, Copilot Chat,
> Claude, Gemini, etc.). Er enthält alle Informationen, um die PromptArena-Anwendung von
> Grund auf neu zu bauen.

---

\`\`\`
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
${depsLines}

════════════════════════════════════════════════════════════
DATENBANKSCHEMA (prisma/schema.prisma – exakt so übernehmen)
════════════════════════════════════════════════════════════
${schema}

════════════════════════════════════════════════════════════
GAMIFICATION-LOGIK
════════════════════════════════════════════════════════════
Punkte pro Aktion:
${actionRows}

Level-Schwellenwerte:
${levelRows}

Level wird bei jedem Punkte-Award neu berechnet und in User.level gespeichert.
Für einen neuen Vote: erst prüfen ob Vote existiert, Punkte nur beim ERSTEN Vote.

════════════════════════════════════════════════════════════
SEITEN (app/ mit App Router)
════════════════════════════════════════════════════════════
${pageList}

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
${compList}

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
${endpointList}

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
\`\`\`

${FOOTER}`;
}

// ─── Haupt-Entry ──────────────────────────────────────────────────────────────

export function generateAll(): void {
  // Ensure docs directory exists
  if (!fs.existsSync(DOCS)) fs.mkdirSync(DOCS, { recursive: true });

  console.log('📄 Generiere Dokumentation...');

  const pkg       = extractPackageInfo();
  const models    = extractPrismaModels();
  const endpoints = extractApiEndpoints();
  const points    = extractPointsConfig();
  const pages     = extractPages();
  const comps     = extractComponents();

  const files: [string, string][] = [
    ['README.md',                  genIndex(pkg)],
    ['00-rekonstruktions-prompt.md', genRekonstruktionsPrompt(pkg, models, endpoints, points, pages, comps)],
    ['01-konzept.md',              genKonzept()],
    ['02-nutzerdoku.md',           genNutzerdoku()],
    ['03-architektur.md',          genArchitektur(pages, comps, pkg)],
    ['04-api-referenz.md',         genApiReferenz(endpoints)],
    ['05-datenmodell.md',          genDatenmodell(models, points)],
    ['06-entwickler.md',           genEntwickler(pkg)],
    ['07-onboarding.md',           genOnboarding()],
  ];

  for (const [name, content] of files) {
    write(name, content);
    console.log(`  ✓ docs/${name}`);
  }

  console.log(`✅ Fertig – ${files.length} Dateien in docs/`);
}

// Run when called directly (not imported by watch script)
generateAll();
