# Feature: Lernpfad (Learning Path)

## Metadaten
- **Status**: `implemented`
- **Feature-Nr**: 08
- **Letzte Änderung**: 2026-04-19

---

## User Story
Als Mitarbeiter will ich Schritt für Schritt lernen, wie ich KI-Prompts effektiv formuliere — mit Beispielen, Mustern und Alltagsbezug — damit ich KI-Tools im Arbeitsalltag gezielt einsetzen kann.

---

## Akzeptanzkriterien

- [x] **AC-08-001**: Alle Lernmodule mit Lektionen und Per-User-Fortschritt können abgerufen werden (GET /api/learn)
- [x] **AC-08-002**: Eine einzelne Lektion mit vollständigem Inhalt, Abschluss-Status und Vor/Zurück-Navigation kann abgerufen werden (GET /api/learn/[moduleSlug]/[lessonSlug])
- [x] **AC-08-003**: Eine Lektion kann als abgeschlossen markiert werden (POST /api/learn/.../complete) — idempotent, Punkte nur einmalig
- [x] **AC-08-004**: Die Lernübersicht (`/learn`) zeigt alle Module mit Fortschrittsringen und Gesamtfortschritt
- [x] **AC-08-005**: Die Moduldetailseite (`/learn/[moduleSlug]`) zeigt die Lektionsliste mit Erledigte/Offen-Status
- [x] **AC-08-006**: Die Lektionsseite (`/learn/[moduleSlug]/[lessonSlug]`) rendert alle ContentBlock-Typen korrekt
- [x] **AC-08-007**: Inhalt-Blöcke unterstützen: `text`, `tip`, `warning`, `example` (gut/schlecht), `pattern`
- [x] **AC-08-008**: Abschliessen einer Lektion vergibt +15 Punkte (einmalig, via triggerFloat-Animation)
- [x] **AC-08-009**: Vor/Zurück-Navigation funktioniert auch modulübergreifend
- [x] **AC-08-010**: Dashboard-Widget zeigt die nächste offene Lektion + Gesamtfortschritt
- [x] **AC-08-011**: Ohne eingeloggten User wird kein Fortschritt gespeichert (graceful degradation)
- [x] **AC-08-012**: Seed enthält 5 Module mit mind. 3 Lektionen pro Modul über KI-Prompting

---

## API-Vertrag

### GET /api/learn
**Query**: `?userId=<id>` (optional — ohne userId keine Fortschrittsdaten)
**Response 200**: `LearningModuleWithProgress[]`
```json
[{
  "id": 1,
  "slug": "ki-verstehen",
  "title": "KI verstehen",
  "description": "Was ist KI und wie denkt sie?",
  "icon": "🤖",
  "order": 1,
  "totalLessons": 3,
  "completedLessons": 2,
  "lessons": [{
    "id": 1,
    "slug": "was-ist-ki",
    "title": "Was ist KI?",
    "order": 1,
    "points": 15,
    "completed": true
  }]
}]
```

### GET /api/learn/[moduleSlug]/[lessonSlug]
**Query**: `?userId=<id>` (optional)
**Response 200**: `LessonDetail`
```json
{
  "id": 1,
  "slug": "was-ist-ki",
  "title": "Was ist KI?",
  "order": 1,
  "points": 15,
  "completed": false,
  "content": [
    { "type": "text", "content": "..." },
    { "type": "tip", "content": "..." },
    { "type": "example", "label": "Beispiel", "bad": "...", "good": "...", "explanation": "..." },
    { "type": "pattern", "name": "Rollen-Prompt", "template": "Du bist ...", "example": "...", "useCase": "..." }
  ],
  "module": { "slug": "ki-verstehen", "title": "KI verstehen", "icon": "🤖", "totalLessons": 3 },
  "prev": null,
  "next": { "slug": "wie-ki-denkt", "title": "Wie KI denkt", "moduleSlug": "ki-verstehen" }
}
```
**Response 404**: `{ "error": "Lektion nicht gefunden" }`

### POST /api/learn/[moduleSlug]/[lessonSlug]/complete
**Body**: `{ "userId": number }`
**Response 200**: `{ "ok": true, "alreadyCompleted": false, "pointsAwarded": 15 }`
**Response 200** (bereits abgeschlossen): `{ "ok": true, "alreadyCompleted": true, "pointsAwarded": 0 }`
**Response 400**: `{ "error": "Validation" }` (userId fehlt/invalid)
**Response 404**: `{ "error": "Lektion nicht gefunden" }`

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

Änderungen an `User`:
```prisma
model User {
  // ...vorhandene Felder...
  lessonProgress LessonProgress[]
}
```

---

## ContentBlock-Typen (TypeScript)

```typescript
export type ContentBlock =
  | { type: 'text';    content: string }
  | { type: 'tip';     content: string }
  | { type: 'warning'; content: string }
  | { type: 'example'; label: string; bad: string; good: string; explanation: string }
  | { type: 'pattern'; name: string; template: string; example: string; useCase: string };
```

Inhalt wird als JSON-String in `Lesson.content` gespeichert und serverseitig geparst.

---

## UI-Verhalten

### Seite: `/learn`
- **Komponente**: `LearnPage` (client)
- Lädt `/api/learn?userId=...` aus localStorage
- Zeigt: Gesamtfortschrittsbalken + Module-Grid
- Jedes Modul-Card: Icon, Titel, Beschreibung, ProgressRing, Start/Weiter/Fertig-Button
- States: `loading` (Skeleton) | `no-modules` | `modules-with-progress`

### Seite: `/learn/[moduleSlug]`
- **Komponente**: `ModulePage` (client)
- Zeigt Lektionsliste mit Häkchen (erledigt) oder Nummer (offen)
- Breadcrumb: Lernen › Modulname

### Seite: `/learn/[moduleSlug]/[lessonSlug]`
- **Komponente**: `LessonPage` (client)
- Breadcrumb: Lernen › Modul › Lektion
- Inhalt via `ContentBlockRenderer`
- "Lektion abschliessen" Button:
  - Sichtbar nur wenn User eingeloggt und Lektion noch nicht erledigt
  - Nach Klick: API-Call + `triggerFloat("+15 Pts", ...)` + UI-Update
  - Wenn bereits erledigt: grüne Bestätigung statt Button
  - Ohne User: Hinweis "Wähle einen Nutzer oben aus"
- Prev/Next-Navigation via `LessonNav`-Komponente

### Komponente: `ContentBlockRenderer`
- `text` → `<p>` in weißer Card
- `tip` → emerald Card mit 💡
- `warning` → amber Card mit ⚠️
- `example` → zweispaltig: rot (schlecht) + grün (gut) + Erklärung
- `pattern` → indigo Card mit Template, Beispiel, Anwendungsfall

### Komponente: `ProgressRing`
- SVG-Kreis mit Completion-Prozent
- Grün wenn 100%, blau sonst

### Komponente: `LessonNav`
- Zurück/Weiter Buttons
- Funktioniert modulübergreifend (prev.moduleSlug / next.moduleSlug)

### Widget: `NextLessonWidget` (Dashboard)
- Zeigt nächste offene Lektion + Modul-Name
- Violetter Gradient, Fortschrittsbalken
- Direkt-Link zur Lektion
- Zeigt "+15 Pts" als Anreiz

---

## Punkte-Impact
| Aktion | Punkte | Empfänger |
|--------|--------|-----------|
| Lektion abschliessen (einmalig) | +15 | Benutzer |

---

## Lerninhalt (Seed)

5 Module mit insgesamt 20 Lektionen:
1. **KI verstehen** (🤖) — Was ist KI, wie denkt sie, Stärken/Grenzen
2. **Grundregeln des Promptings** (📝) — Klarheit, Kontext, Rollen, Beispiele, Iterieren
3. **Prompt-Muster & Patterns** (🎯) — Chain-of-Thought, Few-Shot, ReAct, Format-Anweisungen
4. **Alltagsbeispiele** (💼) — E-Mails, Analyse, Zusammenfassungen, Code-Hilfe
5. **Fortgeschrittene Techniken** (🚀) — Prompting-Ketten, Meta-Prompts, Qualitätskontrolle

---

## Tests

### E2E (Playwright)
- Lernübersicht lädt und zeigt Module
- Modulseite zeigt Lektionsliste
- Lektionsseite rendert Inhalt korrekt
- Lektion abschliessen → Button wechselt zu Bestätigung

### Unit (Vitest)
- `CompleteLessonSchema`: valide und invalide userId
- ContentBlock-Typen sind vollständig typisiert
