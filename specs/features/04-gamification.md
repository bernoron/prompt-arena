# Feature: Gamification (Punkte, Level, Rangliste)

## Metadaten
- **Status**: `implemented`
- **Feature-Nr**: 04
- **Letzte Änderung**: 2026-04-13

---

## User Story
Als Mitarbeiter will ich für meine Beiträge Punkte sammeln und mein Level steigen sehen, damit ich motiviert bin, aktiv zu bleiben.

---

## Akzeptanzkriterien

- [x] **AC-04-001**: Punkte werden bei definierten Aktionen automatisch vergeben (`awardPoints`)
- [x] **AC-04-002**: Level wird nach jeder Punkte-Vergabe neu berechnet und gespeichert
- [x] **AC-04-003**: Level-Up-Modal erscheint wenn sich das Level ändert
- [x] **AC-04-004**: Dashboard zeigt: Punkte, Level, Rang, Fortschrittsbalken zum nächsten Level
- [x] **AC-04-005**: Dashboard zeigt die letzten eingereichten Prompts des Users
- [x] **AC-04-006**: Rangliste zeigt alle User sortiert nach totalPoints
- [x] **AC-04-007**: FloatingPoints-Animation erscheint bei Punkte-Events
- [x] **AC-04-008**: Profil-Seite zeigt User-Stats + alle eigenen Prompts

---

## API-Vertrag

Keine eigene API-Route — Punkte werden als Seiteneffekt in anderen Routes vergeben.

### Level-Schwellen (lib/points.ts)
```ts
0   → "Prompt-Lehrling"
100 → "Prompt-Handwerker"
300 → "Prompt-Schmied"
600 → "KI-Botschafter"
```

### Punkte-Konstanten (lib/points.ts)
```ts
SUBMIT_PROMPT:   20
USE_PROMPT:       5
VOTE_ON_PROMPT:   3
FAVORITE_PROMPT: 10
CHALLENGE_SUBMIT: 30
CHALLENGE_WIN:   100
```

---

## Datenmodell
Kein eigenes Modell — Level und Punkte sind Felder auf `User`:
```prisma
model User {
  totalPoints Int    @default(0)
  level       String @default("Prompt-Lehrling")
  @@index([totalPoints])
}
```

---

## UI-Verhalten

### Seite: `/dashboard`
- Begrüßungs-Header mit Username + Level-Badge
- Punkte-Karte: totalPoints + Fortschrittsbalken (getLevelProgress)
- Rang-Karte: globaler Rang + Trend
- Eigene letzte Prompts
- Trending Prompts

### Seite: `/leaderboard`
- Tabelle aller User: Rang, Name, Abteilung, Level-Badge, Punkte
- Eingeloggter User hervorgehoben

### Seite: `/profile`
- User-Stats: Punkte, Level, Rang, Anzahl Prompts, Avg-Rating eigener Prompts
- Liste aller eigenen Prompts

### Komponente: `FloatingPoints`
- Erscheint als animierter Overlay (+N Pts)
- Verschwindet nach 2 Sekunden
- Wird über `triggerFloat(label)` ausgelöst

### Komponente: `LevelUpModal`
- Erscheint nach Level-Aufstieg
- Zeigt neues Level-Icon + Gratulations-Text

---

## Punkte-Impact
Alle Punkte-Vergaben sind in `specs/constitution.md` definiert.

---

## Tests

### Unit
- `getLevel(points)`: alle Schwellen-Werte
- `getLevelProgress(points)`: 0%, 100%, Mittelwert
- `POINTS`-Objekt: alle Werte > 0, CHALLENGE_WIN > CHALLENGE_SUBMIT

### E2E
- Dashboard lädt und zeigt Punkte + Level
- Rangliste zeigt User in korrekter Reihenfolge
