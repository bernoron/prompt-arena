# Öffentliche Startseite – Was wir bauen

> **Für Product Owner & Business Analysts**
> Keine Tech-Begriffe. Nur Problem und Lösung.

---

## Das Problem

Wer die PromptArena-URL zum ersten Mal öffnet, landet direkt auf der Login-Seite. Es gibt
keine Erklärung, was PromptArena überhaupt ist, was man damit machen kann und warum es sich
lohnt, ein Konto anzulegen. Das schreckt neue, noch unentschlossene Besucher:innen ab, statt
Lust aufs Mitmachen zu machen.

---

## Wer profitiert?

Neue, noch nicht registrierte Mitarbeitende, die zum ersten Mal auf die PromptArena-URL
stossen — sei es über einen geteilten Link, eine interne Ankündigung oder Mundpropaganda.
Sie bekommen sofort einen Eindruck vom Nutzen, bevor sie sich entscheiden müssen, ein Konto
zu erstellen.

---

## Was bauen wir?

Eine öffentliche Startseite, die ohne Anmeldung sichtbar ist. Sie erklärt in wenigen Sätzen,
was PromptArena ist (eine Bibliothek für KI-Prompts mit Punkten, Levels und Rangliste) und
zeigt knapp die wichtigsten Dinge, die man dort tun kann. Als Appetitanreger zeigt die Seite
eine kleine, anonymisierte Auswahl der aktuell beliebtesten Prompts — ohne zu verraten, wer
sie eingereicht hat. Zwei gut sichtbare Buttons («Jetzt kostenlos starten» und «Anmelden»)
führen direkt zur Registrierung bzw. zum Login.

Wer bereits ein Konto hat und angemeldet ist, sieht diese Seite nicht — er landet beim
Aufruf der Startseite automatisch direkt im Dashboard.

---

## Wie wissen wir, dass es funktioniert?

**BAC-13-001** Ein anonymer Besuch der Startseite zeigt eine kurze, verständliche Erklärung,
was PromptArena ist und was man damit machen kann — ohne dass ein Login nötig ist.

**BAC-13-002** Die Startseite zeigt eine kleine Auswahl der beliebtesten Prompts, aber ohne
Namen oder sonstige Hinweise auf die Autor:innen.

**BAC-13-003** Die Startseite hat einen klar sichtbaren Button, der zur Registrierung führt,
und einen zweiten, der zum Login führt.

**BAC-13-004** Nutzer:innen, die bereits angemeldet sind, sehen beim Aufruf der Startseite
sofort ihr Dashboard statt der Werbeseite.

**BAC-13-005** Gibt es noch keine genutzten Prompts in der Bibliothek, zeigt die Startseite
trotzdem eine funktionierende, sinnvolle Seite (ohne leere oder kaputte Kachel-Reihe).

**BAC-13-006** *(CR-005, präzisiert durch CR-006 und CR-007)* Am unteren Ende der Startseite
sehen auch anonyme Besucher:innen einen "Neuigkeiten"-Bereich mit bis zu 10 deutschen
Ankündigungen echter, für Nutzer:innen sichtbarer Features — keine internen technischen
Änderungen (Refactorings, Migrationen, Security-Fixes) und keine automatisch aus
Commit-Messages generierten Texte. Jede Ankündigung stammt direkt aus der jeweiligen
Feature-Spec bzw. dem Change Request (ein optionales „Nutzer-Ankündigung"-Feld) — keine separat
gepflegte Liste.

**BAC-13-007** *(CR-005)* Gibt es (noch) keine Einträge, wird der Neuigkeiten-Bereich
ausgeblendet statt leer angezeigt — analog zu BAC-13-005.

---

## Was ist NICHT in diesem Release?

- Kein Marketing-Video oder Bilder-Karussell
- Keine Kunden-Testimonials oder Erfahrungsberichte
- Keine mehrsprachige Startseite (nur Deutsch, wie der Rest der App)
- Kein A/B-Testing verschiedener Varianten
- Keine Cookie-Consent-Bannerlogik (bestehende Datenschutz-Basis bleibt unverändert)

---

## Status

- **Status**: `approved`
- **Version**: 1.3
- **Datum**: 2026-07-17
- **PO**: bernoron
- **Technische Spec**: `specs/technical/13-landing-page.md`
- **Nutzer-Ankündigung**: 2026-07-06 | Neue öffentliche Startseite | Auch ohne Login siehst du jetzt, was PromptArena kann – inklusive einer anonymisierten Auswahl beliebter Prompts.

---

## Änderungshistorie

| Version | Datum | Änderung | Genehmigt von |
|---------|-------|----------|---------------|
| 1.0 | 2026-07-06 | Erstversion | bernoron |
| 1.1 | 2026-07-16 | CR-005: BAC-13-006/007 (Neuigkeiten-Bereich mit den 10 zuletzt gebauten Features) | bernoron |
| 1.2 | 2026-07-16 | CR-006: BAC-13-006 präzisiert — kuratierte, deutsche Texte statt automatisch aus CHANGELOG.md | bernoron |
| 1.3 | 2026-07-17 | CR-007: BAC-13-006 präzisiert — Ankündigungstexte kommen aus den Feature-Specs/CRs selbst statt aus einer separaten Code-Konstante | bernoron |
