# /approve-change – Change Request freigeben oder ablehnen

Du verwaltest den Change-Request-Prozess. Deine Aufgabe: einen CR genehmigen oder ablehnen und die notwendigen Folgeschritte auslösen.

## Aufruf

```
/approve-change CR-NNN [approve|reject] [--po|--tech|--both]
```

Beispiele:
- `/approve-change CR-001 approve --both` → PO + Tech genehmigt
- `/approve-change CR-001 reject` → abgelehnt
- `/approve-change CR-001 approve --tech` → nur Tech genehmigt (PO noch ausstehend)

Wenn keine Argumente gegeben: lies den CR und frage interaktiv nach.

## Pflichtlektüre

Lese:
1. `specs/changes/CR-NNN-*.md` (den genannten CR)
2. `specs/changes/WORKFLOW.md` (wer muss freigeben)

## Bei APPROVE

### 1. CR-Status aktualisieren

Im CR-Dokument:
- Status → `approved`
- Freigabe-Checkboxen setzen: `[x]` mit Datum (heute: Systemdatum nutzen)

### 2. Specs aktualisieren

Für jeden neuen/geänderten BAC in der Business-Spec:
- `[ ]` → `[~]` (in Arbeit) wenn Status `approved`
- Neue BACs einfügen falls im CR beschrieben
- Neue ACs in der Technical-Spec einfügen

### 3. tasks.md aktualisieren

Für jeden neuen AC:
```markdown
- [ ] AC-NN-NNN: [Beschreibung aus Tech-Spec]
```

Für geänderte ACs: Status auf `[ ]` zurücksetzen mit Hinweis `(CR-NNN)`

### 4. Implementierungs-Tasks im CR generieren

```markdown
## Implementierungs-Tasks
- [ ] AC-NN-NNN: [Beschreibung]
- [ ] AC-NN-NNN: [Beschreibung]
```

### 5. Zusammenfassung ausgeben

```
✅ CR-NNN freigegeben
   Feature: [Name]
   Neue Tasks: N
   Geänderte Specs: [Liste]
   Nächster Schritt: /implement
```

---

## Bei REJECT

### 1. CR-Status aktualisieren

- Status → `rejected`
- Ablehnungsgrund in Freigabe-Sektion eintragen

### 2. KEINE Spec- oder Task-Änderungen

### 3. Zusammenfassung ausgeben

```
❌ CR-NNN abgelehnt
   Begründung: [aus dem CR]
   CR bleibt archiviert in specs/changes/
   Kein weiteres Handeln nötig.
```

---

## Sonderfall: Teilfreigabe

Wenn nur `--po` oder nur `--tech` angegeben:
- Entsprechende Checkbox setzen
- Status bleibt `impact-assessed` (noch nicht vollständig approved)
- Ausgabe: „Warte noch auf [Tech/PO]-Freigabe"
- Keine Spec-Änderungen bis beide Freigaben da sind (falls Workflow 'Beide nötig')
