# /specify-tech – Technische Spezifikation ableiten

Du bist ein Senior-Entwickler. Deine Aufgabe: aus einer genehmigten Business-Spec eine vollständige technische Spezifikation ableiten.

## Voraussetzung: Business-Spec muss approved sein

**Prüfe zuerst:**
1. Existiert `specs/business/NN-feature-name.md`?
2. Hat sie `Status: approved`?

Wenn nein → STOP. Gib aus:
```
❌ Technische Spec kann nicht erstellt werden.
   Business-Spec status ist "[aktueller Status]" — benötigt wird "approved".
   Bitte PO-Freigabe einholen und Status auf "approved" setzen.
```

## Pflichtlektüre vor dem Schreiben

Lese:
1. `specs/technical/_template.md`
2. `specs/constitution.md`
3. `specs/plan.md`
4. Die Business-Spec `specs/business/NN-feature-name.md`
5. Alle bestehenden technischen Specs in `specs/technical/` und `specs/features/` auf Überlappungen

## Ableitung: Business → Technisch

Für jeden BAC in der Business-Spec:
- Erstelle einen oder mehrere technische ACs (AC-NN-NNN)
- Verlinke jeden AC mit seinem BAC via `**Referenz**: BAC-NN-NNN`
- Ein BAC kann mehrere ACs haben (z.B. BAC → API + UI + Test)

## AC-ID Format

```
AC-[Feature-Nr zweistellig]-[Laufnummer dreistellig]
Beispiel: AC-10-001
```

## Was technische ACs definieren müssen

- [ ] Welche API-Route / welches Endpoint
- [ ] Welche Komponente / Seite
- [ ] Welche Validierung (Zod-Schema)
- [ ] Welche Tests (Unit / E2E)
- [ ] Welche DB-Änderungen (Prisma-Migration)

## Dateiname

`specs/technical/NN-feature-name.md`

(gleiche Feature-Nr wie Business-Spec)

## Metadaten-Feld aktualisieren

In `specs/business/NN-feature-name.md` das Feld „Technische Spec" aktualisieren:
```
- **Technische Spec**: `specs/technical/NN-feature-name.md`
```

## Status setzen

Nach dem Schreiben: Status = `draft`

Der Tech Lead / Senior Dev muss Status auf `approved` setzen bevor `/implement` Tasks erstellen darf.

## tasks.md aktualisieren

Füge eine neue Feature-Sektion in `specs/tasks.md` ein:
```markdown
## Feature NN – [Name] (NN-feature-name.md)

- [ ] AC-NN-001: [Beschreibung]
- [ ] AC-NN-002: [Beschreibung]
```

## Abschluss

Zeige:
- Dateiname der erstellten Tech-Spec
- Mapping: BAC-NN-NNN → AC-NN-NNN (tabellarisch)
- Nächster Schritt: „Tech-Spec-Review und Status auf 'approved' setzen, dann /plan aufrufen"
