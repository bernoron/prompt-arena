# Change Management – Workflow

## Grundprinzip

> Jede Änderung an einem **bestehenden, freigegebenen Feature** braucht ein genehmigtes Change Request (CR).
> Neue Features folgen dem normalen SDD-Workflow (kein CR nötig).
>
> **Ebenfalls CR-pflichtig:** Änderungen am NFR-Katalog (`specs/non-functional.md`) und an der
> Pipeline-Spec (`specs/technical/99-pipeline.md` inkl. `.github/workflows/`).
>
> **Einstieg:** `/intake <anforderung>` klassifiziert automatisch und erzeugt bei Änderungen den CR.

---

## Status-Übergänge

```
proposed
    │
    │  /change-request → Impact-Analyse wird ergänzt
    ▼
impact-assessed
    │
    │  Product Owner prüft und gibt frei
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

## Wer genehmigt?

Es gibt genau **eine** Freigabe-Instanz: den **Product Owner** (die Projektverantwortliche:n).
Eine separate Tech-Freigabe existiert nicht — jede Änderung braucht die PO-Freigabe, egal ob
fachlich oder technisch.

| Änderungstyp | Freigabe durch |
|-------------|----------------|
| Business-Logik ändert sich | Product Owner |
| Rein technisch (Refactoring, Performance) | Product Owner |
| Breaking Change | Product Owner |
| Bugfix (kein Behavior-Change) | Product Owner |
| NFR-Katalog ändert sich | Product Owner |
| Pipeline / CI/CD / Automation ändert sich | Product Owner |

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
2. Hat das CR Status "approved"? → Pflicht (= PO-Freigabe erteilt)
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

CRs werden fortlaufend nummeriert. Vergeben: CR-001, CR-002, CR-003. Nächste freie Nummer: **CR-004**
(immer per `ls specs/changes/CR-*.md | sort | tail -1` verifizieren).

---

## Archiv

Abgelehnte (`rejected`) und abgeschlossene (`implemented`) CRs bleiben in `specs/changes/`
und werden nicht gelöscht — sie bilden die Entscheidungshistorie des Projekts.
