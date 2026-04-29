# Punkte, Level & Rangliste – Business-Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 04
- **Product Owner**: PromptArena Team
- **Letzte Änderung**: 2026-04-22
- **Technische Spec**: `specs/technical/04-gamification.md`

---

## Geschäftlicher Kontext

Mitarbeiter sollen langfristig motiviert sein, die Plattform aktiv zu nutzen — Prompts einzureichen, zu bewerten und Lektionen abzuschliessen. Das Gamification-System wandelt jede dieser Aktionen in sichtbaren Fortschritt um: Punkte, Level und eine öffentliche Rangliste schaffen gesunden Wettbewerb und ein Gefühl der Anerkennung. Wer seinen Kollegen auf der Rangliste überholen möchte, wird immer wieder auf die Plattform zurückkehren.

---

## Zielgruppe

| Rolle | Beschreibung | Hauptnutzen |
|-------|-------------|-------------|
| Mitarbeiter | Alle Plattformnutzer | Sieht eigenen Fortschritt, Level-Aufstieg und Rang gegenüber Kollegen |
| Admin | Plattformverwalter | Kann Rangliste einsehen und Trends beobachten |

---

## User Stories

- Als **Mitarbeiter** will ich für jede nützliche Aktion automatisch Punkte erhalten, damit sich mein Engagement messbar lohnt.
- Als **Mitarbeiter** will ich mein Level und meinen Fortschritt zum nächsten Level-Aufstieg sehen, damit ich weiss, wie nah ich dem nächsten Meilenstein bin.
- Als **Mitarbeiter** will ich benachrichtigt werden, wenn ich ein neues Level erreiche, damit der Aufstieg ein besonderes Erlebnis ist.
- Als **Mitarbeiter** will ich auf der Rangliste meinen Rang unter allen Kollegen sehen, damit ich meine Aktivität einordnen kann.
- Als **Mitarbeiter** will ich auf meinem Dashboard auf einen Blick sehen, wie ich auf der Plattform stehe.

---

## Business-Akzeptanzkriterien

- [ ] **BAC-04-001**: Für definierte Aktionen werden automatisch Punkte vergeben — ohne manuelle Bestätigung.
  - **Messgrösse**: Nach jeder punkteauslösenden Aktion steigt der Punktestand des betreffenden Nutzers sofort um den korrekten Betrag.
  - **Geschäftsregel**: Punkte werden einmalig pro Auslöser vergeben. Das Rückgängigmachen einer Aktion (z. B. Favorit entfernen) gibt keine Punkte zurück. Punktetabelle: Prompt einreichen +20, Prompt wird benutzt +5 (an Autor), Prompt bewerten +3, Prompt favorisiert (erstmalig) +10 (an Autor), Challenge-Einreichung +30, Challenge gewonnen +100, Lektion abschliessen +15.

- [ ] **BAC-04-002**: Das Level eines Mitarbeiters wird nach jeder Punktevergabe automatisch aktualisiert.
  - **Messgrösse**: Das angezeigte Level stimmt jederzeit mit dem aktuellen Punktestand überein.
  - **Geschäftsregel**: Level-Schwellen — 0 Punkte: „Prompt-Lehrling", ab 100: „Prompt-Handwerker", ab 300: „Prompt-Schmied", ab 600: „KI-Botschafter". Level kann nicht sinken.

- [ ] **BAC-04-003**: Beim Erreichen eines neuen Levels erscheint eine sichtbare Glückwunschanzeige.
  - **Messgrösse**: Die Level-Up-Anzeige erscheint bei jeder Leveländerung und zeigt das neue Level korrekt an.
  - **Geschäftsregel**: Die Anzeige erscheint nur einmalig pro Level-Aufstieg, nicht bei jeder normalen Punktevergabe.

- [ ] **BAC-04-004**: Das persönliche Dashboard zeigt Punkte, Level, Rang und einen Fortschrittsbalken zum nächsten Level.
  - **Messgrösse**: Alle vier Kennzahlen sind auf dem Dashboard sichtbar und entsprechen den aktuellen Datenbankwerten.
  - **Geschäftsregel**: Der Fortschrittsbalken zeigt den prozentualen Fortschritt zwischen dem aktuellen und dem nächsten Level-Schwellenwert.

- [ ] **BAC-04-005**: Die Rangliste zeigt alle Mitarbeiter sortiert nach Gesamtpunkten, mit Hervorhebung des eigenen Eintrags.
  - **Messgrösse**: Die Rangliste enthält alle registrierten User; der eigene Eintrag ist visuell unterscheidbar; die Sortierung ist korrekt absteigend nach Punkten.
  - **Geschäftsregel**: Bei Punktegleichstand entscheidet das Einreibedatum (früher registriert = höherer Rang).

- [ ] **BAC-04-006**: Eine animierte Punkte-Einblendung erscheint direkt nach einer punkteauslösenden Aktion.
  - **Messgrösse**: Die Animation erscheint sichtbar im Sichtbereich des Nutzers und verschwindet nach spätestens 3 Sekunden automatisch.
  - **Geschäftsregel**: Die Einblendung zeigt den Betrag der gerade erhaltenen Punkte, nicht den Gesamtstand.

---

## Nicht im Scope

- Manuelle Punkte-Vergabe durch den Admin (ausser Challenge-Gewinner)
- Punkte-Abzüge oder Strafen
- Saisonale Resets der Rangliste
- Erfahrungspunkte-System mit mehreren Währungen
- Badges oder Auszeichnungen (ausser Level-Titel)
- Freundeslisten oder Follower-System

---

## Abhängigkeiten

| Feature / System | Typ | Beschreibung |
|-----------------|-----|-------------|
| Feature 01 – Benutzeridentität | benötigt | Punkte und Level sind am User-Account gespeichert |
| Feature 02 – Prompt-Bibliothek | benötigt | Mehrere Punkte-Trigger stammen aus Prompt-Aktionen |
| Feature 03 – Bewertungssystem | benötigt | Bewertungsaktion löst Punkte aus |
| Feature 05 – Favoriten | benötigt | Erstmaliges Favorisieren löst Punkte aus |
| Feature 06 – Challenges | benötigt | Challenge-Einreichung und -Gewinn lösen Punkte aus |
| Feature 08/09 – Lernpfad | benötigt | Lektionsabschluss löst Punkte aus |

---

## Risiken & Annahmen

| # | Beschreibung | Wahrscheinlichkeit | Massnahme |
|---|-------------|-------------------|-----------|
| R1 | Mitarbeiter „farmen" Punkte durch massenhaftes Einreichen von Niedrigqualitäts-Prompts | niedrig | Admin kann Prompts löschen; Bewertungssystem reguliert Sichtbarkeit |
| R2 | Die Rangliste demotiviert Mitarbeiter am Ende der Liste | mittel | Level-Anzeige zeigt persönlichen Fortschritt unabhängig vom Rang |
| A1 | Gamification steigert die Plattformnutzung messbar | hoch | KPI-Tracking nach 4 Wochen auswerten |

---

## Erfolgsmessung (KPIs)

| Metrik | Zielwert | Messmethode |
|--------|----------|-------------|
| Wöchentlich aktive Nutzer | > 50 % der registrierten User | Datenbankabfrage: User mit mind. 1 Aktion in letzten 7 Tagen |
| Anteil „Prompt-Handwerker" oder höher | > 30 % der registrierten User nach 4 Wochen | Datenbankabfrage: User mit totalPoints >= 100 |
| Level-Up-Ereignisse pro Woche | mind. 5 | Datenbankabfrage: Level-Änderungen in letzten 7 Tagen |

---

## Änderungshistorie

| Version | Datum | Änderung | Genehmigt von |
|---------|-------|----------|---------------|
| 1.0 | 2026-04-22 | Erstversion | PromptArena Team |

---

## Freigabe

- [ ] **PO-Freigabe**: ___________________________ Datum: ___________
- [ ] **BA-Review**: ___________________________ Datum: ___________
