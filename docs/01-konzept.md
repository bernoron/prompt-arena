# Konzept & Anforderungen

## 1. Konzept

### Idee
PromptArena ist eine öffentliche Webanwendung für alle, die ihr Wissen rund um KI-Prompts
teilen möchten. Ziel ist es, den Wissensaustausch rund um effektive KI-Nutzung zu fördern –
durch Gamification, soziale Interaktion und einfachen Zugang zu bewährten Prompts.

### Problem
Nutzer:innen entwickeln wertvolle KI-Prompts für ihren Alltag, teilen diese aber kaum
mit anderen. Das Wissen bleibt verstreut, Arbeit wird doppelt gemacht und
das KI-Potenzial wird nicht ausgeschöpft.

### Lösung
Eine zentrale Prompt-Bibliothek mit Gamification-Elementen (Punkte, Level, Leaderboard,
wöchentliche Challenges) motiviert zur aktiven Teilnahme und macht das Teilen von Prompts
spass­bringend und sichtbar.

---

## 2. Nutzen

### Für Nutzer:innen
- Zugang zu bewährten Prompts für alle Anwendungsbereiche
- Sichtbarkeit der eigenen Beiträge durch Rangliste und Profilseite
- Motivation durch Punkte, Level und wöchentliche Challenges
- Zweisprachige Prompts (Deutsch / Englisch)

### Für die Plattform
- Strukturiertes Wissensmanagement für KI-Nutzung
- Messbarer Fortschritt bei der KI-Adoption der Community
- Bottom-up Wissenstransfer ohne redaktionellen Overhead
- Förderung einer aktiven, KI-affinen Community

---

## 3. Use Cases

### UC-01: Prompt suchen und nutzen
**Akteur:** Nutzer:in
**Ablauf:**
1. Öffnet die Bibliotheksseite (/library)
2. Filtert nach Kategorie oder sucht per Freitext
3. Öffnet einen Prompt
4. Kopiert den Prompt-Text in die Zwischenablage
5. Bestätigt die Nutzung → Autor erhält +5 Punkte

### UC-02: Neuen Prompt einreichen
**Akteur:** Nutzer:in
**Ablauf:**
1. Öffnet die Einreich-Seite (/submit)
2. Füllt Titel, Prompt-Text, Kategorie und Schwierigkeit aus (DE obligatorisch, EN optional)
3. Verknüpft optional mit der aktiven Wochen-Challenge
4. Klickt «Einreichen» → +20 Punkte, optional +30 für Challenge

### UC-03: Prompt bewerten
**Akteur:** Nutzer:in
**Ablauf:**
1. Öffnet einen Prompt in der Bibliothek
2. Vergibt 1–5 Sterne
3. Bewertung wird gespeichert → +3 Punkte (nur beim ersten Bewerten)

### UC-04: Rangliste einsehen
**Akteur:** Nutzer:in
**Ablauf:**
1. Öffnet /leaderboard
2. Sieht Top 10 + Podium für Top 3
3. Findet eigene Position (auch ausserhalb Top 10 angezeigt)

### UC-05: Eigenes Profil verwalten
**Akteur:** Nutzer:in
**Ablauf:**
1. Öffnet /profile
2. Sieht eigene Punkte, Level, XP-Fortschrittsbalken
3. Findet alle eigenen Prompts mit Bewertungen
4. Sieht erreichbare Badges und aktuellen Rang

### UC-06: An Wochen-Challenge teilnehmen
**Akteur:** Nutzer:in
**Ablauf:**
1. Sieht die aktive Challenge auf dem Dashboard (/dashboard)
2. Reicht einen Prompt über /submit ein und verknüpft ihn mit der Challenge
3. Erhält +30 Zusatzpunkte bei Einreichung, +100 bei Gewinn

### UC-07: Nutzer registrieren
**Akteur:** Neue:r Nutzer:in
**Ablauf:**
1. Öffnet die Registrierungsseite
2. Gibt Name, E-Mail und Passwort ein
3. Wird als «Prompt-Lehrling» angelegt und automatisch eingeloggt

---

## 4. Funktionale Anforderungen

| ID | Anforderung | Priorität |
|---|---|---|
| FA-01 | Nutzer:innen können Prompts erstellen, kategorisieren und veröffentlichen | Muss |
| FA-02 | Jeder Prompt kann eine deutsche und englische Version haben (EN optional) | Muss |
| FA-03 | Prompts sind nach Kategorie und per Freitext filterbar | Muss |
| FA-04 | Bewertungen von 1–5 Sternen sind pro Nutzer und Prompt möglich | Muss |
| FA-05 | Punkte werden automatisch für definierte Aktionen vergeben | Muss |
| FA-06 | Level werden anhand kumulierter Punkte automatisch aktualisiert | Muss |
| FA-07 | Eine globale Rangliste zeigt alle Nutzer nach Punkten sortiert | Muss |
| FA-08 | Jede Woche kann eine Challenge mit Bonus-Punkten aktiviert sein | Soll |
| FA-09 | Prompts können als «genutzt» markiert werden (Autor erhält Punkte) | Soll |
| FA-10 | Das Profil zeigt eigene Prompts, Punkte und Fortschritt | Soll |
| FA-11 | Profilbild als farbiger Avatar (automatische Farbzuweisung) | Kann |

---

## 5. Nichtfunktionale Anforderungen

| ID | Anforderung | Messgrösse |
|---|---|---|
| NFA-01 | **Performance** – Seiten laden schnell | Erste Renderzeit < 2 s |
| NFA-02 | **Usability** – Bedienbar ohne Schulung | Neue Nutzer finden Kernfunktionen innerhalb 2 Minuten |
| NFA-03 | **Responsiveness** – Mobile-tauglich | Volle Funktionalität auf Smartphones (min. 375 px) |
| NFA-04 | **Sicherheit** – Eingaben validiert | Alle API-Inputs durch Zod-Schemas validiert |
| NFA-05 | **Sicherheit** – Security Headers | CSP, X-Frame-Options, Referrer-Policy auf jeder Antwort |
| NFA-06 | **Verfügbarkeit** | 99 % Uptime |
| NFA-07 | **Wartbarkeit** – Einfache Erweiterung | Neue Kategorie in einer Datei ergänzbar (lib/constants.ts) |
| NFA-08 | **Internationaliserung** – Zweisprachigkeit | UI Deutsch, Prompts optional auch Englisch |
| NFA-09 | **Rate Limiting** – Schutz vor Missbrauch | Max. 30 Schreib- / 120 Leseanfragen pro Minute und IP |
| NFA-10 | **Datenintegrität** – Eindeutige Constraints | Ein Vote pro Nutzer/Prompt via DB-Unique-Constraint |



---
*Automatisch generiert am 03.07.2026, 05:46 · [Quellcode](https://github.com/your-org/prompt-arena)*
