Lese `specs/tasks.md` und zeige den aktuellen Stand übersichtlich:

1. **Offene Tasks** (- [ ]): Nach Feature gruppiert, nächster empfohlener Task markiert mit ⟶
2. **In Arbeit** (- [~]): Falls vorhanden
3. **Erledigte Tasks** (- [x]): Nur Anzahl pro Feature, keine Details
4. **Fortschrittsbalken** pro Feature und insgesamt

Führe dann `node scripts/spec-sync.mjs` aus um den Code-Annotationen-Status zu zeigen.

Falls `$ARGUMENTS` einen Feature-Namen enthält, zeige nur Tasks dieses Features.

**Nächster Schritt**: Führe `/implement` aus um mit dem nächsten offenen Task zu beginnen.
