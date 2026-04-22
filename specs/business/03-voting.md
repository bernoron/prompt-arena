# Bewertungssystem (1–5 Sterne) – Business-Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 03
- **Product Owner**: PromptArena Team
- **Letzte Änderung**: 2026-04-22
- **Technische Spec**: `specs/technical/03-voting.md`

---

## Geschäftlicher Kontext

Ohne Qualitätssignal ist eine wachsende Bibliothek schnell unübersichtlich. Das Bewertungssystem gibt jedem Mitarbeiter die Möglichkeit, gute Prompts sichtbar zu machen und schlechte nach unten zu sortieren. Gleichzeitig motiviert die Vergabe von Punkten an Bewerter auch das Feedback-Geben selbst — so entsteht eine aktive, sich selbst regulierende Community.

---

## Zielgruppe

| Rolle | Beschreibung | Hauptnutzen |
|-------|-------------|-------------|
| Mitarbeiter (bewertend) | Hat einen Prompt ausprobiert und will Feedback geben | Erhält 3 Punkte und hilft der Community, Qualität zu erkennen |
| Mitarbeiter (Autor) | Hat einen Prompt eingereicht | Sieht, wie gut sein Prompt bei Kollegen ankommt |
| Alle Nutzer | Suchen Qualitätsinhalte | Können Prompts nach Bewertung einschätzen |

---

## User Stories

- Als **Mitarbeiter** will ich einen Prompt mit 1 bis 5 Sternen bewerten, damit ich Qualitätssignale setze und dafür Punkte erhalte.
- Als **Mitarbeiter** will ich meine bestehende Bewertung ändern können, falls sich meine Einschätzung nach mehrfacher Nutzung geändert hat.
- Als **Mitarbeiter** will ich sehen, welche Bewertung ich bereits für einen Prompt abgegeben habe, damit ich meine bisherige Einschätzung nachvollziehen kann.
- Als **Mitarbeiter** will ich die Durchschnittsbewertung und Anzahl der Bewertungen auf jeder Prompt-Karte sehen, damit ich schnell erkennen kann, welche Prompts besonders geschätzt werden.
- Als **Autor** will ich meine eigenen Prompts nicht selbst bewerten können, damit keine künstlichen Bewertungen entstehen.

---

## Business-Akzeptanzkriterien

- [ ] **BAC-03-001**: Ein Mitarbeiter kann jeden Prompt einmalig mit 1 bis 5 Sternen bewerten; eine erneute Bewertung überschreibt die vorherige.
  - **Messgrösse**: Nach einer Bewertung aktualisiert sich die Durchschnittsbewertung des Prompts sofort; es ist maximal ein Bewertungseintrag pro User-Prompt-Kombination vorhanden.
  - **Geschäftsregel**: Eine Bewertung kann nachträglich geändert werden (neuer Wert überschreibt alten). Beim Überschreiben werden keine neuen Punkte vergeben.

- [ ] **BAC-03-002**: Der bewertende Mitarbeiter erhält bei seiner ersten Bewertung eines Prompts 3 Punkte.
  - **Messgrösse**: Punktestand steigt nach erstmaliger Bewertung um 3; bei Änderung einer bestehenden Bewertung erfolgt keine erneute Punktevergabe.
  - **Geschäftsregel**: Punkte werden nur einmal pro User-Prompt-Kombination vergeben, unabhängig davon, wie oft die Bewertung geändert wird.

- [ ] **BAC-03-003**: Mitarbeiter können ihre eigenen Prompts nicht bewerten.
  - **Messgrösse**: Das Bewertungs-Element ist für eigene Prompts visuell deaktiviert und funktional blockiert; ein Erklärungshinweis ist sichtbar.
  - **Geschäftsregel**: Die Prüfung, ob ein Prompt dem aktuellen User gehört, erfolgt anhand der Autor-ID. Admins sind von dieser Einschränkung nicht betroffen, da sie keine regulären User-Accounts verwenden.

- [ ] **BAC-03-004**: Die Durchschnittsbewertung und Anzahl der Bewertungen sind auf Prompt-Karten und im Detailfenster sichtbar.
  - **Messgrösse**: Durchschnittsbewertung stimmt rechnerisch mit den abgegebenen Bewertungen überein (auf 1 Dezimalstelle gerundet).
  - **Geschäftsregel**: Prompts ohne Bewertungen zeigen keinen Sternwert (oder „Noch nicht bewertet").

- [ ] **BAC-03-005**: Der eingeloggte Mitarbeiter sieht im Detailfenster hervorgehoben, welche Sternanzahl er selbst vergeben hat.
  - **Messgrösse**: Die eigene Bewertung ist visuell von den anderen Sternen unterscheidbar und korrekt mit dem gespeicherten Wert identisch.
  - **Geschäftsregel**: Die eigene Bewertung wird nur angezeigt, wenn ein User aktiv ausgewählt ist.

---

## Nicht im Scope

- Schriftliche Kommentare oder Begründungen zur Bewertung
- Daumen-hoch/runter-System als Alternative zu Sternen
- Öffentliche Sichtbarkeit, wer welche Bewertung abgegeben hat (Anonymität ist gewahrt)
- Meldung (Flagging) von Prompts als unangemessen
- Gewichtung von Bewertungen nach Nutzer-Level

---

## Abhängigkeiten

| Feature / System | Typ | Beschreibung |
|-----------------|-----|-------------|
| Feature 01 – Benutzeridentität | benötigt | Bewertungen sind immer einem konkreten User zugeordnet |
| Feature 02 – Prompt-Bibliothek | benötigt | Bewertungen beziehen sich auf bestehende Prompts |
| Feature 04 – Gamification | benötigt | Punkte für erstmalige Bewertung werden über das Gamification-System vergeben |

---

## Risiken & Annahmen

| # | Beschreibung | Wahrscheinlichkeit | Massnahme |
|---|-------------|-------------------|-----------|
| R1 | Mitarbeiter bewerten Prompts nicht, weil sie den Aufwand scheuen | mittel | Bewertung ist mit einem Klick erledigt; Punkte-Anreiz (3 Pts) sichtbar im Modal |
| A1 | Mitarbeiter bewerten ehrlich nach eigenem Ermessen | hoch | Keine technische Absicherung nötig; Vertrauensbasis reicht für internes Tool |

---

## Erfolgsmessung (KPIs)

| Metrik | Zielwert | Messmethode |
|--------|----------|-------------|
| Anteil bewerteter Prompts | > 50 % der Prompts haben mind. 1 Bewertung | Datenbankabfrage: Prompts mit voteCount > 0 / Gesamtprompts |
| Durchschnittliche Prompt-Bewertung | > 3,5 Sterne | Durchschnitt über alle avgRating-Werte |
| Bewertungen pro Woche | mind. 20 neue Bewertungen | Datenbankabfrage nach Bewertungsdatum |

---

## Änderungshistorie

| Version | Datum | Änderung | Genehmigt von |
|---------|-------|----------|---------------|
| 1.0 | 2026-04-22 | Erstversion | PromptArena Team |

---

## Freigabe

- [ ] **PO-Freigabe**: ___________________________ Datum: ___________
- [ ] **BA-Review**: ___________________________ Datum: ___________
