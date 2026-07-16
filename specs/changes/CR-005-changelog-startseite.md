# CR-005: Startseite zeigt die 10 zuletzt gebauten Features

## Metadaten
- **Status**: `implemented`
- **CR-ID**: CR-005
- **Feature**: 13 – Öffentliche Startseite
- **Typ**: `enhancement`
- **Priorität**: `medium`
- **Erstellt von**: Claude (Intake-Router) im Auftrag von bernoron
- **Erstellt am**: 2026-07-16
- **Fällig bis**: keine Frist

---

## Problembeschreibung / Anlass

Die öffentliche Startseite (`specs/business/13-landing-page.md`, `approved`) erklärt heute nur,
*was* PromptArena kann — nicht, dass sich die App laufend weiterentwickelt. Neue und
unentschlossene Besucher:innen sehen keinen Hinweis darauf, wie aktiv das Produkt gepflegt wird.
Ein sichtbarer "Neuigkeiten"-Bereich mit den zuletzt gebauten Features soll Vertrauen schaffen und
zeigen, dass laufend investiert wird.

---

## Gewünschtes Verhalten (nach der Änderung)

Am unteren Ende der öffentlichen Startseite erscheint ein neuer Abschnitt "Neuigkeiten" (o.ä.),
der die **10 zuletzt gebauten Features** auflistet — sichtbar für **alle** Besucher:innen, auch
ohne Login. Jeder Eintrag zeigt mindestens einen kurzen, verständlichen Titel und optional ein
Datum. Gibt es (noch) keine Einträge, wird der Abschnitt ausgeblendet statt leer angezeigt
(analog zu BAC-13-005 beim Prompt-Showcase).

### Entscheidung Product Owner (2026-07-16)
**Option 1 gewählt: automatisch aus `CHANGELOG.md`.** Die Beschreibungstexte bleiben unübersetzt
(englisch/technisch, aus den Commit-Messages) — das ist eine bewusste, mit diesem CR
dokumentierte Ausnahme von NFR-I18N-001 (siehe `specs/technical/13-landing-page.md`, Abschnitt
„Dokumentierte Ausnahme von NFR-I18N-001"). Option 2 (manuell gepflegte, deutsche Liste) wurde
explizit abgelehnt, um keinen zusätzlichen Pflegeaufwand pro Release zu erzeugen.

**Ursprüngliche offene Frage (zur Nachvollziehbarkeit):** Woher stammen die 10 Einträge?

1. **Automatisch aus `CHANGELOG.md`** (wird bereits von Release-Please aus Conventional Commits
   generiert, siehe `specs/technical/99-pipeline.md`) — Vorteil: kein Pflegeaufwand, immer aktuell;
   Nachteil: Einträge sind Commit-Messages auf Englisch/technisch (z. B. "**onboarding:** add
   User.onboardingCompletedAt column") und verletzen ohne Nachbearbeitung NFR-I18N-001
   (UI-Texte auf Deutsch) — reine `feat:`-Commits müssten gefiltert und ggf. umformatiert werden.
2. **Manuell gepflegte Liste** (neue Konstante oder DB-Tabelle mit deutschem Anzeigetext,
   z. B. von PO/Admin gepflegt) — Vorteil: garantiert verständlicher, deutscher Text;
   Nachteil: zusätzlicher manueller Pflegeaufwand pro Release.

Empfehlung Claude: Option 1 (CHANGELOG.md) mit einer einfachen Filter-/Mapping-Regel für die
Anzeige, um Pflegeaufwand zu vermeiden — die Deutsch-Anforderung wird im Rahmen der Tech-Spec
gelöst (z. B. Scope-Präfix als Badge, Rest als Klartext, oder ein optionales
`displayLabel`-Override pro Commit). Product Owner entscheidet, welche Option verfolgt wird.

---

## Betroffene Specs

### Business-Spec-Änderungen
| Spec-Datei | BAC-ID | Typ der Änderung |
|-----------|--------|-----------------|
| `specs/business/13-landing-page.md` | BAC-13-006 (neu) | neu: „Startseite zeigt die 10 zuletzt gebauten Features, sichtbar ohne Login" |
| `specs/business/13-landing-page.md` | BAC-13-007 (neu) | neu: „Gibt es keine Einträge, wird der Neuigkeiten-Abschnitt ausgeblendet" |

### Technical-Spec-Änderungen
| Spec-Datei | AC-ID | Typ der Änderung |
|-----------|-------|-----------------|
| `specs/technical/13-landing-page.md` | AC-13-008 (neu) | neu: `getRecentFeatures()`/`parseChangelogFeatures()` in `lib/services/changelog-service.ts`, liest `CHANGELOG.md` |
| `specs/technical/13-landing-page.md` | AC-13-009 (neu) | neu: Rendering des "Neuigkeiten"-Abschnitts in `app/page.tsx` inkl. Leer-Zustand |

---

## Impact-Analyse

### Betroffene Komponenten
- [x] **API-Routes**: keine neue Route nötig — Daten werden serverseitig direkt in
  `app/page.tsx` geladen (analog zu `getTopPrompts()`, kein Self-Fetch-Roundtrip).
- [x] **Datenmodell / Datenbank**: **keine Migration nötig**, falls Option 1 (CHANGELOG.md)
  gewählt wird. Bei Option 2 (manuell gepflegte Liste) wäre ein neues Prisma-Modell
  (`FeatureAnnouncement` o. ä.) plus Migration nötig — abhängig von PO-Entscheidung.
- [x] **UI-Komponenten**: `app/page.tsx` erhält einen neuen Abschnitt unterhalb des bestehenden
  Prompt-Showcase; neue Server-Komponente für die Liste (kein Client-Code nötig, rein statisch
  gerendert wie der Rest der Seite).
- [x] **Tests**: neuer E2E-Test „Startseite zeigt Neuigkeiten-Abschnitt mit max. 10 Einträgen für
  anonyme Besucher:innen"; Edge-Case „keine Einträge vorhanden → Abschnitt wird nicht gerendert".
- [ ] **Externe Abhängigkeiten**: keine

### Breaking Change?
- [ ] Ja
- [x] Nein — rein additiv, bestehender Showcase-Bereich und Redirect-Logik für eingeloggte
  Nutzer:innen (BAC-13-004) bleiben unverändert.

### Aufwandsschätzung
- **Klein bis Mittel (2–6h)**, abhängig von der Datenquellen-Entscheidung. Option 1
  (CHANGELOG.md-Parsing + Cache) ist im unteren Bereich; Option 2 (neues Datenmodell + Admin-Pflege)
  am oberen Ende.

---

## Implementierungs-Tasks

- [x] AC-13-008: `lib/services/changelog-service.ts` — `getRecentFeatures()` + reine `parseChangelogFeatures()` (liest `CHANGELOG.md`, keine Migration, `cached()` mit 10-Min-TTL)
- [x] AC-13-008: Unit-Tests (`tests/unit/lib/changelog-service.test.ts`)
- [x] AC-13-009: "Neuigkeiten"-Abschnitt in `app/page.tsx` inkl. Leer-Zustand
- [x] AC-13-009: E2E-Test (`tests/e2e/spec-contracts.spec.ts`, Szenario BAC-13-006/007)

---

## Freigabe

> Es gibt genau **eine** Freigabe-Instanz: den Product Owner / die Projektverantwortliche:n.

- [x] **Freigegeben**: bernoron (Product Owner) Datum: 2026-07-16
- [ ] **Abgelehnt** mit Begründung: ___________________________

---

## Änderungshistorie

| Datum | Autor | Änderung am CR |
|-------|-------|------------------|
| 2026-07-16 | Claude (Intake) | CR erstellt, Impact-Analyse ausgefüllt, Datenquellen-Frage zur Freigabe vorgelegt |
| 2026-07-16 | bernoron | Freigegeben (`approved`); Option 1 (CHANGELOG.md) gewählt, NFR-I18N-001-Ausnahme akzeptiert |
| 2026-07-16 | Claude (Implement) | AC-13-008 + AC-13-009 umgesetzt, verifiziert (Unit + E2E), Status → `implemented` |
