Lese zuerst `specs/constitution.md` und alle bestehenden `specs/features/*.md` um den Kontext zu verstehen.

Der User beschreibt ein neues Feature oder eine Änderung: $ARGUMENTS

Erstelle oder aktualisiere die passende Feature-Spec-Datei unter `specs/features/` nach folgenden Regeln:

1. **Dateiname**: `XX-kebab-name.md` (XX = nächste freie Nummer, oder bestehende Datei wenn Feature schon existiert)
2. **Vorlage**: Folge exakt dem Schema aus `specs/features/_template.md`
3. **Status**: Setze Status auf `draft`
4. **AC-IDs**: Jedes Akzeptanzkriterium bekommt eine stabile ID `AC-XX-NNN` (dreistellig, z.B. `AC-08-001`)
5. **API-Vertrag**: Beschreibe alle neuen/geänderten Endpunkte präzise mit Request/Response-Shape
6. **Datenmodell**: Beschreibe alle Prisma-Änderungen (neue Felder, neue Modelle, neue Indizes)
7. **Punkte-Impact**: Wenn das Feature Punkte berührt, dokumentiere Aktion → Punkte → Empfänger
8. **Tests**: Mindestens 1 E2E-Happy-Path und 1 Edge-Case beschreiben

Halte dich strikt an die Regeln aus `constitution.md`.

Nach dem Schreiben der Spec: Gib eine kurze Zusammenfassung der wichtigsten Entscheidungen aus.

**Nächster Schritt**: Führe `/plan` aus um den technischen Plan zu erstellen und tasks.md zu aktualisieren.
