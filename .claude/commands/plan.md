Lese:
- `specs/constitution.md` (Regeln)
- `specs/plan.md` (Tech-Stack und Architektur)
- Die Feature-Spec die als Argument angegeben wurde, oder alle Specs mit `Status: draft` wenn kein Argument: $ARGUMENTS

Für jede relevante Feature-Spec tue Folgendes:

1. **Dateipfade identifizieren**: Welche Dateien müssen neu erstellt oder geändert werden?
   - API-Routen unter `app/api/`
   - Page-Komponenten unter `app/(user)/` oder `app/admin/`
   - Shared Components unter `components/`
   - Logik unter `lib/`

2. **Prisma-Änderungen planen**: Welche Migrations-Befehle sind nötig? (`npx prisma migrate dev --name ...`)

3. **Abhängigkeiten prüfen**: Welche anderen Features/ACs müssen vorher implementiert sein?

4. **tasks.md aktualisieren**: Füge neue Tasks für jedes AC des Features zu `specs/tasks.md` hinzu:
   ```
   - [ ] AC-XX-NNN: [Kurzbeschreibung] → [Datei(en)]
   ```

5. **Spec-Status aktualisieren**: Setze Status in der Feature-Spec auf `ready`

6. **Zusammenfassung ausgeben**: Zeige alle neuen Tasks die hinzugefügt wurden.

Halte dich an `constitution.md`. Kein Code schreiben — nur planen.

**Nächster Schritt**: Führe `/tasks` aus um den aktuellen Stand zu sehen, dann `/implement` um zu starten.
