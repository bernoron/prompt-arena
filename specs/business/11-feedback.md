---
status: approved
---

# Nutzer-Feedback – What We're Building

> **Für Product Owner & Business Analysts**
> Kein Tech-Jargon. Nur das Problem, die Lösung und wie wir wissen, dass es funktioniert.

---

## The Problem

Nutzer haben keine Möglichkeit, schnell Feedback zu geben. Wenn etwas auffällt – ein Fehler, eine Idee, eine unklare Lektion – gibt es keinen einfachen Weg, das mitzuteilen. Komplexe Formulare schrecken ab; Feedback geht verloren.

---

## Who Benefits?

**Mitarbeiter** können in Sekunden Feedback geben, ohne Unterbrechung. **Der Admin** bekommt strukturiertes, kontextgebundenes Feedback gesammelt und kann gezielt verbessern.

---

## Leitprinzip: So wenig Klicks wie möglich

> Der Nutzer soll innerhalb von **10 Sekunden** Feedback abschicken können.
> Kein Formular, das man ausfüllen muss. Ein Icon antippen, Text schreiben, senden.

---

## What Are We Building?

### 1. Floating Feedback-Button (überall)

Ein kleines schwebendes Icon (💬) ist auf **jeder Seite** sichtbar, unten rechts.

Klick darauf öffnet ein **kompaktes Popup**:
- Vier Kategorie-Icons zum Antippen: 🐛 Bug · 💡 Idee · ⭐ Lob · 🔧 Verbesserung
- Ein Textfeld (max. 500 Zeichen)
- Button „Absenden"

**Der Nutzer muss nichts anderes tun.** Die App erfasst automatisch im Hintergrund, auf welcher Seite er war, und – falls er eine Lektion oder einen Prompt offen hatte – welche genau.

### 2. Lektions-Feedback (eingebettet, reibungslos)

Am Ende jeder Lernlektion, direkt unter dem Inhalt, erscheint:

> „War diese Lektion hilfreich?" **👍 Ja** · **👎 Nein**

Ein Klick reicht. Kein Popup, kein Formular. Optional erscheint danach ein kleines Textfeld: „Möchtest du uns mehr sagen?" – aber das ist optional, nicht verlangt.

### 3. Neues Lernthema vorschlagen

Auf der Lernübersichtsseite gibt es den Link „Thema vorschlagen". Klick öffnet ein Popup mit einem einzigen Textfeld: „Welches Thema fehlt dir?" — Absenden fertig.

### 4. Admin-Panel: Feedback-Verwaltung

Im Admin-Panel gibt es zwei neue Bereiche:

**„Feedback"**: Liste aller Rückmeldungen mit Kategorie, Text, Nutzer, Datum und automatisch erfasstem Kontext (Seite / Lektion / Prompt). Filterbar, als erledigt markierbar, löschbar.

**„Themenvorschläge"**: Liste aller Vorschläge. Admin kann Status setzen: offen / geplant / umgesetzt / abgelehnt.

---

## How Do We Know It Works? (BAC-11)

### Nutzer-Erlebnis (Einfachheit)
- [ ] **BAC-11-001** Der Feedback-Button ist auf jeder Seite sichtbar ohne zu scrollen
- [ ] **BAC-11-002** Das Feedback-Popup öffnet sich mit einem einzigen Klick
- [ ] **BAC-11-003** Der Nutzer kann Feedback absenden mit nur: 1× Kategorie antippen + Text schreiben + Absenden — keine weiteren Felder
- [ ] **BAC-11-004** Der Kontext (aktuelle Seite, ggf. Lektion oder Prompt) wird automatisch erfasst — der Nutzer muss nichts auswählen
- [ ] **BAC-11-005** Nach dem Absenden schliesst sich das Popup und der Nutzer sieht eine kurze Bestätigung
- [ ] **BAC-11-006** Nicht angemeldete Nutzer sehen keinen Feedback-Button

### Lektions-Feedback
- [ ] **BAC-11-007** Am Ende jeder Lektion erscheint „War diese Lektion hilfreich?" mit 👍/👎
- [ ] **BAC-11-008** Ein Klick auf 👍 oder 👎 reicht – kein weiterer Schritt nötig
- [ ] **BAC-11-009** Nach dem Klick erscheint optional ein Textfeld für mehr Details (nicht Pflicht)
- [ ] **BAC-11-010** Wer bereits bewertet hat, sieht seine Bewertung und kann sie ändern
- [ ] **BAC-11-011** Das Lektions-Feedback ist im Admin-Panel mit Modul- und Lektionsname verknüpft

### Themenvorschläge
- [ ] **BAC-11-012** Auf der Lernübersichtsseite gibt es „Thema vorschlagen"
- [ ] **BAC-11-013** Das Vorschlagsformular besteht aus einem einzigen Textfeld — kein weiteres Pflichtfeld
- [ ] **BAC-11-014** Vorschläge erscheinen im Admin-Panel getrennt vom allgemeinen Feedback

### Admin-Panel
- [ ] **BAC-11-015** Der Admin sieht alle Feedbacks mit Kategorie, Text, Nutzer, Datum und Kontext
- [ ] **BAC-11-016** Der Admin kann nach Kontext-Typ filtern: Allgemein / Lektion / Prompt
- [ ] **BAC-11-017** Der Admin kann Feedback als „erledigt" markieren oder löschen
- [ ] **BAC-11-018** Der Admin kann Themenvorschläge mit Status versehen: offen / geplant / umgesetzt / abgelehnt

---

## What's NOT in This Release?

- Keine E-Mail-Benachrichtigung bei neuem Feedback
- Keine öffentliche Anzeige von Feedback
- Keine Antwort-Funktion des Admins
- Kein Punkte-System für Feedback
- Kein Anhang oder Screenshots
- Keine Abstimmung auf Vorschläge durch andere Nutzer

---

## Review Checklist ✓

- [x] Nutzer-Erlebnis ist radikal einfach (≤ 3 Interaktionen zum Absenden)
- [x] Kontext wird automatisch erfasst — kein Aufwand für den Nutzer
- [x] Lektions-Feedback ist in einem Klick erledigt
- [x] Admin bekommt strukturierte, kontextgebundene Daten
- [x] Kein Tech-Jargon
- [x] Jeder BAC ist testbar
- [x] Nicht-in-Scope verhindert Missverständnisse
