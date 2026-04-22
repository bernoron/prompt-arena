# Erweiterte Lernmodule (5 neue Module) – Business-Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 09
- **Product Owner**: PromptArena Team
- **Letzte Änderung**: 2026-04-22
- **Technische Spec**: `specs/technical/09-extended-learning.md`

---

## Geschäftlicher Kontext

Nachdem die ersten 5 Lernmodule die Grundlagen des Promptings abdecken, brauchen fortgeschrittene Mitarbeiter eine Möglichkeit, ihr Wissen weiter zu vertiefen. Die 5 neuen Module adressieren konkrete Anwendungsfelder: Bilder und Dokumente in Prompts einbinden, Code mit KI schreiben und debuggen, grosse Dateien verarbeiten, Sicherheitsrisiken erkennen und das richtige Modell für den jeweiligen Anwendungsfall wählen. Da die technische Infrastruktur des Lernpfads bereits steht, erfordern diese Module keine Änderungen am System — nur neue Inhalte.

---

## Zielgruppe

| Rolle | Beschreibung | Hauptnutzen |
|-------|-------------|-------------|
| Mitarbeiter (Fortgeschrittene) | Hat die ersten 5 Module abgeschlossen und will Spezialkenntnisse aufbauen | Lernt praxisnahe Techniken für Bild-, Code-, Datei- und Sicherheitsszenarien |
| Mitarbeiter (IT/Entwicklung) | Hat technischen Hintergrund und will KI gezielt für Entwicklungsaufgaben nutzen | Findet spezifische Anleitungen für Code-Prompting und Dateiverarbeitung |
| Mitarbeiter (alle) | Möchte wissen, wann welches KI-Modell sinnvoll ist | Kann fundierte Modellentscheidungen treffen |

---

## User Stories

- Als **Mitarbeiter** will ich lernen, wie ich Bilder und Dokumente in meine Prompts einbinden kann, damit ich KI-Assistenten für visuelle Aufgaben einsetze.
- Als **Mitarbeiter** will ich lernen, KI gezielt für das Schreiben, Debuggen und Refaktorieren von Code einzusetzen, damit ich meine Entwicklungsarbeit effizienter gestalte.
- Als **Mitarbeiter** will ich lernen, wie ich grosse Dateien (CSV, PDF, Excel) sinnvoll an KI übergebe, damit ich Datenanalysen schneller durchführen kann.
- Als **Mitarbeiter** will ich lernen, Sicherheitsrisiken beim Einsatz von KI zu erkennen, damit ich sensible Daten schütze und ethische Grenzen einhalte.
- Als **Mitarbeiter** will ich verstehen, wann ich welches KI-Modell verwenden sollte, damit ich für jede Aufgabe das passende Werkzeug wähle.

---

## Business-Akzeptanzkriterien

- [ ] **BAC-09-001**: Das Lernmodul „Bilder & Videos" (4 Lektionen) ist verfügbar und behandelt visuelle Prompting-Techniken.
  - **Messgrösse**: Alle 4 Lektionen (Vision-Grundlagen, Bildbeschreibung, Dokument-Analyse, Multi-Bild-Prompting) sind abrufbar und enthalten vollständige Inhaltsblöcke.
  - **Geschäftsregel**: Jede Lektion enthält mindestens 3 verwendbare Muster und 2 reale Alltagsbeispiele.

- [ ] **BAC-09-002**: Das Lernmodul „Code & Debugging" (5 Lektionen) ist verfügbar und behandelt Code-Prompting-Techniken.
  - **Messgrösse**: Alle 5 Lektionen (Code schreiben, Debugging, Code-Review, Architektur, SQL) sind abrufbar und vollständig befüllt.
  - **Geschäftsregel**: Jede Lektion enthält mindestens 3 verwendbare Muster und 2 reale Alltagsbeispiele.

- [ ] **BAC-09-003**: Das Lernmodul „Dateien verarbeiten" (4 Lektionen) ist verfügbar und behandelt das Einbinden verschiedener Dateitypen in Prompts.
  - **Messgrösse**: Alle 4 Lektionen (CSV, JSON, PDF, Excel) sind abrufbar und vollständig befüllt.
  - **Geschäftsregel**: Jede Lektion enthält mindestens 3 verwendbare Muster und 2 reale Alltagsbeispiele.

- [ ] **BAC-09-004**: Das Lernmodul „Prompt-Sicherheit & ethische Grenzen" (5 Lektionen) ist verfügbar und behandelt Risiken beim KI-Einsatz.
  - **Messgrösse**: Alle 5 Lektionen (Prompt Injection, Jailbreaks, Datenschutz, ethische Grenzen, Audit-Logs) sind abrufbar und vollständig befüllt.
  - **Geschäftsregel**: Jede Lektion enthält mindestens 3 verwendbare Muster und 2 reale Alltagsbeispiele.

- [ ] **BAC-09-005**: Das Lernmodul „Das richtige Modell wählen" (4 Lektionen) ist verfügbar und erklärt Stärken, Schwächen und Einsatzgebiete verschiedener KI-Modelle.
  - **Messgrösse**: Alle 4 Lektionen (Claude, GPT, Gemini & andere, Open-Source) sind abrufbar und vollständig befüllt.
  - **Geschäftsregel**: Jede Lektion enthält mindestens 3 verwendbare Muster und 2 reale Alltagsbeispiele.

- [ ] **BAC-09-006**: Die neuen Module erscheinen automatisch auf der Lernübersicht, ohne dass Programmierer tätig werden müssen — ausschliesslich durch Hinzufügen der Inhalte zur Datenbank.
  - **Messgrösse**: Nach dem Befüllen der Datenbank mit den neuen Modulen erscheinen diese vollständig in der Lernübersicht für alle Mitarbeiter.
  - **Geschäftsregel**: Die Module erhalten die Ordnungsnummern 6–10 (nach den bestehenden Modulen 1–5). Slugs der neuen Module: vision, coding, files, security, model-choice.

---

## Nicht im Scope

- Veränderungen am bestehenden Lernpfad-System (kein neuer Code nötig)
- Voraussetzungen oder Sperren (Modul 6 erst nach Abschluss von Modul 5 freigeschaltet)
- Adaptive Lernpfade oder individuelle Empfehlungen
- Externe Verlinkungen zu Modell-Anbietern oder Dokumentationen
- Regelmässige Aktualisierung des Modulinhalts (wird bei Bedarf manuell aktualisiert)

---

## Abhängigkeiten

| Feature / System | Typ | Beschreibung |
|-----------------|-----|-------------|
| Feature 08 – Lernpfad | benötigt | Die gesamte technische Infrastruktur (Seiten, API, Fortschrittstracking, Punktevergabe) wird von Feature 08 bereitgestellt |
| Feature 01 – Benutzeridentität | benötigt | Fortschritt in den neuen Modulen wird je User gespeichert |
| Feature 04 – Gamification | benötigt | Punkte für abgeschlossene Lektionen (weiterhin +15 pro Lektion) |

---

## Risiken & Annahmen

| # | Beschreibung | Wahrscheinlichkeit | Massnahme |
|---|-------------|-------------------|-----------|
| R1 | Modulinhalte veralten schnell (z. B. Modell-Vergleiche) | hoch | Inhalte sollten halbjährlich überprüft und bei Bedarf aktualisiert werden |
| R2 | Doppelte Slugs zwischen alten und neuen Modulen führen zu Fehlern | niedrig | Einmalige Prüfung vor dem Seed-Update auf Eindeutigkeit aller Slugs |
| A1 | Das Lernpfad-System aus Feature 08 ist stabil und skaliert problemlos | hoch | Kein zusätzlicher Aufwand erwartet, da reine Datenerweiterung |

---

## Erfolgsmessung (KPIs)

| Metrik | Zielwert | Messmethode |
|--------|----------|-------------|
| Anteil User mit mind. 1 Lektion aus den neuen Modulen | > 30 % der aktiven User nach 8 Wochen | Datenbankabfrage: LessonProgress-Einträge für Lektionen der Module 6–10 |
| Gesamtzahl abgeschlossener Lektionen pro Woche | Steigerung um 40 % gegenüber Baseline vor Einführung | Datenbankabfrage nach LessonProgress-Datum |
| Anteil Nutzer, die alle 10 Module abschliessen | > 10 % der registrierten User nach 3 Monaten | Datenbankabfrage: User mit vollständigem LessonProgress für alle Module |

---

## Änderungshistorie

| Version | Datum | Änderung | Genehmigt von |
|---------|-------|----------|---------------|
| 1.0 | 2026-04-22 | Erstversion | PromptArena Team |

---

## Freigabe

- [ ] **PO-Freigabe**: ___________________________ Datum: ___________
- [ ] **BA-Review**: ___________________________ Datum: ___________
