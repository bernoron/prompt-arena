# /intake – Ein Prompt rein, eine freigabereife Spec-Änderung raus

Du bist der **Intake-Router**. Der Nutzer wirft dir eine formlose Anforderung, Idee oder Bug-Meldung
zu. Deine Aufgabe: sie in die richtige Spur des SDD-Workflows übersetzen, den passenden
**freigabereifen Entwurf** erzeugen — und **stoppen, bis der Nutzer freigibt**. Erst nach Freigabe
wird implementiert.

> **Goldene Regel:** `/intake` schreibt **niemals** Produktions-Code und ändert **niemals** eine
> `approved` Spec direkt. Es erzeugt nur Entwürfe/Anträge und legt sie zur Freigabe vor.

---

## Schritt 0 – Pflichtlektüre

Immer zuerst lesen:
1. `specs/constitution.md` — das Gesetz
2. `specs/non-functional.md` — NFR-Katalog (welche NFRs berührt die Anforderung?)
3. `specs/README.md` — Spec-Landschaft
4. `specs/changes/WORKFLOW.md` — CR-Regeln

Dann gezielt die vermutlich betroffenen Specs (`specs/business/`, `specs/technical/`).

---

## Schritt 1 – Klassifizieren

Entscheide **eine** Kategorie und begründe sie dem Nutzer in 1–2 Sätzen:

| Kategorie | Erkennungsmerkmal | Route |
|-----------|-------------------|-------|
| **A. Neues Feature** | Kein bestehendes `approved` Spec deckt es ab | → Schritt 2A |
| **B. Änderung an bestehendem Feature** | Berührt ein Feature mit `approved` Business-/Technical-Spec, Verhalten wird sichtbar anders | → Schritt 2B (CR **Pflicht**) |
| **C. Änderung an NFR** | Ändert ein Ziel in `specs/non-functional.md` | → Schritt 2B (CR, Feature = „NFR") |
| **D. Änderung an Pipeline / Automation** | Berührt CI/CD/Deploy/Release (`specs/technical/99-pipeline.md`, `.github/workflows/`) **oder** Doku-Generator/Git-Hooks/Spec-Sync (`specs/technical/98-automation.md`, `scripts/`, `.githooks/`) | → Schritt 2B (CR, Feature = „99 – Pipeline" bzw. „98 – Automation") |
| **E. Bugfix ohne Verhaltens-Änderung** | Code weicht von der Spec ab, Spec bleibt gültig | → Schritt 2C (kein CR) |

Im Zweifel zwischen A und B: **B wählen**, wenn irgendeine `approved` Spec betroffen ist — dann
werden die Änderungen an dieser bestehenden Spec via CR gemacht (Wunsch des Nutzers).

Bei mehreren betroffenen Bereichen: nach Möglichkeit **ein** übergeordneter Entwurf; wenn wirklich
getrennt, mehrere Anträge anlegen und dem Nutzer die Aufteilung erklären.

---

## Schritt 2A – Neues Feature

1. Rufe die Logik von `/specify-business` auf: erzeuge `specs/business/NN-feature.md` (Status `draft`),
   nächste freie Nummer aus `specs/tasks.md`.
2. Verweise im Business-Spec-Abschnitt „Rahmenbedingungen" auf die berührten **NFR-IDs**.
3. **Noch keine** Technical-Spec, **kein** Code.

Vorlage-Skills als Bausteine: `/specify-business`, danach (nach PO-Freigabe) `/specify-tech`.

---

## Schritt 2B – Änderung (CR-Pflicht: Fälle B, C, D)

1. Ermittle die nächste CR-Nummer (`ls specs/changes/CR-*.md | sort | tail -1`).
2. Erzeuge `specs/changes/CR-NNN-kurztitel.md` nach `specs/changes/_template.md` mit der Logik von
   `/change-request`:
   - Problembeschreibung + gewünschtes Verhalten in Alltagssprache
   - Tabelle **Betroffene Specs** mit konkreten BAC-/AC-/NFR-IDs (neu / geändert / entfernt)
   - **Impact-Analyse** selbst ausfüllen (Dateien, DB-Migration?, Breaking Change?, Aufwand)
   - Status startet auf `impact-assessed`
3. Für Fall **C** (NFR) ist die betroffene Spec `specs/non-functional.md`; für Fall **D** die
   `specs/technical/99-pipeline.md` (Pipeline) bzw. `specs/technical/98-automation.md` (Doku-Generator/
   Hooks/Spec-Sync) **und** die betroffenen Workflow-/Script-/Hook-Dateien in der Impact-Analyse.
4. **Specs und tasks.md NICHT ändern**, **kein** Code — der CR ist nur der Antrag.

---

## Schritt 2C – Bugfix ohne Verhaltens-Änderung (Fall E)

1. Nenne die Spec + AC, deren dokumentiertes Verhalten der Fix **wiederherstellt** (nicht ändert).
2. Kein CR, keine Spec-Änderung nötig.
3. Lege dem Nutzer den Fix-Plan vor (Dateien + Testidee) und warte auf „ok".

---

## Schritt 3 – Zur Freigabe vorlegen (immer)

Gib eine kompakte Zusammenfassung aus:

- **Kategorie** (A–E) + 1-Satz-Begründung
- **Erzeugtes Artefakt** (Dateiname: Business-Spec / CR / Bugfix-Plan)
- **Betroffene Specs & IDs** (Tabelle)
- **Berührte NFRs** (IDs)
- **Freigabe** durch den Product Owner (einzige Freigabe-Instanz; keine separate Tech-Freigabe)
- **Nächster Schritt**, exakt einer:
  - Fall A: „Bitte Business-Spec prüfen und Status auf `approved` setzen, dann `/specify-tech NN`."
  - Fälle B/C/D: „Bitte `/approve-change CR-NNN approve`. Danach `/implement`."
  - Fall E: „Bitte den Fix-Plan mit ‚ok' bestätigen, dann setze ich ihn um."

Dann **anhalten**. Nicht implementieren, bis die Freigabe erfolgt ist.

---

## Nach der Freigabe

Wenn der Nutzer freigegeben hat, ruft er `/implement` (Fälle A–D) bzw. bestätigt den Plan (Fall E).
`/implement` prüft selbst, ob ein gültiges `approved` CR / Spec vorliegt, und blockiert sonst.
