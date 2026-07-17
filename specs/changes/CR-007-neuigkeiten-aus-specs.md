# CR-007: Neuigkeiten-Bereich liest Ankündigungstexte aus den Specs statt aus einer Code-Konstante

## Metadaten
- **Status**: `implemented`
- **CR-ID**: CR-007
- **Feature**: 13 – Öffentliche Startseite (löst CR-006 ab)
- **Typ**: `enhancement`
- **Priorität**: `medium`
- **Erstellt von**: Claude (Intake) im Auftrag von bernoron
- **Erstellt am**: 2026-07-17
- **Fällig bis**: keine Frist

---

## Problembeschreibung / Anlass

CR-006 löste das Kryptik-Problem (CR-005) durch eine handgepflegte `RECENT_FEATURES`-Konstante
in `lib/constants.ts`. Der Product Owner möchte diese doppelte Pflege vermeiden: Die Beschreibung
eines Features wird ohnehin schon in der Business-Spec bzw. im Change Request geschrieben (Spec
ist laut `specs/constitution.md` „die Wahrheit") — eine separate, zweite Textstelle nur für die
Startseite widerspricht diesem Prinzip und veraltet erfahrungsgemäss.

---

## Gewünschtes Verhalten (nach der Änderung)

Der "Neuigkeiten"-Bereich liest die Ankündigungstexte direkt aus den Spec-Dateien
(`specs/business/*.md`, `specs/changes/CR-*.md`) statt aus einer Code-Konstante. Ein neues,
**optionales** Feld `**Nutzer-Ankündigung**: <Datum> | <Titel> | <Text>` in einer Spec/einem CR
macht diese eine Zeile zum Startseiten-Eintrag. Fehlt das Feld (der Normalfall für interne
Specs/CRs wie Security-Fixes, Refactorings, oder diesen CR selbst), erscheint nichts — das
Opt-in-Prinzip erzwingt weiterhin „nur echte, für Nutzer:innen sichtbare Features", ganz ohne
manuelle Kuratierung an zweiter Stelle.

**Bewusst NICHT gewählt (Alternative geprüft):** Nur `specs/changes/CR-*.md` als Quelle — hätte
die Liste auf CR-002 bis CR-006 verkürzt und die meisten historischen Features (01–14, die vor
der CR-Pflicht gebaut wurden) ausgeblendet. PO hat sich für „Business-Specs **und** CRs" (beide
Quellen) entschieden.

---

## Betroffene Specs

### Business-Spec-Änderungen
| Spec-Datei | BAC-ID | Typ der Änderung |
|-----------|--------|-----------------|
| `specs/business/13-landing-page.md` | BAC-13-006 | geändert: „kuratierte Konstante" → „aus Spec-Dateien gelesen (`Nutzer-Ankündigung`-Feld)" |
| `specs/business/_template.md` | — | neu: optionaler Abschnitt „Nutzer-Ankündigung" für künftige Feature-Specs |

### Technical-Spec-Änderungen
| Spec-Datei | AC-ID | Typ der Änderung |
|-----------|-------|-----------------|
| `specs/technical/13-landing-page.md` | AC-13-008 | geändert: `RECENT_FEATURES`-Konstante entfernt, ersetzt durch `lib/services/feature-announcements-service.ts` (liest `specs/business/*.md` + `specs/changes/CR-*.md` zur Laufzeit, gecacht) |
| `specs/technical/13-landing-page.md` | AC-13-009 | unverändert im Verhalten, liest jetzt async vom neuen Service |
| `specs/changes/_template.md` | — | neu: optionales Metadaten-Feld „Nutzer-Ankündigung" |

---

## Impact-Analyse

### Betroffene Komponenten
- [x] **API-Routes**: keine
- [x] **Datenmodell / Datenbank**: keine Migration — weiterhin Datei-basiert, jetzt `specs/`
  statt `CHANGELOG.md`/Code-Konstante
- [x] **UI-Komponenten**: `app/page.tsx` liest wieder async (`await getRecentFeatureAnnouncements(10)`
  in `Promise.all`), Rendering selbst unverändert gegenüber CR-006
- [x] **Docker-Image**: `Dockerfile` (Runtime-Stage) bekommt eine neue Zeile
  `COPY --from=builder /app/specs ./specs` — Next.js' Standalone-Output-Tracing kann eine
  `readdir()`-basierte Verzeichnis-Iteration nicht statisch erkennen, die Specs müssen also
  explizit ins Runtime-Image kopiert werden (die Zeile spiegelt exakt das bereits bewährte Muster
  von `COPY --from=builder /app/lib ./lib` direkt darüber). **Lokaler `docker build` als
  Verifikation versucht, aber nicht möglich** — Docker Desktop kommt in dieser Sandbox nicht hoch
  (WSL2-Backend-VM `docker-desktop` bleibt „Stopped", vermutlich fehlende verschachtelte
  Virtualisierung). Verifikation stattdessen: (1) `.dockerignore` schliesst `specs/` nicht aus,
  also im Builder-Stage über `COPY . .` vorhanden; (2) `WORKDIR /app` + `CMD ["node","server.js"]`
  bleiben in der Runtime-Stage unverändert, `process.cwd()` ist also `/app`, identisch zu `./lib`;
  (3) Fehlerfall ist ungefährlich statt fatal — schlägt die Kopie fehl, liefert
  `getRecentFeatureAnnouncements()` `[]` (NFR-AVAIL-003), der Abschnitt wird nur unauffällig
  ausgeblendet, die App stürzt nicht ab. **Sofortige Kontrolle nach dem Deploy per `curl` gegen
  die echte Produktions-URL eingeplant** (gleiches Muster wie bei CR-005/006).
- [x] **Retrofit bestehender Specs**: 9 bereits `approved`/`implemented` Specs/CRs bekommen das
  neue Feld nachgetragen (reine Ergänzung, keine Verhaltens-/AC-Änderung an diesen Features):
  `08-learning-path.md`, `09-extended-learning.md`, `11-feedback.md`, `12-email-auth.md`,
  `13-landing-page.md`, `14-onboarding-funnel.md`, `CR-002`, `CR-003`, `CR-004`.
- [x] **Entfernter Code**: `RECENT_FEATURES` aus `lib/constants.ts` + zugehöriger Unit-Test-Block
  entfernt (ersetzt durch den neuen Service)
- [x] **Tests**: neuer Unit-Test für die reine Parsing-Funktion (`parseAnnouncement()`,
  CRLF-sicher wie schon bei CR-005 gelernt); E2E-Test unverändert in der Assertion (prüft
  weiterhin auf „Eigene Kategorien erstellen", jetzt aus `CR-004-user-kategorien-erstellen.md`
  statt aus `lib/constants.ts`)
- [ ] **Externe Abhängigkeiten**: keine

### Breaking Change?
- [ ] Ja
- [x] Nein — rein austauschende Änderung der Datenquelle für einen bestehenden, gerade erst
  gebauten Abschnitt (CR-005/CR-006), keine Auswirkung auf andere Features.

### Aufwandsschätzung
- **Mittel (2–4h)** — neuer Service + Tests, Dockerfile-Änderung (statisch verifiziert, lokaler
  `docker build` in dieser Sandbox nicht möglich), Retrofit von 9 Spec-Dateien, Template-Updates.

---

## Implementierungs-Tasks

- [x] AC-13-008: `lib/services/feature-announcements-service.ts` — `parseAnnouncement()` (pur) +
  `getRecentFeatureAnnouncements(limit)` (liest `specs/business/*.md` + `specs/changes/CR-*.md`,
  gecacht über `lib/cache.ts`)
- [x] AC-13-008: `Dockerfile` — `COPY --from=builder /app/specs ./specs` im Runtime-Stage
  (statisch verifiziert, `.dockerignore`/`WORKDIR` geprüft; `docker build` in dieser Sandbox
  nicht möglich, Absicherung über sofortige Produktions-Kontrolle nach dem Deploy)
- [x] AC-13-008: `**Nutzer-Ankündigung**`-Feld in 9 bestehenden Specs/CRs nachgetragen
- [x] AC-13-008: `specs/business/_template.md` + `specs/changes/_template.md` um das neue,
  optionale Feld ergänzt
- [x] AC-13-008: `RECENT_FEATURES` aus `lib/constants.ts` entfernt
- [x] AC-13-008: Unit-Test für `parseAnnouncement()`
- [x] AC-13-009: `app/page.tsx` auf den neuen async Service umgestellt
- [x] AC-13-009: E2E-Test verifiziert weiterhin einen konkreten Eintrag

---

## Freigabe

> Es gibt genau **eine** Freigabe-Instanz: den Product Owner / die Projektverantwortliche:n.

- [x] **Freigegeben**: bernoron (Product Owner) Datum: 2026-07-17 — Ansatz „Business-Specs + CRs,
  Laufzeit-Parser" im Rahmen dieser Konversation bestätigt
- [ ] **Abgelehnt** mit Begründung: ___________________________

---

## Änderungshistorie

| Datum | Autor | Änderung am CR |
|-------|-------|------------------|
| 2026-07-17 | Claude (Intake) | CR erstellt nach PO-Wunsch, Spec statt Code-Konstante als Quelle zu nutzen; Design-Entscheidung (Business-Specs + CRs, Laufzeit-Parser) direkt eingeholt und freigegeben |
| 2026-07-17 | Claude (Implement) | AC-13-008/009 umgesetzt, verifiziert (Unit + E2E + spec-sync); Dockerfile-Änderung statisch verifiziert statt per lokalem `docker build` (Docker Desktop startete in der Sandbox nicht), Absicherung über sofortige Produktions-Kontrolle nach dem Deploy; Status → `implemented` |
