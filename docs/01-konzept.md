# Konzept & Anforderungen

## 1. Konzept

### Idee
PromptArena ist eine interne Webanwendung für Mitarbeitende eines grossen Versicherungsunternehmens.
Ziel ist es, den unternehmensweiten Wissensaustausch rund um KI-Prompts zu fördern –
durch Gamification, soziale Interaktion und einfachen Zugang zu bewährten Prompts.

### Problem
Mitarbeitende entwickeln wertvolle KI-Prompts für ihren Arbeitsalltag, teilen diese aber kaum
mit Kolleginnen und Kollegen. Das Wissen bleibt in Silos, Arbeit wird doppelt gemacht und
das KI-Potenzial im Unternehmen wird nicht ausgeschöpft.

### Lösung
Eine zentrale Prompt-Bibliothek mit Gamification-Elementen (Punkte, Level, Leaderboard,
wöchentliche Challenges) motiviert zur aktiven Teilnahme und macht das Teilen von Prompts
spass­bringend und sichtbar.

---

## 2. Nutzen

### Für Mitarbeitende
- Zugang zu bewährten Prompts für alle Arbeitsbereiche
- Sichtbarkeit der eigenen Beiträge durch Rangliste und Profilseite
- Motivation durch Punkte, Level und wöchentliche Challenges
- Zweisprachige Prompts (Deutsch / Englisch)

### Für das Unternehmen
- Strukturiertes Wissensmanagement für KI-Nutzung
- Messbarer KI-Adoption-Fortschritt über Abteilungen hinweg
- Bottom-up Wissenstransfer ohne IT-Overhead
- Förderung einer KI-affinen Unternehmenskultur

---

## 3. Use Cases

### UC-01: Prompt suchen und nutzen
**Akteur:** Mitarbeitende/r
**Ablauf:**
1. Öffnet die Bibliotheksseite (/library)
2. Filtert nach Kategorie oder sucht per Freitext
3. Öffnet einen Prompt
4. Kopiert den Prompt-Text in die Zwischenablage
5. Bestätigt die Nutzung → Autor erhält +5 Punkte

### UC-02: Neuen Prompt einreichen
**Akteur:** Mitarbeitende/r
**Ablauf:**
1. Öffnet die Einreich-Seite (/submit)
2. Füllt Titel, Prompt-Text, Kategorie und Schwierigkeit aus (DE obligatorisch, EN optional)
3. Verknüpft optional mit der aktiven Wochen-Challenge
4. Klickt «Einreichen» → +20 Punkte, optional +30 für Challenge

### UC-03: Prompt bewerten
**Akteur:** Mitarbeitende/r
**Ablauf:**
1. Öffnet einen Prompt in der Bibliothek
2. Vergibt 1–5 Sterne
3. Bewertung wird gespeichert → +3 Punkte (nur beim ersten Bewerten)

### UC-04: Rangliste einsehen
**Akteur:** Mitarbeitende/r
**Ablauf:**
1. Öffnet /leaderboard
2. Sieht Top 10 + Podium für Top 3
3. Findet eigene Position (auch ausserhalb Top 10 angezeigt)
4. Sieht Abteilungsvergleich

### UC-05: Eigenes Profil verwalten
**Akteur:** Mitarbeitende/r
**Ablauf:**
1. Öffnet /profile
2. Sieht eigene Punkte, Level, XP-Fortschrittsbalken
3. Findet alle eigenen Prompts mit Bewertungen
4. Sieht erreichbare Badges und aktuellen Rang

### UC-06: An Wochen-Challenge teilnehmen
**Akteur:** Mitarbeitende/r
**Ablauf:**
1. Sieht die aktive Challenge auf dem Dashboard (/dashboard)
2. Reicht einen Prompt über /submit ein und verknüpft ihn mit der Challenge
3. Erhält +30 Zusatzpunkte bei Einreichung, +100 bei Gewinn

### UC-07: Nutzer registrieren
**Akteur:** Neue Mitarbeitende/r
**Ablauf:**
1. Öffnet die App erstmalig
2. Klickt auf den Nutzer-Picker oben rechts
3. Gibt Name und Abteilung ein
4. Wird als «Prompt-Lehrling» angelegt und direkt ausgewählt

---

## 4. Funktionale Anforderungen

| ID | Anforderung | Priorität |
|---|---|---|
| FA-01 | Mitarbeitende können Prompts erstellen, kategorisieren und veröffentlichen | Muss |
| FA-02 | Jeder Prompt kann eine deutsche und englische Version haben (EN optional) | Muss |
| FA-03 | Prompts sind nach Kategorie und per Freitext filterbar | Muss |
| FA-04 | Bewertungen von 1–5 Sternen sind pro Nutzer und Prompt möglich | Muss |
| FA-05 | Punkte werden automatisch für definierte Aktionen vergeben | Muss |
| FA-06 | Level werden anhand kumulierter Punkte automatisch aktualisiert | Muss |
| FA-07 | Eine globale Rangliste zeigt alle Nutzer nach Punkten sortiert | Muss |
| FA-08 | Jede Woche kann eine Challenge mit Bonus-Punkten aktiviert sein | Soll |
| FA-09 | Prompts können als «genutzt» markiert werden (Autor erhält Punkte) | Soll |
| FA-10 | Das Profil zeigt eigene Prompts, Punkte und Fortschritt | Soll |
| FA-11 | Abteilungsvergleich auf der Rangliste | Kann |
| FA-12 | Profilbild als farbiger Avatar (automatische Farbzuweisung) | Kann |

---

## 5. Nichtfunktionale Anforderungen

| ID | Anforderung | Messgrösse |
|---|---|---|
| NFA-01 | **Performance** – Seiten laden schnell | Erste Renderzeit < 2 s auf internem Netz |
| NFA-02 | **Usability** – Bedienbar ohne Schulung | Neue Nutzer finden Kernfunktionen innerhalb 2 Minuten |
| NFA-03 | **Responsiveness** – Mobile-tauglich | Volle Funktionalität auf Smartphones (min. 375 px) |
| NFA-04 | **Sicherheit** – Eingaben validiert | Alle API-Inputs durch Zod-Schemas validiert |
| NFA-05 | **Sicherheit** – Security Headers | CSP, X-Frame-Options, Referrer-Policy auf jeder Antwort |
| NFA-06 | **Verfügbarkeit** – Interne Verfügbarkeit | 99 % während Geschäftszeiten |
| NFA-07 | **Wartbarkeit** – Einfache Erweiterung | Neue Kategorie in einer Datei ergänzbar (lib/constants.ts) |
| NFA-08 | **Internationaliserung** – Zweisprachigkeit | UI Deutsch, Prompts optional auch Englisch |
| NFA-09 | **Rate Limiting** – Schutz vor Missbrauch | Max. 30 Schreib- / 120 Leseanfragen pro Minute und IP |
| NFA-10 | **Datenintegrität** – Eindeutige Constraints | Ein Vote pro Nutzer/Prompt via DB-Unique-Constraint |



---
*Automatisch generiert am 14.04.2026, 13:38 · [Quellcode](https://github.com/your-org/prompt-arena)*
