# CR-006: Neuigkeiten-Bereich zeigt kuratierte, deutsche Feature-Texte statt roher Commit-Messages

## Metadaten
- **Status**: `implemented`
- **CR-ID**: CR-006
- **Feature**: 13 – Öffentliche Startseite (korrigiert CR-005)
- **Typ**: `enhancement`
- **Priorität**: `high`
- **Erstellt von**: Claude (Intake) im Auftrag von bernoron
- **Erstellt am**: 2026-07-16
- **Fällig bis**: keine Frist

---

## Problembeschreibung / Anlass

CR-005 (automatisch aus `CHANGELOG.md`) ist live, aber der Product Owner hat nach dem Blick auf
die echte Produktionsseite widersprochen: Die Texte sind zu kryptisch (rohe, englische
Commit-Messages wie „add PointsLedger to close a vote-award race condition") und der Abschnitt
mischt interne technische Umbauten mit echten, für Nutzer:innen sichtbaren Features. Das
widerspricht dem eigentlichen Zweck des Abschnitts (Vertrauen aufbauen, zeigen was **für die
Nutzer:innen** neu ist) und verletzt NFR-I18N-001 stärker als in CR-005 einkalkuliert.

---

## Gewünschtes Verhalten (nach der Änderung)

Der "Neuigkeiten"-Bereich zeigt weiterhin bis zu 10 Einträge, aber aus einer **kuratierten,
deutschen Liste** statt automatisch aus `CHANGELOG.md`. Nur echte, für Nutzer:innen sichtbare
Features werden aufgenommen (keine internen Refactorings, Migrationen, Security-Fixes o. ä.).
Jeder Eintrag hat Datum, kurzen Titel und optional einen erklärenden Satz — geschrieben wie ein
Produkt-Announcement, nicht wie eine Commit-Message.

**Pflegeprozess (Entscheidung PO):** Die Liste lebt als Code-Konstante (`lib/constants.ts`,
analog zu `ONBOARDING_STEPS`) — Entwickler ergänzen einen Eintrag, wenn sie ein
nutzer-sichtbares Feature bauen. Kein neues Datenmodell, keine Admin-UI (das wäre der deutlich
teurere Weg, hier explizit nicht gewählt).

---

## Betroffene Specs

### Business-Spec-Änderungen
| Spec-Datei | BAC-ID | Typ der Änderung |
|-----------|--------|-----------------|
| `specs/business/13-landing-page.md` | BAC-13-006 | geändert: „automatisch aus CHANGELOG.md" → „kuratierte, deutsche Liste, nur echte Nutzer-Features" |

### Technical-Spec-Änderungen
| Spec-Datei | AC-ID | Typ der Änderung |
|-----------|-------|-----------------|
| `specs/technical/13-landing-page.md` | AC-13-008 | geändert: `getRecentFeatures()`/`parseChangelogFeatures()` (CHANGELOG.md-Parsing) entfernt, ersetzt durch `RECENT_FEATURES`-Konstante in `lib/constants.ts` |
| `specs/technical/13-landing-page.md` | AC-13-009 | geändert: Rendering liest jetzt `RECENT_FEATURES` statt `getRecentFeatures()`; kein Scope-Badge mehr (kein Commit-Scope-Konzept mehr vorhanden) |
| `specs/technical/13-landing-page.md` | „Dokumentierte Ausnahme von NFR-I18N-001" | entfernt: Ausnahme nicht mehr nötig, Texte sind jetzt deutsch |

---

## Impact-Analyse

### Betroffene Komponenten
- [x] **API-Routes**: keine (unverändert, weiterhin kein neuer Endpunkt)
- [x] **Datenmodell / Datenbank**: keine Migration — Liste ist eine Code-Konstante, kein DB-Zugriff mehr nötig für diesen Abschnitt
- [x] **UI-Komponenten**: `app/page.tsx` liest `RECENT_FEATURES` direkt statt `getRecentFeatures(10)` aufzurufen; Scope-Badge aus dem Markup entfernt
- [x] **Entfernter Code**: `lib/services/changelog-service.ts` (CHANGELOG.md-Parsing, inkl. CRLF-Fix) wird gelöscht — nicht mehr gebraucht, da keine Datenquelle mehr im Dateisystem gelesen wird
- [x] **Tests**: `tests/unit/lib/changelog-service.test.ts` gelöscht (testete den jetzt entfernten Parser); neuer, einfacher Unit-Test prüft Invarianten der `RECENT_FEATURES`-Konstante (max. 10 Einträge, absteigend nach Datum sortiert, alle Titel non-empty); E2E-Test in `tests/e2e/spec-contracts.spec.ts` angepasst (prüft jetzt auf einen konkreten kuratierten Titel statt auf CHANGELOG-Inhalt)
- [ ] **Externe Abhängigkeiten**: keine

### Breaking Change?
- [ ] Ja
- [x] Nein — rein additiv/korrigierend, ersetzt nur die Datenquelle eines Abschnitts, der erst seit CR-005 (heute) live ist.

### Aufwandsschätzung
- **Klein (< 2h)** — Konstante schreiben, Rendering umstellen, alten Service+Tests entfernen, Tests anpassen.

---

## Implementierungs-Tasks

- [x] AC-13-008: `RECENT_FEATURES`-Konstante in `lib/constants.ts` (kuratiert, Deutsch, ≤ 10 Einträge, neueste zuerst)
- [x] AC-13-008: `lib/services/changelog-service.ts` + zugehöriger Unit-Test gelöscht
- [x] AC-13-008: neuer Unit-Test für `RECENT_FEATURES`-Invarianten
- [x] AC-13-009: `app/page.tsx` liest `RECENT_FEATURES` statt `getRecentFeatures()`, kein Scope-Badge mehr
- [x] AC-13-009: E2E-Test angepasst

---

## Freigabe

> Es gibt genau **eine** Freigabe-Instanz: den Product Owner / die Projektverantwortliche:n.

- [x] **Freigegeben**: bernoron (Product Owner) Datum: 2026-07-16 — Entscheidung "Konstante im Code" im Rahmen dieser Konversation getroffen
- [ ] **Abgelehnt** mit Begründung: ___________________________

---

## Änderungshistorie

| Datum | Autor | Änderung am CR |
|-------|-------|------------------|
| 2026-07-16 | Claude (Intake) | CR erstellt nach PO-Feedback zu CR-005 (kryptische/technische Texte auf Prod gesehen), Datenquellen-Entscheidung (Code-Konstante) direkt eingeholt und freigegeben |
| 2026-07-16 | Claude (Implement) | AC-13-008/009 umgesetzt (RECENT_FEATURES-Konstante, alter Service+Test entfernt, E2E/Unit-Tests angepasst), verifiziert, Status → `implemented` |
