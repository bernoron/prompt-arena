# Feature: Erweiterte Lernmodule (Extended Learning Paths)

## Metadaten
- **Status**: `implemented`
- **Feature-Nr**: 09
- **Letzte Änderung**: 2026-04-19

---

## User Story
Als Mitarbeiter will ich in 5 neuen Lernmodulen fortgeschrittene KI-Techniken lernen — Bildverarbeitung, Code-Prompting, Dateihandling, Sicherheit und Modellwahl — damit ich die volle Kraft von KI in meinem Alltag ausschöpfen kann.

---

## Akzeptanzkriterien

- [x] **AC-09-001**: Seed erweitert um 5 neue Module (Vision, Coding, Files, Security, Model-Choice)
- [x] **AC-09-002**: Modul „Vision" mit 4 Lektionen über Bilder/Videos in Prompts
- [x] **AC-09-003**: Modul „Coding" mit 5 Lektionen über Code-Prompting & Debugging
- [x] **AC-09-004**: Modul „Files" mit 4 Lektionen über Dateiverarbeitung (PDFs, CSVs, etc.)
- [x] **AC-09-005**: Modul „Security" mit 5 Lektionen über Prompt-Injection, Jailbreaks, ethische Grenzen
- [x] **AC-09-006**: Modul „Model-Choice" mit 4 Lektionen über Modellvergleiche & wann welches nutzen
- [x] **AC-09-007**: Alle neuen Module sind via API abrufbar (GET /api/learn) – keine Code-Changes nötig
- [x] **AC-09-008**: Jedes Modul hat mind. 3 Patterns + 2 reale Alltagsbeispiele pro Lektion

---

## Inhalt pro Modul

### Modul 1: Vision (Bilder & Videos)
```json
{
  "slug": "vision",
  "title": "Bilder & Videos in Prompts",
  "icon": "📸",
  "order": 6,
  "description": "Wie du Bilder und PDFs in deine Prompts integrierst — von OCR bis Bildverständnis."
}
```

**Lektionen:**
1. Was ist Vision & wann nutze ich es?
2. Bilder beschreiben (Image Description)
3. PDFs & Dokumente analysieren
4. Multi-Image Prompting & Vergleiche

---

### Modul 2: Code & Debugging
```json
{
  "slug": "coding",
  "title": "Code-Prompting & Debugging",
  "icon": "🖥️",
  "order": 7,
  "description": "KI zum Schreiben, Debuggen und Refaktorieren von Code — mit Best Practices."
}
```

**Lektionen:**
1. Code schreiben lassen (Style, Tests, Performance)
2. Bugs debuggen mit KI-Hilfe
3. Code-Reviews & Refactoring
4. Architektur & Design Patterns abfragen
5. SQL & komplexe Queries

---

### Modul 3: Dateihandling
```json
{
  "slug": "files",
  "title": "Dateien verarbeiten mit KI",
  "icon": "📁",
  "order": 8,
  "description": "Wie du CSV, JSON, PDFs, Excel und andere Dateien sinnvoll an KI-Modelle übergibst."
}
```

**Lektionen:**
1. CSV & Datenanalyse
2. JSON & strukturierte Daten
3. PDF-Extraktion & Analyse
4. Excel & große Tabellenblätter

---

### Modul 4: Sicherheit & Grenzen
```json
{
  "slug": "security",
  "title": "Prompt-Sicherheit & ethische Grenzen",
  "icon": "🔐",
  "order": 9,
  "description": "Wie du Prompt-Injection, Jailbreaks und ethische Grenzen erkennst — und damit umgehen."
}
```

**Lektionen:**
1. Was ist Prompt Injection?
2. Jailbreak-Versuche erkennen & abwehren
3. Sensible Daten nicht weitergeben
4. Ethische Grenzen verstehen
5. Audit-Logs lesen (Was ging falsch?)

---

### Modul 5: Modelle vergleichen
```json
{
  "slug": "model-choice",
  "title": "Das richtige Modell wählen",
  "icon": "⚖️",
  "order": 10,
  "description": "Wann nutze ich Claude, GPT, Gemini, Llama? Stärken, Schwächen, Kosten, Speed."
}
```

**Lektionen:**
1. Claude: Stärken & best practices
2. GPT-4 & Unterschiede zu Claude
3. Google Gemini & andere Modelle
4. Open-Source Modelle lokal

---

## API-Vertrag

Keine neuen API-Routes — alles läuft über GET /api/learn die bestehende wird.
Neue Module erscheinen automatisch in der Antwort nach Seed-Update.

---

## Datenmodell

Keine neuen Prisma-Modelle — nur Seed-Erweiterung.

```typescript
// prisma/seed.ts erweitert um:
const modules = [
  // ... vorhandene 5 Module ...
  
  // Modul 6-10: Vision, Coding, Files, Security, Model-Choice
  { slug: 'vision', lessons: [...] },
  { slug: 'coding', lessons: [...] },
  { slug: 'files', lessons: [...] },
  { slug: 'security', lessons: [...] },
  { slug: 'model-choice', lessons: [...] },
];
```

---

## ContentBlocks pro Lektion

Jede Lektion verwendet:
- `text`: Erklärtext (1–3 Absätze)
- `tip`: Pro-Tipp oder Warnung
- `example`: Bad/Good Pair (was funktioniert, was nicht)
- `pattern`: Ein wiederverwendbares Muster (Template)

**Beispiel: Lektion „CSV & Datenanalyse"**
```json
[
  { "type": "text", "content": "CSVs sind..." },
  { "type": "example", "bad": "Analysiere diese Datei.", "good": "Ich habe eine CSV mit...", "explanation": "..." },
  { "type": "pattern", "name": "CSV Prompt", "template": "Ich gebe dir ein CSV...", "example": "...", "useCase": "..." },
  { "type": "tip", "content": "CSV-Dateien sind..." }
]
```

---

## Tests

### E2E
- Neue Module erscheinen in `/learn` nach Seed-Update
- Jede neue Lektion kann geöffnet und abgeschlossen werden
- Punkte werden vergeben (+15 pro Lektion)

### Unit
- Seed-JSON ist valides ContentBlock-Format
- Keine doppelten Slugs zwischen allen Modulen (1–10)

---

## Punkte-Impact

Keine Änderung — weiterhin +15 Punkte pro abgeschlossene Lektion.

---

## Nächste Schritte

Nach `/specify`:
1. `/plan` — Tech-Plan (nur Seed-Erweiterung, keine API-Changes)
2. `/tasks` — Tasks generieren (AC-09-001 bis AC-09-008)
3. `/implement` — Seed schreiben
4. `/sync fix` — Annotationen setzen
