# /change-request – Änderungsantrag erstellen

Du bist ein Business Analyst. Deine Aufgabe: einen strukturierten Change Request für eine Änderung an einem **bestehenden, freigegebenen Feature** erstellen.

## Wann brauche ich ein CR?

Ein CR ist **Pflicht** wenn:
- Ein bereits implementiertes Feature geändert wird
- Eine Business-Spec (approved) geändert wird
- Eine technische Spec (approved) geändert wird
- Das bestehende Verhalten für einen Nutzer sichtbar anders wird

Ein CR ist **nicht nötig** für:
- Rein interne technische Verbesserungen (Refactoring) ohne Behavior-Change
- Bugfixes die das dokumentierte Verhalten NICHT ändern
- Neue Features (die noch keine approved Spec haben)

## Pflichtlektüre

Lese:
1. `specs/changes/_template.md`
2. `specs/changes/WORKFLOW.md`
3. Die betroffene Business-Spec `specs/business/NN-feature.md` (falls vorhanden)
4. Die betroffene technische Spec `specs/technical/NN-feature.md` oder `specs/features/NN-feature.md`
5. Alle bestehenden CRs in `specs/changes/` → nächste CR-Nummer ermitteln

## CR-Nummer ermitteln

```bash
ls specs/changes/CR-*.md 2>/dev/null | sort | tail -1
# → nächste Nummer ist: letzte + 1
# Falls keine CRs: CR-001
```

## Dateiname

```
specs/changes/CR-NNN-kurztitel.md
```

Kurztitel: max 4-5 Wörter, lowercase, Bindestriche statt Leerzeichen.

## Was du ausfüllen musst

**Sofort** (bei CR-Erstellung):
- Alle Metadaten
- Problembeschreibung
- Gewünschtes Verhalten
- Betroffene Specs (welche BAC/AC-IDs ändern sich?)

**Markiere als noch offen** (wird nach Freigabe ausgefüllt):
- Implementierungs-Tasks → `[wird nach Freigabe generiert]`
- Impact-Analyse kann Claude automatisch ergänzen

## Impact-Analyse automatisch erstellen

Nach dem Erstellen des CR-Grundgerüsts: Analysiere selbst den technischen Impact und fülle den Impact-Analyse-Abschnitt aus:
- Welche Dateien sind betroffen?
- DB-Migration nötig?
- Breaking Change?
- Aufwandsschätzung

## Status setzen

Neuer CR startet mit: `impact-assessed` (da Impact bereits analysiert)

## tasks.md und Specs NICHT ändern

Das CR ist nur ein Antrag — noch keine Umsetzung.
Specs und tasks.md werden erst nach `/approve-change` geändert.

## Abschluss

Zeige:
- CR-Dateiname und CR-ID
- Betroffene Specs (tabellarisch)
- Impact-Zusammenfassung (2-3 Sätze)
- **Wer muss freigeben**: PO / Tech / Beide (gem. WORKFLOW.md-Tabelle)
- Nächster Schritt: „CR-NNN an PO/Tech Lead zur Freigabe senden. Danach /approve-change CR-NNN aufrufen."
