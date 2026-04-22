# Change Management – Workflow

## Grundprinzip

> Jede Änderung an einem **bestehenden, freigegebenen Feature** braucht ein genehmigtes Change Request (CR).
> Neue Features folgen dem normalen SDD-Workflow (kein CR nötig).

---

## Status-Übergänge

```
proposed
    │
    │  /change-request → Impact-Analyse wird ergänzt
    ▼
impact-assessed
    │
    │  PO + Tech Lead prüfen und diskutieren
    ▼
approved ──── rejected (Ende, CR archiviert)
    │
    │  /implement — Tasks werden generiert
    ▼
in-progress
    │
    │  Nach vollständiger Umsetzung + Tests
    ▼
implemented (Specs und Code-Annotationen aktualisiert)
```

---

## Wer genehmigt was?

| Änderungstyp | PO-Freigabe | Tech-Freigabe | Beide nötig? |
|-------------|-------------|---------------|-------------|
| Business-Logik ändert sich | ✅ Pflicht | ✅ Pflicht | Ja |
| Rein technisch (Refactoring, Performance) | optional | ✅ Pflicht | Nein (Tech reicht) |
| Breaking Change | ✅ Pflicht | ✅ Pflicht | Ja |
| Bugfix (kein Behavior-Change) | optional | ✅ Pflicht | Nein (Tech reicht) |

---

## Slash Commands

| Command | Was er tut |
|---------|-----------|
| `/change-request <feature> <beschreibung>` | Erstellt neues CR-Dokument mit Template |
| `/approve-change CR-NNN` | Setzt Status auf `approved`, gibt Tasks frei |
| `/implement` | Prüft ob betroffenes Feature ein offenes CR hat → blockiert wenn nein |

---

## Regeln für /implement

```
Vor jeder Änderung an specs/technical/ oder specs/business/:
1. Gibt es ein CR für dieses Feature? → Pflicht
2. Hat das CR Status "approved"? → Pflicht
3. Sind PO- UND Tech-Freigabe vorhanden (falls required)? → Pflicht
Sonst: BLOCK — kein Code, keine Spec-Änderung
```

**Ausnahmen** (kein CR nötig):
- Neue Features (noch kein approved Spec)
- Tasks in tasks.md die direkt zu einem approved CR gehören
- Bugfixes die NICHT das dokumentierte Behavior ändern

---

## CR-Dateiname

```
CR-NNN-kurztitel-mit-bindestrichen.md
```

Beispiele:
- `CR-001-sortierung-nach-beliebtheit.md`
- `CR-002-passwort-reset-flow.md`
- `CR-003-csv-export-leaderboard.md`

---

## CR-Nummerierung

CRs werden fortlaufend nummeriert. Nächste freie Nummer: **CR-001**

---

## Archiv

Abgelehnte (`rejected`) und abgeschlossene (`implemented`) CRs bleiben in `specs/changes/`
und werden nicht gelöscht — sie bilden die Entscheidungshistorie des Projekts.
