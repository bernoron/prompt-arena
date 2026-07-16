# Prompt-Bibliothek & Einreichung – Business-Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.1
- **Feature-Nr**: 02
- **Product Owner**: PromptArena Team
- **Letzte Änderung**: 2026-07-16
- **Technische Spec**: `specs/technical/02-prompt-library.md`

---

## Geschäftlicher Kontext

Das Kernstück von PromptArena ist die Prompt-Bibliothek: Nutzer teilen hier ihre bewährten KI-Prompts, damit andere nicht das Rad neu erfinden müssen. Je mehr nützliche Prompts geteilt werden, desto schneller steigt das kollektive KI-Wissen in der Community. Das System belohnt sowohl das Einreichen als auch das Benutzen von Prompts mit Punkten, um einen positiven Kreislauf des Wissensaustauschs anzuregen.

---

## Zielgruppe

| Rolle | Beschreibung | Hauptnutzen |
|-------|-------------|-------------|
| Nutzer (suchend) | Sucht einen Prompt für eine konkrete Aufgabe | Findet schnell passende, erprobte Prompts ohne selbst formulieren zu müssen |
| Nutzer (einreichend) | Hat einen funktionierenden Prompt und möchte ihn teilen | Erhält Anerkennung (Punkte) und trägt zur Wissensbasis bei |
| Admin | Verwaltet die Qualität der Bibliothek | Kann problematische Prompts bearbeiten oder entfernen |

---

## User Stories

- Als **Nutzer** will ich Prompts nach Kategorie und Schwierigkeit filtern, damit ich schnell die für meine Aufgabe passenden Prompts finde.
- Als **Nutzer** will ich in den Prompt-Titeln und -Inhalten suchen, damit ich auch ohne die exakte Kategorie zu kennen fündig werde.
- Als **Nutzer** will ich einen Prompt im Detail lesen und mit einem Klick kopieren, damit ich ihn sofort in meinem KI-Tool verwenden kann.
- Als **Nutzer** will ich einen Prompt als „benutzt" markieren, damit der Autor dafür Punkte erhält und beliebte Prompts sichtbarer werden.
- Als **Nutzer** will ich eigene Prompts einreichen, damit ich Wissen teile und Punkte für meinen Beitrag erhalte.
- Als **Nutzer** will ich sehen, wie beliebt ein Prompt ist (Rarity-Anzeige), damit ich erkenne, welche Prompts sich bewährt haben.

---

## Business-Akzeptanzkriterien

- [ ] **BAC-02-001**: Ein Nutzer kann einen Prompt mit Titel, Inhalt, Kategorie und Schwierigkeitsgrad einreichen und erhält dafür sofort 20 Punkte.
  - **Messgrösse**: Der Prompt erscheint unmittelbar nach Einreichung in der Bibliothek; der Punktestand des Einreichers steigt um 20.
  - **Geschäftsregel**: Titel und Inhalt sind in Deutsch Pflicht; englische Versionen sind optional aber empfohlen. Kategorie und Schwierigkeit müssen aus vorgegebenen Werten gewählt werden.

- [ ] **BAC-02-002**: Die Bibliothek zeigt alle Prompts mit Autor, Durchschnittsbewertung, Nutzungsanzahl und Rarity-Kennzeichnung.
  - **Messgrösse**: Seite lädt alle sichtbaren Informationen in unter 2 Sekunden; Rarity-Stufe stimmt mit Nutzungsanzahl überein.
  - **Geschäftsregel**: Rarity-Stufen basieren auf der Nutzungsanzahl — unter 10 = Common (kein Effekt), ab 10 = Rare (blau), ab 30 = Epic (lila), ab 60 = Legendary (gold).

- [ ] **BAC-02-003**: Nutzer können die Bibliothek nach Kategorie filtern (Writing, E-Mail, Analyse, Excel oder Alle).
  - **Messgrösse**: Nach Auswahl einer Kategorie sind nur Prompts dieser Kategorie sichtbar; bei „Alle" wieder alle Prompts.
  - **Geschäftsregel**: Die Filterkombination Kategorie + Suche + Sortierung ist gleichzeitig möglich.

- [ ] **BAC-02-004**: Eine Volltextsuche durchsucht Titel und Inhalt auf Deutsch und Englisch.
  - **Messgrösse**: Suchergebnisse erscheinen ohne Seitenneuladen; relevante Prompts werden bei sinnvollen Suchbegriffen gefunden.
  - **Geschäftsregel**: Die Suche ist nicht case-sensitiv; sie durchsucht immer Titel und Inhalt beider Sprachen gleichzeitig.

- [ ] **BAC-02-005**: Prompts können nach „Neueste" oder „Meistgenutzt" sortiert werden.
  - **Messgrösse**: Nach Umschalten der Sortierung ändert sich die Reihenfolge sofort und korrekt.
  - **Geschäftsregel**: Standardsortierung bei Seitenaufruf ist „Neueste".

- [ ] **BAC-02-006**: Durch Klick auf eine Prompt-Karte öffnet sich ein Detailfenster mit vollständigem Inhalt und Kopieren-Funktion.
  - **Messgrösse**: Der vollständige Prompt-Inhalt ist sichtbar; der Kopieren-Button überträgt den Inhalt korrekt in die Zwischenablage.
  - **Geschäftsregel**: Der Kopieren-Button kopiert den deutschen Prompt-Text; bei vorhandenem englischen Text kann dieser ebenfalls angezeigt werden.

- [ ] **BAC-02-007**: Ein Nutzer kann einen Prompt als „benutzt" markieren und der Autor erhält dafür 5 Punkte.
  - **Messgrösse**: Nach dem Markieren steigt der Nutzungszähler des Prompts; der Autor erhält sichtbar +5 Punkte.
  - **Geschäftsregel**: Der „Benutzt"-Button kann mehrfach geklickt werden — jeder Klick gilt als neue Nutzung und vergibt erneut Punkte an den Autor. Ein Nutzer kann denselben Prompt mehrfach als benutzt markieren.

- [~] **BAC-02-008**: Ein Nutzer kann beim Einreichen eines Prompts eine neue Kategorie erstellen, falls keine bestehende passt (CR-004).
  - **Messgrösse**: Die neue Kategorie ist unmittelbar nach der Einreichung in Filter, Suche und beim erneuten Einreichen als Vorschlag verfügbar.
  - **Geschäftsregel**: Das Kategoriefeld ist ein freies Eingabefeld mit Live-Vorschlägen bestehender Kategorien; passt kein Vorschlag, wird beim Absenden automatisch eine neue Kategorie angelegt und sofort veröffentlicht (keine Admin-Vorabprüfung). Der Admin kann nutzer-erstellte Kategorien wie gewohnt umbenennen oder löschen (BAC-07-004).

---

## Nicht im Scope

- Direkte Ausführung von Prompts in einem KI-Modell innerhalb der App
- Versionierung von Prompts (Bearbeitungshistorie)
- Kommentarfunktion zu Prompts
- Schwierigkeitsgrade frei definieren (bleiben fest vorgegeben, keine offenen Freitextfelder) — Kategorien sind seit CR-004 davon ausgenommen (siehe BAC-02-008)
- Automatische Übersetzung der Prompts (englische Version wird manuell eingegeben)
- Prompt-Duplikat-Erkennung

---

## Abhängigkeiten

| Feature / System | Typ | Beschreibung |
|-----------------|-----|-------------|
| Feature 01 – Benutzeridentität | benötigt | Jeder Prompt braucht einen Autor; Nutzung und Punkte setzen einen angemeldeten User voraus |
| Feature 04 – Gamification | benötigt | Punkte für Einreichen und Benutzen werden über das Gamification-System vergeben |

---

## Risiken & Annahmen

| # | Beschreibung | Wahrscheinlichkeit | Massnahme |
|---|-------------|-------------------|-----------|
| R1 | Qualität der eingereichten Prompts ist niedrig | mittel | Bewertungssystem (Feature 03) und Admin-Löschmöglichkeit (Feature 07) als Korrektiv |
| R2 | Nutzer reichen vertrauliche oder personenbezogene Daten in Prompts ein | niedrig | Hinweis im Onboarding; Admin kann problematische Prompts entfernen |
| A1 | Nutzer sind motiviert, ihr Wissen zu teilen | hoch | Punktevergabe und Rangliste als zusätzlicher Anreiz |

---

## Erfolgsmessung (KPIs)

| Metrik | Zielwert | Messmethode |
|--------|----------|-------------|
| Neue Prompts pro Woche | mind. 10 | Datenbankabfrage nach Einreichungsdatum |
| Nutzungsrate (Klick „Benutzt") | mind. 30 % der Prompts werden mindestens 1x benutzt | Verhältnis Prompts mit usageCount > 0 zu Gesamtzahl |
| Sucherfolg | Nutzer finden innerhalb von 2 Minuten einen passenden Prompt | Nutzerumfrage / qualitative Beobachtung |

---

## Änderungshistorie

| Version | Datum | Änderung | Genehmigt von |
|---------|-------|----------|---------------|
| 1.0 | 2026-04-22 | Erstversion | PromptArena Team |
| 1.1 | 2026-07-16 | CR-004: BAC-02-008 (Nutzer erstellen Kategorien), „Nicht im Scope" präzisiert | bernoron |

---

## Freigabe

- [ ] **PO-Freigabe**: ___________________________ Datum: ___________
- [ ] **BA-Review**: ___________________________ Datum: ___________
