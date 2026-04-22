# /specify – Feature-Spezifikation (Weiche)

Lese zuerst `specs/changes/WORKFLOW.md` um zu verstehen ob ein CR benötigt wird.

Der User beschreibt: $ARGUMENTS

## Entscheide welchen Weg du nimmst:

### Neues Feature?
→ Starte mit `/specify-business`: erstelle `specs/business/NN-feature.md`
   Danach (nach PO-Freigabe): `/specify-tech`

### Änderung an bestehendem Feature (approved Spec vorhanden)?
→ Starte mit `/change-request`: erstelle `specs/changes/CR-NNN-titel.md`
   Danach (nach Freigabe): `/approve-change` → dann `/implement`

### Bestehende Spec ergänzen (noch kein approved Status)?
→ Bearbeite direkt die Spec-Datei
   (Keine Freigabe nötig solange Status noch `draft`)

---

## Legacy-Features (specs/features/)

Die bestehenden Specs in `specs/features/` gelten als technische Specs (Layer 2).
Für Änderungen daran: `/change-request` starten.
Neue Business-Specs für diese Features können optional in `specs/business/` nachgepflegt werden.

---

## Zusammenfassung nach Ausführung

Zeige:
- Welche Aktion wurde gewählt (neues Feature / CR / direkte Änderung)
- Erstellte/geänderte Dateien
- Nächster Schritt im Workflow
