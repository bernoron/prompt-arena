# Erweiterte Lernmodule (5 neue Module) – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 09
- **Abgeleitet von**: `specs/business/09-extended-learning.md` v1.0
- **Letzte Änderung**: 2026-04-22

---

## Technische Akzeptanzkriterien

- [ ] **AC-09-001**: `prisma/seed.ts` wird um 5 neue Modul-Objekte (vision, coding, files, security, model-choice) mit `order` 6–10 erweitert; nach erneutem Seed-Lauf erscheinen alle 5 Module in `GET /api/learn`.
  - **Referenz**: BAC-09-006
  - **Testbar durch**: Manual (DB-Check nach `npx prisma db seed`)

- [ ] **AC-09-002**: Modul `vision` (slug: `vision`, order: 6, icon: `📸`) enthält 4 Lektionen mit vollständigen `ContentBlock[]`-Arrays.
  - **Referenz**: BAC-09-001
  - **Testbar durch**: E2E

- [ ] **AC-09-003**: Modul `coding` (slug: `coding`, order: 7, icon: `🖥️`) enthält 5 Lektionen mit vollständigen `ContentBlock[]`-Arrays.
  - **Referenz**: BAC-09-002
  - **Testbar durch**: E2E

- [ ] **AC-09-004**: Modul `files` (slug: `files`, order: 8, icon: `📁`) enthält 4 Lektionen mit vollständigen `ContentBlock[]`-Arrays.
  - **Referenz**: BAC-09-003
  - **Testbar durch**: E2E

- [ ] **AC-09-005**: Modul `security` (slug: `security`, order: 9, icon: `🔐`) enthält 5 Lektionen mit vollständigen `ContentBlock[]`-Arrays.
  - **Referenz**: BAC-09-004
  - **Testbar durch**: E2E

- [ ] **AC-09-006**: Modul `model-choice` (slug: `model-choice`, order: 10, icon: `⚖️`) enthält 4 Lektionen mit vollständigen `ContentBlock[]`-Arrays.
  - **Referenz**: BAC-09-005
  - **Testbar durch**: E2E

- [ ] **AC-09-007**: Kein Code-Change an API-Routen, Seiten oder Komponenten nötig — alle neuen Module erscheinen automatisch durch den Seed-Eintrag in der DB.
  - **Referenz**: BAC-09-006
  - **Testbar durch**: Manual

- [ ] **AC-09-008**: Jede Lektion aller 5 neuen Module enthält mind. 3 `pattern`-Blöcke und mind. 2 `example`-Blöcke (good/bad) im `content`-JSON.
  - **Referenz**: BAC-09-001 bis BAC-09-005
  - **Testbar durch**: Unit (Seed-Validierung)

---

## API-Vertrag

Keine neuen API-Routen — alle neuen Module werden über die bestehenden Endpunkte aus Feature 08 ausgeliefert:

- `GET /api/learn` — liefert alle 10 Module (5 bestehende + 5 neue)
- `GET /api/learn/[moduleSlug]/[lessonSlug]` — funktioniert für alle Slugs
- `POST /api/learn/[moduleSlug]/[lessonSlug]/complete` — funktioniert für alle Lektionen

---

## Datenmodell

Keine neuen Prisma-Modelle — nur Erweiterung des Seeds.

### Seed-Struktur (`prisma/seed.ts`)

```typescript
// prisma/seed.ts — Erweiterung um Module 6–10
const newModules = [
  {
    slug: 'vision',
    title: 'Bilder & Videos in Prompts',
    description: 'Wie du Bilder und PDFs in deine Prompts integrierst — von OCR bis Bildverständnis.',
    icon: '📸',
    order: 6,
    lessons: [
      {
        slug: 'was-ist-vision',
        title: 'Was ist Vision & wann nutze ich es?',
        order: 1,
        points: 15,
        content: JSON.stringify([
          { type: 'text', content: '...' },
          { type: 'example', label: '...', bad: '...', good: '...', explanation: '...' },
          { type: 'pattern', name: '...', template: '...', example: '...', useCase: '...' },
          // mind. 3 patterns, 2 examples
        ] satisfies ContentBlock[]),
      },
      // 3 weitere Lektionen
    ],
  },
  {
    slug: 'coding',
    title: 'Code-Prompting & Debugging',
    description: 'KI zum Schreiben, Debuggen und Refaktorieren von Code — mit Best Practices.',
    icon: '🖥️',
    order: 7,
    lessons: [ /* 5 Lektionen */ ],
  },
  {
    slug: 'files',
    title: 'Dateien verarbeiten mit KI',
    description: 'Wie du CSV, JSON, PDFs, Excel und andere Dateien sinnvoll an KI-Modelle übergibst.',
    icon: '📁',
    order: 8,
    lessons: [ /* 4 Lektionen */ ],
  },
  {
    slug: 'security',
    title: 'Prompt-Sicherheit & ethische Grenzen',
    description: 'Wie du Prompt-Injection, Jailbreaks und ethische Grenzen erkennst — und damit umgehst.',
    icon: '🔐',
    order: 9,
    lessons: [ /* 5 Lektionen */ ],
  },
  {
    slug: 'model-choice',
    title: 'Das richtige Modell wählen',
    description: 'Wann nutze ich Claude, GPT, Gemini, Llama? Stärken, Schwächen, Kosten, Speed.',
    icon: '⚖️',
    order: 10,
    lessons: [ /* 4 Lektionen */ ],
  },
];
```

### Slug-Eindeutigkeit

Alle 10 Modul-Slugs müssen eindeutig sein:

| Order | Slug | Modul |
|-------|------|-------|
| 1 | ki-verstehen | KI verstehen |
| 2 | grundregeln | Grundregeln des Promptings |
| 3 | prompt-muster | Prompt-Muster & Patterns |
| 4 | alltagsbeispiele | Alltagsbeispiele |
| 5 | fortgeschrittene | Fortgeschrittene Techniken |
| 6 | vision | Bilder & Videos |
| 7 | coding | Code & Debugging |
| 8 | files | Dateien verarbeiten |
| 9 | security | Prompt-Sicherheit |
| 10 | model-choice | Das richtige Modell wählen |

**Migrationen nötig:** nein (nur `prisma db seed` erneut ausführen)

---

## Komponenten-Struktur

Keine neuen Komponenten oder Seiten — alle Inhalte werden über die bestehende Infrastruktur aus Feature 08 gerendert:

```
prisma/
└── seed.ts                         // Erweitert um Module 6–10 (AC-09-001 bis AC-09-006)
```

---

## Validierung (Zod / TypeScript)

```typescript
// prisma/seed.ts — Type-Safety via satisfies
import type { ContentBlock } from '../lib/types';

// Jede Lesson.content wird als `satisfies ContentBlock[]` gecastet
// — verhindert Tippfehler im Seed zur Compile-Zeit

const validateSeed = (modules: typeof newModules) => {
  for (const mod of modules) {
    const slugs = mod.lessons.map(l => l.slug);
    const unique = new Set(slugs);
    if (slugs.length !== unique.size) {
      throw new Error(`Duplicate lesson slugs in module ${mod.slug}`);
    }
  }
};
```

---

## Performance-Anforderungen

| Metrik | Zielwert |
|--------|----------|
| Seed-Laufzeit für alle 10 Module | < 10 Sekunden |
| GET /api/learn mit 10 Modulen (p95) | < 400ms |

---

## Sicherheit

- [x] Seed-Daten sind statische Strings — kein Sicherheitsrisiko
- [x] `satisfies ContentBlock[]` verhindert Typ-Fehler im Seed
- [x] Keine neuen API-Routen — Sicherheitsmassnahmen aus Feature 08 gelten weiterhin

---

## Tests

### Unit-Tests (`tests/unit/`)
- [ ] `seed.test.ts`: Alle 10 Modul-Slugs sind eindeutig
- [ ] `seed.test.ts`: Alle Lektionen in neuen Modulen haben mind. 3 `pattern`-Blöcke und mind. 2 `example`-Blöcke
- [ ] `seed.test.ts`: Kein Lektion-Slug kommt innerhalb eines Moduls doppelt vor

### E2E-Tests (`tests/e2e/`)
- [ ] `extended-learning.spec.ts` — Neue Module erscheinen in `/learn` nach Seed-Update
- [ ] `extended-learning.spec.ts` — Jede neue Lektion kann geöffnet werden (erster Lektion pro neuem Modul)
- [ ] `extended-learning.spec.ts` — Lektion abschliessen → +15 Punkte vergeben

---

## Abhängigkeiten

| Abhängigkeit | Typ | Warum |
|-------------|-----|-------|
| Feature 08 – Lernpfad | benötigt | Gesamte API-Infrastruktur, UI-Komponenten, Fortschritts-Tracking |
| Feature 01 – Identity | benötigt | Fortschritt je User |
| Feature 04 – Gamification | benötigt | Punkte für Lektionsabschluss |
| `lib/types.ts` ContentBlock | benötigt | Typ-sichere Seed-Erstellung |

---

## Änderungshistorie

| Version | Datum | CR | Änderung |
|---------|-------|----|---------|
| 1.0 | 2026-04-22 | — | Erstversion |
