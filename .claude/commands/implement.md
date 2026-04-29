Implementiere den nächsten offenen Task aus `specs/tasks.md`.

Falls `$ARGUMENTS` eine AC-ID (z.B. `AC-05-003`) oder einen Task-Namen angibt, implementiere diesen spezifischen Task.

---

## Schritt 0: Change-Request-Prüfung (PFLICHT)

**Bevor du irgendeinen Code schreibst oder eine Spec änderst:**

1. Zu welchem Feature gehört dieser Task? (aus AC-ID ableiten: AC-05-NNN → Feature 05)
2. Hat dieses Feature eine approved Spec (`specs/technical/`)?
3. Gibt es einen offenen CR für dieses Feature in `specs/changes/`?

```
ls specs/changes/CR-*.md 2>/dev/null | xargs grep -l "Feature.*[NN]" 2>/dev/null
```

**Wenn CR vorhanden UND Status NICHT 'approved':**
```
⛔ BLOCK: Feature [NN] hat einen offenen Change Request (CR-NNN).
   Status: [aktueller Status]
   Benötigt: approved
   Aktion: /approve-change CR-NNN aufrufen
```

**Wenn KEIN CR vorhanden, aber Änderung an bestehender approved Spec nötig:**
```
⛔ BLOCK: Änderung an Feature [NN] erfordert einen Change Request.
   Aktion: /change-request [Feature-Name] [Beschreibung der Änderung]
```

**Ausnahmen (kein CR nötig):**
- Task gehört zu einem noch nicht implementierten Feature (tasks.md Status: alles `[ ]`)
- Task ist ein Bugfix der das dokumentierte Verhalten NICHT ändert
- Task referenziert ein CR das bereits `approved` ist

---

## Schritt 1: Specs lesen

1. **Feature-Spec**: Finde die Spec für den Task
   - `specs/technical/NN-feature.md`
2. **Business-Spec** (falls vorhanden): `specs/business/NN-feature.md` — für Kontext
3. **constitution.md**: Diese Regeln gelten immer
4. **Relevante bestehende Dateien** (immer vor dem Bearbeiten lesen)

---

## Schritt 1b: Ripple-Analyse (PFLICHT bei Wert- oder Konstanten-Änderungen)

Wenn der Task einen Wert ändert der in der UI angezeigt wird (Punkte, Labels, Schwellenwerte):

```bash
# Suche ALLE Vorkommen des alten Werts im gesamten Projekt
grep -rn "<alter-wert>" app/ components/ --include="*.tsx" --include="*.ts"
```

**Regel**: Erst wenn alle Fundstellen bekannt sind, mit der Implementierung beginnen.  
Jede Fundstelle muss entweder:
- auf die Konstante umgestellt werden (`POINTS.XXXX`)
- oder bewusst ausgenommen und dokumentiert sein

> ⚠️ Einen Wert in `lib/points.ts` oder `lib/constants.ts` zu ändern reicht **nicht** —  
> es muss sichergestellt sein, dass nirgendwo hardcodierte Kopien existieren.

---

## Schritt 2: Implementieren

- Schreibe den Code der das Akzeptanzkriterium erfüllt
- Füge `// @spec AC-XX-NNN` Kommentar an die Stelle im Code die das AC implementiert
- Halte dich an alle constitution.md-Regeln (Zod, Rate-Limit, kein any, etc.)
- **Einen Task auf einmal** — nicht mehrere ACs gleichzeitig

---

## Schritt 3: Verifizieren

- Prüfe ob alle ACs des Tasks erfüllt sind
- `node scripts/spec-sync.mjs` ausführen

---

## Schritt 4: Dokumentieren

- Setze `- [x]` in `specs/tasks.md`
- Wenn Task zu einem CR gehört: AC-Checkbox im CR auf `[x]` setzen
- Wenn alle CR-Tasks erledigt: CR-Status auf `implemented` setzen

---

## Schritt 5: Zusammenfassung

Zeige:
- Geänderte Dateien
- Erfüllte ACs
- spec-sync Ergebnis
- Ob noch offene Tasks im selben CR/Feature vorhanden sind
