# Wöchentliche Challenges – Business-Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 06
- **Product Owner**: PromptArena Team
- **Letzte Änderung**: 2026-04-22
- **Technische Spec**: `specs/technical/06-challenges.md`

---

## Geschäftlicher Kontext

Regelmässige Challenges halten die Plattform lebendig und geben Mitarbeitern einen konkreten Anlass, neue Prompt-Kategorien auszuprobieren. Jede Woche stellt der Admin ein Thema, und alle können Prompts dazu einreichen. Die besten Einreichungen werden prämiert — was sowohl Kreativität als auch den gezielten Einsatz von KI-Werkzeugen fördert. Challenges schaffen ausserdem gemeinsame Gesprächsthemen im Team und machen die Plattform zu einem sozialen Erlebnis.

---

## Zielgruppe

| Rolle | Beschreibung | Hauptnutzen |
|-------|-------------|-------------|
| Mitarbeiter | Möchte Bonus-Punkte sammeln und an einem wöchentlichen Thema mitwirken | Erhält 30 Punkte für eine Einreichung; Gewinner erhält 100 Punkte |
| Admin | Gestaltet das Wochenprogramm der Plattform | Kann Challenges vollständig steuern: erstellen, aktivieren, beenden |

---

## User Stories

- Als **Mitarbeiter** will ich sehen, ob gerade eine aktive Challenge läuft, damit ich entscheide, ob ich daran teilnehmen möchte.
- Als **Mitarbeiter** will ich beim Einreichen eines Prompts wählen können, ob er für die aktuelle Challenge zählt, damit ich gezielt teilnehme und Bonus-Punkte erhalte.
- Als **Admin** will ich eine neue Challenge mit Titel, Beschreibung und Zeitraum erstellen, damit ich das wöchentliche Thema festlegen kann.
- Als **Admin** will ich eine Challenge aktivieren oder beenden, damit immer genau eine Challenge zur Zeit läuft.
- Als **Admin** will ich den Gewinner einer beendeten Challenge bestimmen und auszeichnen können, damit besondere Leistungen anerkannt werden.

---

## Business-Akzeptanzkriterien

- [ ] **BAC-06-001**: Mitarbeiter sehen auf der Einreichungsseite eine Hinweiskarte zur aktuell aktiven Challenge.
  - **Messgrösse**: Wenn eine Challenge aktiv ist, wird die Karte sichtbar auf der Einreichungsseite angezeigt; wenn keine Challenge aktiv ist, bleibt die Karte ausgeblendet.
  - **Geschäftsregel**: Gleichzeitig kann immer nur eine Challenge aktiv sein.

- [ ] **BAC-06-002**: Ein Mitarbeiter kann beim Einreichen eines Prompts wählen, ob er diesen für die aktive Challenge einreicht, und erhält dafür 30 Punkte.
  - **Messgrösse**: Nach einer Challenge-Einreichung steigt der Punktestand des Mitarbeiters um 30; der Prompt erscheint in der Bibliothek und ist der Challenge zugeordnet.
  - **Geschäftsregel**: Die 30 Punkte werden zusätzlich zu den normalen 20 Einreichungs-Punkten vergeben (sofern das Gamification-System beides vergibt). Ein Mitarbeiter kann mehrere Prompts für dieselbe Challenge einreichen.

- [ ] **BAC-06-003**: Der Admin kann eine neue Challenge mit Titel, Beschreibung und Zeitraum (Start- und Enddatum) erstellen.
  - **Messgrösse**: Die erstellte Challenge erscheint sofort in der Admin-Übersicht; sie ist anfangs inaktiv.
  - **Geschäftsregel**: Titel und Beschreibung sind Pflichtfelder; Start- und Enddatum sind informativer Charakter und haben keinen technischen Einfluss auf die Aktivierung.

- [ ] **BAC-06-004**: Der Admin kann eine Challenge aktivieren oder beenden; bei Aktivierung werden alle anderen Challenges automatisch deaktiviert.
  - **Messgrösse**: Nach der Aktivierung ist genau diese eine Challenge aktiv und alle anderen inaktiv; nach dem Beenden ist keine Challenge mehr aktiv.
  - **Geschäftsregel**: Kein Mitarbeiter kann eine Challenge selbst aktivieren oder beenden — das ist ausschliesslich dem Admin vorbehalten.

- [ ] **BAC-06-005**: Der Admin kann den Gewinner einer Challenge bestimmen und dieser erhält 100 Punkte.
  - **Messgrösse**: Nach der Gewinner-Vergabe steigt der Punktestand des ausgewählten Nutzers um 100; der Vorgang ist im Admin-Panel protokolliert.
  - **Geschäftsregel**: Die Gewinner-Vergabe erfolgt manuell durch den Admin. Es gibt pro Challenge maximal einen Gewinner.

---

## Nicht im Scope

- Automatische Bestimmung des Gewinners anhand von Bewertungen oder Nutzungszahlen
- Öffentliche Challenge-Übersicht für Mitarbeiter (ausser dem Hinweis auf der Einreichungsseite)
- Wiederkehrende Challenges mit automatischer Aktivierung
- Benachrichtigung per E-Mail über neue Challenges oder Gewinner
- Challenge-Kategorien oder Tags
- Teilnahmelimits (jeder kann beliebig viele Prompts einreichen)

---

## Abhängigkeiten

| Feature / System | Typ | Beschreibung |
|-----------------|-----|-------------|
| Feature 01 – Benutzeridentität | benötigt | Challenge-Einreichungen sind immer einem User zugeordnet |
| Feature 02 – Prompt-Bibliothek | benötigt | Challenge-Prompts sind reguläre Prompts mit einer Challenge-Zuordnung |
| Feature 04 – Gamification | benötigt | Punkte für Einreichung und Gewinn werden über das Gamification-System vergeben |
| Feature 07 – Admin-Panel | benötigt | Challenges können nur vom Admin verwaltet werden |

---

## Risiken & Annahmen

| # | Beschreibung | Wahrscheinlichkeit | Massnahme |
|---|-------------|-------------------|-----------|
| R1 | Der Admin vergisst, eine neue Challenge zu erstellen, und die Plattform läuft wochenlang ohne aktive Challenge | mittel | Reminder-Hinweis im Admin-Dashboard wenn > 7 Tage keine aktive Challenge |
| R2 | Mitarbeiter reichen viele Prompts ein, nur um die 30 Punkte zu erhalten, ohne Qualität zu beachten | niedrig | Bewertungssystem reguliert Sichtbarkeit; Admin kann löschen |
| A1 | Admin ist regelmässig aktiv und betreut die Challenges wöchentlich | hoch | Ohne Admin-Engagement keine Challenges; muss organizational sichergestellt werden |

---

## Erfolgsmessung (KPIs)

| Metrik | Zielwert | Messmethode |
|--------|----------|-------------|
| Teilnahmequote pro Challenge | mind. 5 Einreichungen pro aktiver Challenge | Datenbankabfrage: ChallengeSubmissions pro Challenge |
| Anteil Nutzer mit mind. 1 Challenge-Teilnahme | > 40 % der registrierten User nach 8 Wochen | Datenbankabfrage: User mit mind. 1 ChallengeSubmission |
| Challenges pro Monat | mind. 4 (wöchentlich) | Admin-Aktivitätsprotokoll |

---

## Änderungshistorie

| Version | Datum | Änderung | Genehmigt von |
|---------|-------|----------|---------------|
| 1.0 | 2026-04-22 | Erstversion | PromptArena Team |

---

## Freigabe

- [ ] **PO-Freigabe**: ___________________________ Datum: ___________
- [ ] **BA-Review**: ___________________________ Datum: ___________
