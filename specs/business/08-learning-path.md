# Lernpfad (5 Module, 20 Lektionen) – Business-Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 08
- **Product Owner**: PromptArena Team
- **Letzte Änderung**: 2026-04-22
- **Technische Spec**: `specs/technical/08-learning-path.md`

---

## Geschäftlicher Kontext

Viele Mitarbeiter wissen nicht, wie sie KI-Werkzeuge effektiv einsetzen können — und schreiben deshalb suboptimale Prompts. Der strukturierte Lernpfad bietet geführtes Wissen in kompakten Lektionen: von den Grundlagen der KI bis zu fortgeschrittenen Prompting-Techniken. Mitarbeiter, die den Lernpfad durchlaufen, schreiben bessere Prompts, teilen mehr und nutzen die Plattform intensiver. Gleichzeitig werden abgeschlossene Lektionen mit Punkten belohnt, was den Lernpfad nahtlos ins Gamification-System integriert.

---

## Zielgruppe

| Rolle | Beschreibung | Hauptnutzen |
|-------|-------------|-------------|
| Mitarbeiter (Einsteiger) | Kennt KI-Tools kaum oder hat unsystematisches Vorwissen | Erhält strukturiertes Grundlagenwissen und traut sich, Prompts einzureichen |
| Mitarbeiter (Fortgeschrittene) | Kennt KI-Grundlagen, will systematischer werden | Vertieft Techniken und sammelt dabei Punkte |
| Admin | Beobachtet Nutzungsverhalten | Kann Fortschritt der Belegschaft nachverfolgen |

---

## User Stories

- Als **Mitarbeiter** will ich eine übersichtliche Kursstruktur mit Modulen und Lektionen sehen, damit ich weiss, was ich noch lernen kann und wie weit ich bin.
- Als **Mitarbeiter** will ich innerhalb einer Lektion Erklärungen, Praxis-Tipps, Gut-/Schlecht-Beispiele und wiederverwendbare Muster sehen, damit ich das Gelernte direkt anwenden kann.
- Als **Mitarbeiter** will ich eine Lektion als abgeschlossen markieren und dafür 15 Punkte erhalten, damit sich der Lernaufwand doppelt lohnt.
- Als **Mitarbeiter** will ich meinen Lernfortschritt visuell verfolgen können, damit ich weiss, wie viel ich schon gelernt habe.
- Als **Mitarbeiter** will ich direkt von meinem Dashboard zur nächsten offenen Lektion navigieren können, damit mir der Einstieg ins Lernen leicht gemacht wird.

---

## Business-Akzeptanzkriterien

- [ ] **BAC-08-001**: Die Lernübersicht zeigt alle 5 Module mit ihren Lektionen und dem persönlichen Fortschritt des Mitarbeiters.
  - **Messgrösse**: Alle Module sind korrekt angezeigt; der Fortschrittsring jedes Moduls stimmt mit den tatsächlich abgeschlossenen Lektionen überein.
  - **Geschäftsregel**: Fortschritt wird nur gespeichert, wenn ein User aktiv ausgewählt ist. Ohne ausgewählten User zeigt die Übersicht den Inhalt, aber keinen Fortschritt.

- [ ] **BAC-08-002**: Jede Lektion enthält strukturierten Inhalt mit verschiedenen Block-Typen: Erklärtext, Tipps, Warnungen, Gut-/Schlecht-Beispiele und Prompt-Muster.
  - **Messgrösse**: Alle Block-Typen werden auf der Lektionsseite korrekt und visuell unterscheidbar dargestellt.
  - **Geschäftsregel**: Jede Lektion enthält mindestens einen Textblock; weitere Typen sind optional aber empfohlen.

- [ ] **BAC-08-003**: Ein Mitarbeiter kann eine Lektion als abgeschlossen markieren und erhält dafür einmalig 15 Punkte.
  - **Messgrösse**: Nach dem Markieren wechselt der Button zur Bestätigungsanzeige; Punkte werden vergeben; bei erneutem Aufruf derselben Lektion ist die Lektion als erledigt markiert und keine weiteren Punkte werden vergeben.
  - **Geschäftsregel**: Abschluss einer Lektion ist idempotent — mehrfaches Klicken hat keine Wirkung; Punkte werden nur einmalig vergeben. Ohne ausgewählten User kann keine Lektion abgeschlossen werden.

- [ ] **BAC-08-004**: Die Navigation zwischen Lektionen erlaubt Vor- und Zurück-Bewegung, auch über Modul-Grenzen hinaus.
  - **Messgrösse**: Auf jeder Lektionsseite sind (sofern vorhanden) Vor- und Zurück-Buttons sichtbar und funktional; modulübergreifende Navigation funktioniert korrekt.
  - **Geschäftsregel**: Die letzte Lektion des letzten Moduls hat keinen Weiter-Button; die erste Lektion des ersten Moduls hat keinen Zurück-Button.

- [ ] **BAC-08-005**: Das persönliche Dashboard enthält ein Widget, das die nächste offene Lektion und den Gesamtfortschritt anzeigt.
  - **Messgrösse**: Das Widget zeigt die korrekte nächste Lektion an; der Link zur Lektion funktioniert direkt.
  - **Geschäftsregel**: Wenn alle Lektionen abgeschlossen sind, zeigt das Widget eine Abschlussanzeige. Ohne User zeigt das Widget keinen persönlichen Fortschritt.

- [ ] **BAC-08-006**: Der Lernpfad enthält 5 vordefinierte Module mit insgesamt 20 Lektionen über effektives Prompting.
  - **Messgrösse**: Alle 5 Module und mind. 3 Lektionen pro Modul sind in der Datenbank vorhanden und abrufbar.
  - **Geschäftsregel**: Lerninhalt ist fest vordefiniert (Seed-Daten); er kann vom Admin nicht über die Oberfläche bearbeitet werden. Module: (1) KI verstehen, (2) Grundregeln des Promptings, (3) Prompt-Muster & Patterns, (4) Alltagsbeispiele, (5) Fortgeschrittene Techniken.

---

## Nicht im Scope

- Editieren oder Erstellen von Lernmodulen und Lektionen über die Oberfläche (nur via Seed-Daten)
- Quiz oder Wissensüberprüfungen am Ende einer Lektion
- Zertifikate oder Abzeichen für abgeschlossene Module
- Kursempfehlungen basierend auf dem Nutzungsverhalten
- Diskussions- oder Kommentarfunktion zu Lektionen
- Video- oder Audio-Inhalte (nur Text-basierte Inhaltsblöcke)

---

## Abhängigkeiten

| Feature / System | Typ | Beschreibung |
|-----------------|-----|-------------|
| Feature 01 – Benutzeridentität | benötigt | Fortschritt wird je User gespeichert |
| Feature 04 – Gamification | benötigt | Punkte für abgeschlossene Lektionen werden über das Gamification-System vergeben |

---

## Risiken & Annahmen

| # | Beschreibung | Wahrscheinlichkeit | Massnahme |
|---|-------------|-------------------|-----------|
| R1 | Lerninhalt ist nach einiger Zeit veraltet oder unvollständig | mittel | Seed-Daten können bei Bedarf vom Entwicklungsteam aktualisiert werden |
| R2 | Mitarbeiter schliessen Lektionen mechanisch ab (ohne Lesen), nur für Punkte | mittel | Akzeptiert — der Lerninhalt ist trotzdem verfügbar; keine erzwungene Lesezeit |
| A1 | Mitarbeiter lesen Lerninhalt auf Deutsch | hoch | Inhalt ist vollständig auf Deutsch; kein Mehrsprachigkeitsbedarf für Lerninhalt |

---

## Erfolgsmessung (KPIs)

| Metrik | Zielwert | Messmethode |
|--------|----------|-------------|
| Anteil User mit mind. 1 abgeschlossener Lektion | > 60 % der registrierten User nach 8 Wochen | Datenbankabfrage: User mit mind. 1 LessonProgress-Eintrag |
| Durchschnittlich abgeschlossene Lektionen pro User | mind. 5 von 20 | Datenbankabfrage: LessonProgress-Einträge / User-Count |
| Abschlussrate des ersten Moduls | > 40 % der User | Datenbankabfrage: User mit allen 3+ Lektionen des ersten Moduls abgeschlossen |

---

## Änderungshistorie

| Version | Datum | Änderung | Genehmigt von |
|---------|-------|----------|---------------|
| 1.0 | 2026-04-22 | Erstversion | PromptArena Team |

---

## Freigabe

- [ ] **PO-Freigabe**: ___________________________ Datum: ___________
- [ ] **BA-Review**: ___________________________ Datum: ___________
