# Einstiegs-Funnel für neue Nutzer:innen – Was wir bauen

> **Für Product Owner & Business Analysts**
> Keine Tech-Begriffe. Nur Problem und Lösung.

---

## Das Problem

Wer sich gerade registriert hat und zum ersten Mal einloggt, landet direkt auf dem Dashboard —
einer Seite voller Zahlen, Punkte und Menüpunkte, die für jemanden ohne Vorwissen keinen Sinn
ergeben. Niemand erklärt, was man in PromptArena eigentlich tun kann: Prompts finden und
benutzen, eigene einreichen, Punkte sammeln, Lernpfade durchgehen oder an Challenges
teilnehmen. Neue Nutzer:innen wissen nicht, wo sie anfangen sollen, und viele verlassen die
Plattform wieder, bevor sie den eigentlichen Nutzen entdeckt haben.

---

## Wer profitiert?

Neu registrierte Nutzer:innen, die sich gerade zum allerersten Mal einloggen. Sie bekommen in
wenigen Schritten einen schnellen Überblick über die Kernfunktionen der Plattform, bevor sie
auf sich allein gestellt weitermachen.

---

## Was bauen wir?

Direkt nach dem allerersten Login zeigt PromptArena eine kurze, geführte Einführung: eine
Abfolge von wenigen Karten/Schritten, die nacheinander die wichtigsten Dinge erklären, die man
in der Plattform tun kann — die Prompt-Bibliothek durchsuchen und Prompts benutzen, eigene
Prompts einreichen, durch Nutzung und Bewertung Punkte und Level sammeln, den Lernpfad
durchgehen und an Challenges teilnehmen. Jede Karte ist kurz (ein Bild oder Icon, ein bis zwei
Sätze) und über einen «Weiter»-Button erreicht man die nächste. Ein «Überspringen»-Link ist
jederzeit sichtbar, damit niemand zum Durchklicken gezwungen wird.

Am Ende der Einführung bekommt der Nutzer einen klaren nächsten Schritt vorgeschlagen (z. B.
«Jetzt die Prompt-Bibliothek entdecken» oder «Ersten Lernpfad starten») und landet danach im
normalen Dashboard.

Die Einführung wird jeder Nutzer:in nur automatisch beim ersten Login gezeigt — danach nie
wieder ungefragt. Wer sie später noch einmal ansehen möchte, findet dafür einen Link im
Hilfe-Bereich der Plattform.

---

## Wie wissen wir, dass es funktioniert?

**BAC-14-001** Beim allerersten Login nach der Registrierung sieht der Nutzer automatisch eine
kurze, mehrschrittige Einführung, bevor er das normale Dashboard sieht.

**BAC-14-002** Die Einführung erklärt in getrennten, kurzen Schritten mindestens: Prompt-
Bibliothek & Prompts benutzen, eigene Prompts einreichen, Punkte/Level/Rangliste, Lernpfad,
Challenges.

**BAC-14-003** Der Nutzer kann von jedem Schritt aus über einen «Überspringen»-Link die
gesamte Einführung sofort beenden und landet danach direkt im Dashboard.

**BAC-14-004** Der letzte Schritt der Einführung zeigt einen klaren Vorschlag für den
nächsten Klick (z. B. Link zur Prompt-Bibliothek oder zum Lernpfad).

**BAC-14-005** Schliesst der Nutzer die Einführung ab oder überspringt sie, wird sie bei
späteren Logins nicht mehr automatisch gezeigt.

**BAC-14-006** Bestehende Nutzer:innen, die sich vor Einführung dieses Features bereits
registriert haben, bekommen die Einführung nicht nachträglich aufgezwungen.

**BAC-14-007** Über einen Link im Hilfe-Bereich kann jede Nutzer:in die Einführung jederzeit
freiwillig erneut aufrufen.

**BAC-14-008** Die Einführung ist auf Desktop und auf Mobilgeräten vollständig nutzbar
(lesbar, Buttons erreichbar).

---

## Was ist NICHT in diesem Release?

- Keine interaktive Produkttour mit Hervorhebung einzelner Bedienelemente auf den echten
  Seiten (sogenannte „Coachmarks"/Spotlight-Tour) — die Einführung besteht aus eigenen
  Erklär-Karten, nicht aus Overlays auf der echten Oberfläche
- Keine Personalisierung der Einführung nach Rolle oder Interessen
- Keine Video-Inhalte oder Animationen, nur einfache Bilder/Icons und Text
- Kein A/B-Testing verschiedener Varianten der Einführung
- Keine E-Mail- oder Push-Erinnerungen, falls die Einführung übersprungen wurde

---

## Status

- **Status**: `approved`
- **Version**: 1.0
- **Datum**: 2026-07-07
- **PO**: bernoron
- **Technische Spec**: `specs/technical/14-onboarding-funnel.md`
