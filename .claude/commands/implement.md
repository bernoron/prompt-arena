Implementiere den nächsten offenen Task aus `specs/tasks.md`.

Falls `$ARGUMENTS` eine AC-ID (z.B. `AC-05-003`) oder einen Task-Namen angibt, implementiere diesen spezifischen Task.

**Workflow:**

1. **Lese die Spec**: Finde die Feature-Spec für den Task (z.B. AC-05-003 → `specs/features/05-favorites.md`)
2. **Lese `specs/constitution.md`**: Diese Regeln gelten immer
3. **Lese relevante bestehende Dateien** (immer vor dem Bearbeiten)
4. **Implementiere**:
   - Schreibe den Code der das Akzeptanzkriterium erfüllt
   - Füge `// @spec AC-XX-NNN` Kommentar an die Stelle im Code die das AC implementiert
   - Halte dich an alle constitution.md-Regeln (Zod, Rate-Limit, kein any, etc.)
5. **Verifiziere**: Prüfe ob alle ACs des Tasks erfüllt sind
6. **Markiere als erledigt**: Setze `- [x]` in `specs/tasks.md`
7. **Zeige Zusammenfassung**: Was wurde geändert, welche ACs sind jetzt erfüllt

**Wichtige Regeln:**
- Einen Task auf einmal — nicht mehrere ACs gleichzeitig
- Kein Code der nicht durch ein AC in der Spec gedeckt ist
- Wenn ein AC unklar ist: erst die Spec klären (mit /specify), dann implementieren

Nach der Implementierung: `node scripts/spec-sync.mjs` ausführen um den Sync-Status zu prüfen.
