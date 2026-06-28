# Nutzer-Feedback – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 11
- **Abgeleitet von**: `specs/business/11-feedback.md` v1.0
- **Letzte Änderung**: 2026-06-28

---

## Technische Akzeptanzkriterien

### Floating Feedback-Button & allgemeines Feedback

- [x] **AC-11-001**: `FeedbackButton` Client-Komponente ist im `app/(user)/layout.tsx` eingebunden; erscheint nur wenn `currentUser` gesetzt ist (aus `UserContext`); Position: `fixed bottom-4 right-4 z-50`
  - **Referenz**: BAC-11-001, BAC-11-006
  - **Testbar durch**: E2E

- [x] **AC-11-002**: `FeedbackModal` zeigt genau vier Kategorie-Buttons mit Icons: 🐛 Bug · 💡 Idee · ⭐ Lob · 🔧 Verbesserung; Kategorie wird als `BUG | IMPROVEMENT | IDEA | PRAISE` gespeichert
  - **Referenz**: BAC-11-002
  - **Testbar durch**: E2E

- [x] **AC-11-003**: `FeedbackSchema` (Zod) verlangt `category` (enum) und `text` (min 1, max 500); `POST /api/feedback` gibt 400 zurück wenn eines fehlt
  - **Referenz**: BAC-11-003
  - **Testbar durch**: Unit, E2E

- [x] **AC-11-004**: `POST /api/feedback` speichert Feedback und gibt `{ ok: true }` zurück; Modal schliessen und `<FeedbackToast>` zeigt „Danke für dein Feedback!" für 3 Sekunden
  - **Referenz**: BAC-11-004
  - **Testbar durch**: E2E

- [x] **AC-11-005**: `FeedbackModal` liest `window.location.pathname` beim Öffnen und sendet es als `contextPath`; der Server speichert diesen Wert unverändert
  - **Referenz**: BAC-11-005
  - **Testbar durch**: Unit (Schema), E2E

### Lektions-Feedback

- [x] **AC-11-006**: Auf `app/(user)/learn/[moduleSlug]/[lessonSlug]/page.tsx` erscheint am Seitenende `<LessonFeedback lessonId={...} userId={...} />`; zeigt 👍/👎 Buttons
  - **Referenz**: BAC-11-007
  - **Testbar durch**: E2E

- [x] **AC-11-007**: Klick auf 👍 oder 👎 ruft `POST /api/feedback/lesson` mit `{ userId, lessonId, helpful }` auf — kein Popup, kein Formular; direkt nach dem Klick erscheint ein kleines optionales Textfeld „Möchtest du uns mehr sagen?" mit Absenden-Button
  - **Referenz**: BAC-11-008, BAC-11-009
  - **Testbar durch**: E2E

- [x] **AC-11-008**: `GET /api/feedback/lesson?userId=&lessonId=` gibt `{ helpful: boolean | null, text: string | null }` zurück; `<LessonFeedback>` zeigt die eigene Bewertung vorbelegt (überschreibbar via `PUT /api/feedback/lesson/[id]`)
  - **Referenz**: BAC-11-010
  - **Testbar durch**: E2E

- [x] **AC-11-009**: `LessonFeedback`-Datensätze enthalten `lessonId`; im Admin werden Modul- und Lektionsname per Join aufgelöst und angezeigt
  - **Referenz**: BAC-11-011
  - **Testbar durch**: E2E (Admin-Ansicht)

### Themenvorschläge

- [x] **AC-11-010**: Auf `app/(user)/learn/page.tsx` gibt es den Button „Thema vorschlagen"; auf Lektionsseite am Ende ebenfalls; beide öffnen `<TopicSuggestionModal>`
  - **Referenz**: BAC-11-012
  - **Testbar durch**: E2E

- [x] **AC-11-011**: `TopicSuggestionModal` hat ein Pflicht-Textfeld „Welches Thema fehlt dir?" (max 200 Zeichen) und ein optionales Feld „Warum wäre das nützlich?" (max 500 Zeichen); `POST /api/feedback/suggestions` speichert den Vorschlag
  - **Referenz**: BAC-11-013
  - **Testbar durch**: E2E

- [x] **AC-11-012**: `GET /api/admin/feedback/suggestions` gibt alle Vorschläge zurück; erscheinen in eigenem Tab „Themenvorschläge" im Admin-Panel
  - **Referenz**: BAC-11-014
  - **Testbar durch**: E2E

### Admin-Panel

- [x] **AC-11-013**: `app/admin/(panel)/feedback/page.tsx` lädt `GET /api/admin/feedback` und zeigt Tabelle mit: Kategorie-Badge, Text (abgeschnitten auf 80 Zeichen), Nutzername, Datum, Kontext-Typ-Badge (Allgemein / Lektion / Prompt), Kontext-Detail (Pfad / Lektionsname / Prompt-Titel)
  - **Referenz**: BAC-11-015
  - **Testbar durch**: E2E

- [x] **AC-11-014**: Admin-Feedback-Seite hat Filter-Buttons für Kontext-Typ (Alle / Allgemein / Lektion / Prompt) und Sortierung nach Datum (neueste zuerst als Default)
  - **Referenz**: BAC-11-016
  - **Testbar durch**: E2E

- [x] **AC-11-015**: `PATCH /api/admin/feedback/[id]` mit `{ status: "DONE" }` markiert Eintrag als erledigt; UI zeigt erledigte Einträge ausgegraut mit Häkchen; `DELETE /api/admin/feedback/[id]` löscht
  - **Referenz**: BAC-11-017
  - **Testbar durch**: E2E

- [x] **AC-11-016**: `PATCH /api/admin/feedback/suggestions/[id]` akzeptiert `{ status: "OPEN" | "PLANNED" | "DONE" | "REJECTED" }`; Admin-UI zeigt Status-Dropdown pro Zeile
  - **Referenz**: BAC-11-018
  - **Testbar durch**: E2E

---

## API-Vertrag

### POST /api/feedback
**Auth**: User-Cookie (`resolveUserId`)

**Body:**
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `userId` | number | ja | Einreichender User |
| `category` | `BUG\|IMPROVEMENT\|IDEA\|PRAISE` | ja | Feedback-Kategorie |
| `text` | string (1–500) | ja | Feedback-Text |
| `contextType` | `GENERAL\|LESSON\|PROMPT` | nein | Default: `GENERAL` |
| `contextId` | number | nein | Lektion-ID oder Prompt-ID |
| `contextPath` | string (max 200) | nein | `window.location.pathname` |

**Response `200`:** `{ "ok": true }`
**Fehler:** 400 (Zod), 401 (kein User), 429 (Rate-Limit)

---

### POST /api/feedback/lesson
**Auth**: User-Cookie

**Body:**
| Feld | Typ | Pflicht |
|------|-----|---------|
| `userId` | number | ja |
| `lessonId` | number | ja |
| `helpful` | boolean | ja |
| `text` | string (max 500) | nein |

**Response `200`:** `{ "ok": true, "id": number }`

---

### GET /api/feedback/lesson
**Query**: `userId` (number), `lessonId` (number)
**Response `200`:** `{ "id": number, "helpful": boolean, "text": string | null }` oder `null`

---

### PUT /api/feedback/lesson/[id]
**Auth**: User-Cookie (resolveUserId — nur eigenes Feedback änderbar)
**Body:** `{ helpful?: boolean, text?: string }`
**Response `200`:** `{ "ok": true }`

---

### POST /api/feedback/suggestions
**Auth**: User-Cookie

**Body:**
| Feld | Typ | Pflicht |
|------|-----|---------|
| `userId` | number | ja |
| `title` | string (3–200) | ja |
| `description` | string (max 500) | nein |

**Response `200`:** `{ "ok": true }`

---

### GET /api/admin/feedback
**Auth**: Admin-Middleware
**Query**: `contextType` (optional Filter), `status` (optional: `OPEN|DONE`)
**Response `200`:** Array von Feedback-Objekten mit aufgelöstem Kontext (Nutzername, Lektionsname oder Prompt-Titel)

---

### PATCH /api/admin/feedback/[id]
**Auth**: Admin-Middleware
**Body:** `{ status: "DONE" }`
**Response `200`:** `{ "ok": true }`

---

### DELETE /api/admin/feedback/[id]
**Auth**: Admin-Middleware
**Response `204`:** kein Body

---

### GET /api/admin/feedback/suggestions
**Auth**: Admin-Middleware
**Response `200`:** Array aller Vorschläge mit Nutzername

---

### PATCH /api/admin/feedback/suggestions/[id]
**Auth**: Admin-Middleware
**Body:** `{ status: "OPEN" | "PLANNED" | "DONE" | "REJECTED" }`
**Response `200`:** `{ "ok": true }`

---

## Datenmodell

```prisma
model Feedback {
  id          Int      @id @default(autoincrement())
  userId      Int
  category    String   // BUG | IMPROVEMENT | IDEA | PRAISE
  text        String
  contextType String   @default("GENERAL") // GENERAL | LESSON | PROMPT
  contextId   Int?     // lessonId or promptId
  contextPath String?  // window.location.pathname
  status      String   @default("OPEN")   // OPEN | DONE
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([contextType])
  @@index([status])
  @@index([createdAt])
}

model LessonFeedback {
  id        Int      @id @default(autoincrement())
  userId    Int
  lessonId  Int
  helpful   Boolean
  text      String?
  createdAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([lessonId])
}

model TopicSuggestion {
  id          Int      @id @default(autoincrement())
  userId      Int
  title       String
  description String?
  status      String   @default("OPEN") // OPEN | PLANNED | DONE | REJECTED
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
}
```

**Migrationen nötig:** ja — neue Tabellen `Feedback`, `LessonFeedback`, `TopicSuggestion`; + Relationen in `User` und `Lesson`

---

## Komponenten-Struktur

```
app/(user)/
├── layout.tsx                         // + <FeedbackButton /> (AC-11-001)
├── learn/
│   ├── page.tsx                       // + „Thema vorschlagen" Button (AC-11-010)
│   └── [moduleSlug]/[lessonSlug]/
│       └── page.tsx                   // + <LessonFeedback /> (AC-11-006)

app/admin/(panel)/
├── layout.tsx                         // + „Feedback" Link in Sidebar
├── feedback/
│   └── page.tsx                       // Feedback-Liste + Filter (AC-11-013, AC-11-014, AC-11-015)
└── feedback/suggestions/
    └── page.tsx                       // Themenvorschläge (AC-11-012, AC-11-016)

app/api/
├── feedback/
│   ├── route.ts                       // POST (AC-11-003, AC-11-004)
│   ├── lesson/
│   │   ├── route.ts                   // POST + GET (AC-11-007, AC-11-008)
│   │   └── [id]/
│   │       └── route.ts              // PUT (AC-11-008)
│   └── suggestions/
│       └── route.ts                  // POST (AC-11-011)
└── admin/
    └── feedback/
        ├── route.ts                   // GET (AC-11-013)
        ├── [id]/
        │   └── route.ts              // PATCH + DELETE (AC-11-015)
        └── suggestions/
            ├── route.ts              // GET (AC-11-012)
            └── [id]/
                └── route.ts         // PATCH (AC-11-016)

components/
├── FeedbackButton.tsx                 // Floating 💬 Button (AC-11-001)
├── FeedbackModal.tsx                  // Popup mit Kategorie-Icons + Textfeld (AC-11-002)
├── FeedbackToast.tsx                  // Bestätigung nach Absenden (AC-11-004)
├── LessonFeedback.tsx                 // 👍/👎 + optionales Textfeld (AC-11-006, AC-11-007)
└── TopicSuggestionModal.tsx           // Thema-Vorschlag Popup (AC-11-011)
```

---

## Validierung (Zod) — Ergänzungen in `lib/validation.ts`

```typescript
export const FeedbackSchema = z.object({
  userId:      z.number().int().positive(),
  category:    z.enum(['BUG', 'IMPROVEMENT', 'IDEA', 'PRAISE']),
  text:        z.string().min(1).max(500),
  contextType: z.enum(['GENERAL', 'LESSON', 'PROMPT']).default('GENERAL'),
  contextId:   z.number().int().positive().optional(),
  contextPath: z.string().max(200).optional(),
});

export const LessonFeedbackSchema = z.object({
  userId:   z.number().int().positive(),
  lessonId: z.number().int().positive(),
  helpful:  z.boolean(),
  text:     z.string().max(500).optional(),
});

export const TopicSuggestionSchema = z.object({
  userId:      z.number().int().positive(),
  title:       z.string().min(3).max(200),
  description: z.string().max(500).optional(),
});

export const AdminFeedbackStatusSchema = z.object({
  status: z.enum(['OPEN', 'DONE']),
});

export const SuggestionStatusSchema = z.object({
  status: z.enum(['OPEN', 'PLANNED', 'DONE', 'REJECTED']),
});
```

---

## Sicherheit

- [ ] `POST /api/feedback*` und `POST /api/feedback/suggestions`: `writeLimiter` (30 req/min)
- [ ] Alle `/api/admin/feedback*`-Routen: Admin-Middleware-Schutz (bereits via `middleware.ts`)
- [ ] `PUT /api/feedback/lesson/[id]`: `resolveUserId` — User kann nur eigenes Lektions-Feedback ändern
- [ ] `contextPath` wird gespeichert aber nie als HTML gerendert (kein XSS-Risiko)
- [ ] Keine sensiblen Daten im Feedback-Objekt (kein Cookie-Wert, kein Secret)

---

## Tests

### Unit-Tests (`tests/unit/`)
- [ ] `feedback.test.ts`: `FeedbackSchema` — gültige/ungültige Inputs
- [ ] `feedback.test.ts`: `LessonFeedbackSchema` — helpful-Flag, optionaler Text
- [ ] `feedback.test.ts`: `TopicSuggestionSchema` — Mindestlänge title

### E2E-Tests (`tests/e2e/`)
- [ ] `feedback.spec.ts` — Happy Path: Floating-Button öffnet Modal → Kategorie wählen → Text eingeben → Absenden → Toast erscheint
- [ ] `feedback.spec.ts` — Validation: Absenden ohne Kategorie → Button disabled
- [ ] `feedback.spec.ts` — Lektion: 👍 klicken → optionales Textfeld erscheint → zweiter Besuch zeigt vorherige Bewertung
- [ ] `feedback.spec.ts` — Themenvorschlag: Button auf /learn → Modal → Absenden
- [ ] `feedback.spec.ts` — Admin: Feedback-Liste zeigt eingereichte Einträge → Filter nach Kontext-Typ → Als erledigt markieren → Löschen
- [ ] `feedback.spec.ts` — Admin: Themenvorschläge zeigen Einträge → Status ändern

---

## Abhängigkeiten

| Abhängigkeit | Typ | Warum |
|-------------|-----|-------|
| Feature 01 – Identität | benötigt | `userId` aus User-Cookie |
| Feature 07 – Admin | benötigt | Admin-Sidebar + Middleware-Schutz |
| Feature 08 – Lernpfad | benötigt | `LessonFeedback` verknüpft mit `Lesson` |
| `lib/user-auth.ts` (`resolveUserId`) | benötigt | Auth auf allen Feedback-Routen |

---

## Änderungshistorie

| Version | Datum | CR | Änderung |
|---------|-------|----|---------|
| 1.0 | 2026-06-28 | — | Erstversion |
