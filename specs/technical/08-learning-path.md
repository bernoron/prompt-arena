# Lernpfad (5 Module, 20 Lektionen) – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 08
- **Abgeleitet von**: `specs/business/08-learning-path.md` v1.0
- **Letzte Änderung**: 2026-04-22

---

## Technische Akzeptanzkriterien

- [ ] **AC-08-001**: `GET /api/learn?userId=<id>` gibt `LearningModuleWithProgress[]` zurück — inkl. `completedLessons`, `totalLessons` und `lessons[].completed` per User.
  - **Referenz**: BAC-08-001
  - **Testbar durch**: E2E

- [ ] **AC-08-002**: `GET /api/learn/[moduleSlug]/[lessonSlug]?userId=<id>` gibt `LessonDetail` mit vollständigem `content: ContentBlock[]` (geparst aus JSON), `completed`, `prev`, `next` zurück.
  - **Referenz**: BAC-08-002, BAC-08-004
  - **Testbar durch**: E2E

- [ ] **AC-08-003**: `POST /api/learn/[moduleSlug]/[lessonSlug]/complete` mit `{ userId }` ist idempotent — bei bereits abgeschlossener Lektion gibt `{ alreadyCompleted: true, pointsAwarded: 0 }` zurück; bei erster Abschliessung `awardPoints(userId, POINTS.COMPLETE_LESSON)` und `{ alreadyCompleted: false, pointsAwarded: 15 }`.
  - **Referenz**: BAC-08-003
  - **Testbar durch**: E2E

- [ ] **AC-08-004**: Seite `/learn` rendert alle Module mit `ProgressRing`-Komponente; Seite `/learn/[moduleSlug]` zeigt Lektionsliste mit Abschluss-Status.
  - **Referenz**: BAC-08-001
  - **Testbar durch**: E2E

- [ ] **AC-08-005**: Seite `/learn/[moduleSlug]/[lessonSlug]` rendert alle `ContentBlock`-Typen via `ContentBlockRenderer`; Button „Lektion abschliessen" nur sichtbar wenn User aktiv und Lektion noch offen.
  - **Referenz**: BAC-08-002, BAC-08-003
  - **Testbar durch**: E2E, Manual

- [ ] **AC-08-006**: `LessonNav`-Komponente navigiert korrekt zu `prev.moduleSlug/prev.slug` und `next.moduleSlug/next.slug` — auch modulübergreifend.
  - **Referenz**: BAC-08-004
  - **Testbar durch**: E2E

- [ ] **AC-08-007**: `ContentBlockRenderer` rendert alle 5 Typen: `text`, `tip`, `warning`, `example` (Bad/Good), `pattern` — visuell differenziert.
  - **Referenz**: BAC-08-002
  - **Testbar durch**: E2E, Manual

- [ ] **AC-08-008**: Nach Lektionsabschluss: `triggerFloat('+15 Pts', ...)` ausgelöst; Button wechselt zu grüner Bestätigungsanzeige; `completed`-State wird ohne Seitenneuladen aktualisiert.
  - **Referenz**: BAC-08-003
  - **Testbar durch**: E2E

- [ ] **AC-08-009**: Vor/Zurück-Navigation funktioniert modulübergreifend — letztes Lesson eines Moduls verlinkt auf erstes Lesson des nächsten Moduls.
  - **Referenz**: BAC-08-004
  - **Testbar durch**: E2E

- [ ] **AC-08-010**: `NextLessonWidget` auf Dashboard zeigt nächste offene Lektion (erste mit `completed: false`) + Gesamtfortschritt; direkter Link zur Lektion.
  - **Referenz**: BAC-08-005
  - **Testbar durch**: E2E

- [ ] **AC-08-011**: Ohne `userId` (kein User gewählt): API gibt Inhalt ohne Fortschrittsdaten zurück; UI zeigt Hinweis statt Abschluss-Button.
  - **Referenz**: BAC-08-001, BAC-08-003
  - **Testbar durch**: E2E, Manual

- [ ] **AC-08-012**: Seed enthält 5 Module (ki-verstehen, grundregeln, prompt-muster, alltagsbeispiele, fortgeschrittene) mit je mind. 3 Lektionen; mindestens 20 Lektionen gesamt.
  - **Referenz**: BAC-08-006
  - **Testbar durch**: Manual (DB-Check)

---

## API-Vertrag

### GET /api/learn
**Query-Parameter:**
| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|-------------|
| `userId` | number | nein | Fortschrittsdaten für diesen User |

**Response `200`:**
```json
[
  {
    "id": 1,
    "slug": "ki-verstehen",
    "title": "KI verstehen",
    "description": "Was ist KI und wie denkt sie?",
    "icon": "🤖",
    "order": 1,
    "totalLessons": 3,
    "completedLessons": 2,
    "lessons": [
      {
        "id": 1,
        "slug": "was-ist-ki",
        "title": "Was ist KI?",
        "order": 1,
        "points": 15,
        "completed": true
      }
    ]
  }
]
```

**Fehler:**
| Code | Grund |
|------|-------|
| 500 | Datenbankfehler |

---

### GET /api/learn/[moduleSlug]/[lessonSlug]
**Query-Parameter:**
| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|-------------|
| `userId` | number | nein | Fortschrittsstatus für diesen User |

**Response `200`:**
```json
{
  "id": 1,
  "slug": "was-ist-ki",
  "title": "Was ist KI?",
  "order": 1,
  "points": 15,
  "completed": false,
  "content": [
    { "type": "text", "content": "KI steht für Künstliche Intelligenz..." },
    { "type": "tip", "content": "Denke an KI als sehr belesenen Assistenten..." },
    { "type": "example", "label": "Beispiel", "bad": "Erkläre KI.", "good": "Erkläre KI in 3 Sätzen für jemanden ohne technisches Vorwissen.", "explanation": "..." },
    { "type": "pattern", "name": "Zielgruppen-Prompt", "template": "Erkläre [Thema] für [Zielgruppe] in [Format].", "example": "...", "useCase": "..." }
  ],
  "module": { "slug": "ki-verstehen", "title": "KI verstehen", "icon": "🤖", "totalLessons": 3 },
  "prev": null,
  "next": { "slug": "wie-ki-denkt", "title": "Wie KI denkt", "moduleSlug": "ki-verstehen" }
}
```

**Fehler:**
| Code | Grund |
|------|-------|
| 404 | Modul oder Lektion nicht gefunden |

---

### POST /api/learn/[moduleSlug]/[lessonSlug]/complete
**Body:**
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `userId` | number | ja | Positive Ganzzahl |

**Response `200` (erste Abschliessung):**
```json
{ "ok": true, "alreadyCompleted": false, "pointsAwarded": 15 }
```

**Response `200` (bereits abgeschlossen):**
```json
{ "ok": true, "alreadyCompleted": true, "pointsAwarded": 0 }
```

**Fehler:**
| Code | Grund |
|------|-------|
| 400 | `userId` fehlt oder ungültig (Zod) |
| 404 | Modul oder Lektion nicht gefunden |

---

## Datenmodell

```prisma
model LearningModule {
  id          Int      @id @default(autoincrement())
  slug        String   @unique
  title       String
  description String
  icon        String
  order       Int
  lessons     Lesson[]
}

model Lesson {
  id       Int    @id @default(autoincrement())
  slug     String
  moduleId Int
  title    String
  content  String   // JSON: ContentBlock[]
  order    Int
  points   Int      @default(15)

  module   LearningModule  @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  progress LessonProgress[]

  @@unique([moduleId, slug])
  @@index([moduleId])
}

model LessonProgress {
  id          Int      @id @default(autoincrement())
  userId      Int
  lessonId    Int
  completedAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([userId])
}
```

**Ergänzungen auf `User`:**
```prisma
model User {
  lessonProgress LessonProgress[]
}
```

**Migrationen nötig:** ja (neue Modelle)

---

## ContentBlock-Typen (TypeScript)

```typescript
// lib/types.ts
export type ContentBlock =
  | { type: 'text';    content: string }
  | { type: 'tip';     content: string }
  | { type: 'warning'; content: string }
  | { type: 'example'; label: string; bad: string; good: string; explanation: string }
  | { type: 'pattern'; name: string; template: string; example: string; useCase: string };
```

Inhalt wird als `JSON.stringify(ContentBlock[])` in `Lesson.content` (String) gespeichert und serverseitig via `JSON.parse()` + Typ-Guard geparst.

---

## Komponenten-Struktur

```
app/(user)/learn/
├── page.tsx                              // Client Component — Lernübersicht (AC-08-004, AC-08-011)
├── [moduleSlug]/
│   ├── page.tsx                          // Client Component — Moduldetail-Seite (AC-08-004)
│   └── [lessonSlug]/
│       └── page.tsx                      // Client Component — Lektionsseite (AC-08-005, AC-08-008)

app/(user)/learn/components/
├── ContentBlockRenderer.tsx             // Rendert alle 5 ContentBlock-Typen (AC-08-007)
├── ProgressRing.tsx                     // SVG-Fortschrittsring (AC-08-004)
├── LessonNav.tsx                        // Vor/Zurück Navigation (AC-08-006, AC-08-009)
└── ModuleCard.tsx                       // Modul-Karte mit ProgressRing (AC-08-004)

app/(user)/dashboard/components/
└── NextLessonWidget.tsx                 // Nächste offene Lektion + Fortschritt (AC-08-010)

app/api/learn/
├── route.ts                             // GET (AC-08-001, AC-08-011)
└── [moduleSlug]/
    └── [lessonSlug]/
        ├── route.ts                     // GET (AC-08-002, AC-08-011)
        └── complete/
            └── route.ts                 // POST (AC-08-003, AC-08-008)

prisma/
└── seed.ts                              // 5 Module, 20 Lektionen als ContentBlock-JSON (AC-08-012)

lib/
├── points.ts                            // POINTS.COMPLETE_LESSON = 15
├── types.ts                             // ContentBlock, LearningModuleWithProgress, LessonDetail
└── validation.ts                        // CompleteLessonSchema
```

---

## Validierung (Zod)

```typescript
// lib/validation.ts
const CompleteLessonSchema = z.object({
  userId: z.number().int().positive(),
});
```

---

## Performance-Anforderungen

| Metrik | Zielwert |
|--------|----------|
| GET /api/learn Response Time (p95) | < 300ms |
| GET /api/learn/[module]/[lesson] Response Time (p95) | < 200ms |
| POST /api/learn/.../complete Response Time (p95) | < 200ms |
| JSON.parse für ContentBlock | Synchron, kein messbarer Overhead |

---

## Sicherheit

- [x] Input-Validierung via Zod auf `POST .../complete` (`userId` pflicht)
- [x] Rate-Limiting auf POST-Route
- [x] `PathId.safeParse()` / Slug-Validierung auf Pfad-Parameter
- [x] Content-Sicherheit: `ContentBlock`-Inhalt wird als String in DB gespeichert — kein direktes HTML-Rendering, React escapet automatisch

---

## Tests

### Unit-Tests (`tests/unit/`)
- [ ] `validation.test.ts`: `CompleteLessonSchema` — valide und invalide `userId`
- [ ] `types.test.ts`: `ContentBlock`-Union — alle Typen typsicher abgedeckt (TypeScript-Compile-Check)

### E2E-Tests (`tests/e2e/`)
- [ ] `learning-path.spec.ts` — Lernübersicht lädt und zeigt alle 5 Module
- [ ] `learning-path.spec.ts` — Modulseite zeigt Lektionsliste korrekt
- [ ] `learning-path.spec.ts` — Lektionsseite rendert Inhalt (alle ContentBlock-Typen sichtbar)
- [ ] `learning-path.spec.ts` — Lektion abschliessen → Button wechselt zu Bestätigung → FloatingPoints erscheint
- [ ] `learning-path.spec.ts` — Erneutes Abschliessen → keine doppelten Punkte

---

## Abhängigkeiten

| Abhängigkeit | Typ | Warum |
|-------------|-----|-------|
| Feature 01 – Identity | benötigt | `userId` für Fortschritts-Tracking |
| Feature 04 – Gamification | benötigt | `awardPoints()` für Lektion-Abschluss |
| Prisma Client | benötigt | Datenbankzugriff |

---

## Änderungshistorie

| Version | Datum | CR | Änderung |
|---------|-------|----|---------|
| 1.0 | 2026-04-22 | — | Erstversion |
