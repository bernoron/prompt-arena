Führe den bidirektionalen Spec↔Code Sync aus.

**Modus:** $ARGUMENTS (leer = Status anzeigen, "fix" = tasks.md aktualisieren, "watch" = kontinuierlich)

```bash
node scripts/spec-sync.mjs $ARGUMENTS
```

**Was der Sync prüft:**

1. **Code → Spec** (Annotationen): Scannt alle `.ts`/`.tsx`-Dateien nach `// @spec AC-XX-NNN` Kommentaren
2. **Spec → Code**: Prüft ob jedes `[x]`-markierte AC auch eine `@spec`-Annotation im Code hat
3. **Waisenkinder**: `@spec`-Kommentare die keine entsprechende Spec-AC haben

**Ergebnis-Interpretation:**
- `✓ Implementiert`: AC hat Annotation im Code + Spec markiert ✓
- `⚠ Spec done aber kein @spec`: Spec sagt fertig, aber Code-Annotation fehlt → Annotation nachrüsten
- `✗ Nicht implementiert`: AC offen, kein Code → `/implement AC-XX-NNN` aufrufen
- `? Waisenkind`: Code-Annotation ohne Spec → Spec aktualisieren oder Annotation entfernen

**Mit --fix:**
Aktualisiert automatisch `specs/tasks.md` für alle ACs die `@spec`-Annotationen haben.

**Empfehlung nach `/implement`:** Immer `/sync fix` ausführen um tasks.md aktuell zu halten.
