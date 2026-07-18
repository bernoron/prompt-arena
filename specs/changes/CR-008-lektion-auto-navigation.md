# CR-008: Automatische Navigation nach Lektionsabschluss

## Metadaten
- **Status**: `impact-assessed`
- **CR-ID**: CR-008
- **Feature**: 08 – Lernpfad
- **Typ**: `enhancement`
- **Priorität**: `medium`
- **Erstellt von**: Claude (im Auftrag des Product Owners, bernold@gmx.ch)
- **Erstellt am**: 2026-07-18
- **Fällig bis**: keine Frist

---

## Problembeschreibung / Anlass

Wenn ein Nutzer eine Lektion abschliesst, bleibt die Seite unverändert stehen — nur der Button
wird durch eine grüne Bestätigung ersetzt. Der Nutzer muss selbst nach unten scrollen und aktiv
auf „Nächste Lektion" in der Vor/Zurück-Leiste klicken, um weiterzulernen. Das wurde als
unerwartet holpriges Verhalten gemeldet: Nutzer erwarten nach Abschluss einer Lektion einen
nahtlosen Übergang zur nächsten.

---

## Gewünschtes Verhalten (nach der Änderung)

Nach erfolgreichem Abschluss einer Lektion zeigt das System kurz die bestehende Bestätigung
(„✅ Lektion abgeschlossen · +15 Punkte") inkl. Punkte-Animation, und navigiert danach
**automatisch** zur nächsten Lektion — auch modulübergreifend, exakt der Lektion, auf die der
bestehende „Nächste"-Link in der Vor/Zurück-Leiste zeigt (BAC-08-004 / AC-08-009). Gibt es keine
nächste Lektion mehr (letzte Lektion des letzten Moduls abgeschlossen), navigiert das System
stattdessen automatisch zur Lernübersicht (`/learn`), analog zum bestehenden Fallback der
Vor/Zurück-Leiste.

Die manuelle Vor/Zurück-Navigation (AC-08-006, AC-08-009) bleibt unverändert bestehen — z. B. für
Nutzer, die eine bereits abgeschlossene Lektion erneut aufrufen und manuell weiterblättern wollen.

---

## Betroffene Specs

### Business-Spec-Änderungen
| Spec-Datei | BAC-ID | Typ der Änderung |
|-----------|--------|-----------------|
| `specs/business/08-learning-path.md` | BAC-08-003 | geändert (Messgrösse ergänzt: automatische Weiterleitung) |

### Technical-Spec-Änderungen
| Spec-Datei | AC-ID | Typ der Änderung |
|-----------|-------|-----------------|
| `specs/technical/08-learning-path.md` | AC-08-008 | geändert (automatische Navigation nach Bestätigungsanzeige ergänzt) |

---

## Impact-Analyse

### Betroffene Komponenten
- [x] API-Routes: keine Änderung (POST `.../complete` bleibt unverändert)
- [x] Datenmodell / Datenbank: keine Migration nötig
- [x] UI-Komponenten: `app/(user)/learn/[moduleSlug]/[lessonSlug]/page.tsx` — `handleComplete` erhält
  nach erfolgreichem, nicht bereits abgeschlossenem Abschluss (`!data.alreadyCompleted`) einen
  verzögerten `router.push()` zu `next.moduleSlug/next.slug` bzw. zu `/learn` falls `next === null`.
  `LessonNav.tsx` und die übrigen Komponenten bleiben strukturell unverändert.
- [x] Tests: Neuer E2E-Test in `tests/e2e/` (bisher existiert keine `learning-path.spec.ts`, obwohl
  in der Tech-Spec als offen (`[ ]`) vorgesehen) — deckt automatische Weiterleitung sowie den
  Fallback zur Lernübersicht bei der letzten Lektion ab. Bestehende Tests referenzieren dieses
  Verhalten nicht und sind nicht betroffen.
- [x] Externe Abhängigkeiten: keine

### Breaking Change?
- [ ] Ja
- [x] Nein — reine UI-Verhaltensänderung, keine API-/Datenmodell-Änderung, kein bestehender Test
  verlässt sich auf das alte „Verweilen auf der Seite"-Verhalten.

### Aufwandsschätzung
- **Klein (< 2h)**
- Begründung: Änderung beschränkt sich auf `handleComplete` in einer bestehenden Client-Komponente
  (State ist bereits vorhanden: `lesson.next`, `moduleSlug`) plus Spec-Anpassung und ein neuer
  E2E-Test. Keine neuen Abhängigkeiten, kein Datenmodell-Impact.

---

## Implementierungs-Tasks

> Wird nach Freigabe von /implement generiert

- [ ] TASK-NNN: [wird nach Freigabe generiert]

---

## Freigabe

> Es gibt genau **eine** Freigabe-Instanz: den Product Owner / die Projektverantwortliche:n.

- [ ] **Freigegeben**: ___________________________ Datum: ___________
- [ ] **Abgelehnt** mit Begründung: ___________________________

---

## Änderungshistorie

| Datum | Autor | Änderung am CR |
|-------|-------|---------------|
| 2026-07-18 | Claude | CR erstellt, Impact-Analyse ergänzt |
