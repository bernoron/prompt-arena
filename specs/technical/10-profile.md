# Profil & Badge-System – Technische Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 10
- **Abgeleitet von**: `specs/business/10-profile.md` v1.0
- **Letzte Änderung**: 2026-06-27

---

## Technische Akzeptanzkriterien

- [x] **AC-10-001**: `GET /api/users/[id]` gibt vollständige Profildaten zurück: `id`, `name`, `avatarColor`, `totalPoints`, `level`, `rank` (Position in Gesamtliste), `prompts[]` (eigene Prompts mit `usageCount`, `avgRating`).
  - **Referenz**: BAC-10-001
  - **Testbar durch**: E2E

- [x] **AC-10-002**: Seite `/profile/[id]` zeigt Hero-Sektion mit Name, Avatar (Farbe + Initialen), Level-Badge, Punkte und Rang.
  - **Referenz**: BAC-10-001, BAC-10-002
  - **Testbar durch**: E2E, Manual

- [x] **AC-10-003**: Seite zeigt alle eigenen Prompts des Users sortiert nach `usageCount DESC`; jeder Eintrag zeigt Titel, Nutzungsanzahl und Durchschnittsbewertung.
  - **Referenz**: BAC-10-003
  - **Testbar durch**: E2E, Manual

- [x] **AC-10-004**: 7 Badges werden angezeigt (verdient und gesperrt); Badges basieren auf Schwellwerten (erster Prompt, 5 Prompts, Prompt mit 10+ Nutzungen, Bewertung ≥ 4.5, Punkte-Meilensteine); verdiente Badges bleiben auch wenn Metriken sinken.
  - **Referenz**: BAC-10-004, BAC-10-005
  - **Testbar durch**: Manual

- [x] **AC-10-005**: Seite reagiert auf User-Wechsel via `userChanged`-Event ohne Seiten-Neuladen; beim Aufrufen des eigenen Profils ist der aktive User vorausgewählt.
  - **Referenz**: BAC-10-006
  - **Testbar durch**: E2E, Manual

---

## API-Vertrag

### GET /api/users/[id]
**Path-Parameter:** `id` — positive Ganzzahl

**Response `200`:**
```json
{
  "id": 1,
  "name": "Max Mustermann",
  "avatarColor": "#6366f1",
  "totalPoints": 350,
  "level": "Prompt-Schmied",
  "createdAt": "2026-01-15T08:00:00.000Z",
  "rank": 3,
  "prompts": [
    {
      "id": 5,
      "title": "Professionelle E-Mail",
      "usageCount": 42,
      "avgRating": 4.3,
      "voteCount": 8,
      "createdAt": "2026-02-01T10:00:00.000Z"
    }
  ]
}
```

**Fehler:**
| Code | Grund |
|------|-------|
| 400 | Ungültige ID |
| 404 | User nicht gefunden |

---

## Komponenten-Struktur

```
app/(user)/profile/
└── [id]/
    └── page.tsx           // Profil-Seite (AC-10-002 bis AC-10-005)

app/api/users/
└── [id]/
    └── route.ts           // GET (AC-10-001)
```

---

## Änderungshistorie

| Version | Datum | CR | Änderung |
|---------|-------|----|---------|
| 1.0 | 2026-06-27 | — | Erstversion (nachträglich aus Implementierung abgeleitet) |
