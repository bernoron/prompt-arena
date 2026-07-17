# CR-004: Nutzer können beim Einreichen neue Kategorien erstellen

## Metadaten
- **Status**: `implemented`
- **CR-ID**: CR-004
- **Feature**: 02 – Prompt-Bibliothek (betrifft auch 07 – Admin-Panel, Kategorie-Verwaltung)
- **Typ**: `enhancement`
- **Priorität**: `medium`
- **Erstellt von**: Claude (Intake-Router) im Auftrag von bernoron
- **Erstellt am**: 2026-07-16
- **Fällig bis**: keine Frist
- **Nutzer-Ankündigung**: 2026-07-16 | Eigene Kategorien erstellen | Beim Einreichen eines Prompts kannst du jetzt direkt eine neue Kategorie anlegen, statt dich auf die bestehende Liste zu beschränken.

---

## Problembeschreibung / Anlass

Die Prompt-Kategorien (`Writing`, `Email`, `Analyse`, `Excel`, …) sind heute nur vom Admin
pflegbar (`POST /api/admin/categories`, geschützt durch Admin-Middleware). Nutzer können beim
Einreichen eines Prompts nur aus der bestehenden Liste wählen. Feedback aus der Community: die
vorgegebenen Kategorien sind zu starr und decken nicht alle Themen ab, für die Nutzer Prompts
einreichen möchten (z. B. Coding, Marketing, Recherche). Dadurch landen Prompts in einer
unpassenden Kategorie oder Nutzer verzichten ganz auf die Einreichung.

---

## Gewünschtes Verhalten (nach der Änderung)

Das Kategorie-Feld im Einreichungsformular wird von einer festen Auswahlliste zu einem
**freien Eingabefeld mit Live-Vorschlägen (Autocomplete/Combobox)**: Der Nutzer tippt einen
Kategorienamen; während der Eingabe werden passende **bestehende** Kategorien vorgeschlagen
(gefiltert nach Tippfortschritt, case-insensitiv). Wählt der Nutzer einen Vorschlag aus, wird die
bestehende Kategorie verwendet (kein Duplikat). Tippt er stattdessen einen Namen, der zu keiner
bestehenden Kategorie passt, und reicht den Prompt damit ein, wird beim Absenden automatisch eine
**neue Kategorie** angelegt. Diese ist danach sofort für alle Nutzer sichtbar und in Filter/Suche
nutzbar — genau wie eine vom Admin angelegte Kategorie. Der Admin behält die volle Kontrolle
(umbenennen/löschen via bestehendem `PATCH`/`DELETE /api/admin/categories/[id]`), falls eine
nutzer-erstellte Kategorie unpassend, doppelt oder missbräuchlich ist — das ist bereits das
etablierte Korrektiv-Muster dieses Projekts (vgl. R1 in `specs/business/02-prompt-library.md`:
Admin-Löschmöglichkeit als Korrektiv bei Prompt-Qualität).

**Nicht Teil dieses CRs:** Schwierigkeitsgrade (`Einstieg`/`Fortgeschritten`/`Profi`) bleiben fest
vorgegeben — nur Kategorien werden erweiterbar.

---

## Betroffene Specs

### Business-Spec-Änderungen
| Spec-Datei | BAC-ID | Typ der Änderung |
|-----------|--------|-------------------|
| `specs/business/02-prompt-library.md` | BAC-02-008 (neu) | neu: „Nutzer kann beim Einreichen eine neue Kategorie erstellen" |
| `specs/business/02-prompt-library.md` | Abschnitt „Nicht im Scope" | geändert: Zeile „Kategorien … frei definieren (keine offenen Freitextfelder)" wird entfernt/präzisiert auf Schwierigkeitsgrade |

### Technical-Spec-Änderungen
| Spec-Datei | AC-ID | Typ der Änderung |
|-----------|-------|-------------------|
| `specs/technical/02-prompt-library.md` | AC-02-013 (neu) | neu: `POST /api/categories` — authentifizierte Nutzer (kein Admin) legen eine Kategorie an |
| `specs/technical/02-prompt-library.md` | AC-02-014 (neu) | Submit-Formular: Kategorie-Auswahl wird Combobox (Freitext + Live-Vorschläge bestehender Kategorien) |
| `specs/technical/07-admin.md` | AC-07-009 (Kommentar) | keine Verhaltensänderung — Admin-Route bleibt zusätzlich bestehen, Hinweis ergänzen, dass Kategorien nun auch von Nutzern stammen können |

---

## Impact-Analyse

### Betroffene Komponenten
- [x] **API-Routes**:
  - `app/api/categories/route.ts` — bisher nur `GET`; neuer `POST`-Handler für authentifizierte
    Nutzer (Session-Check, **kein** `requireAdmin`), mit eigenem, engerem Zod-Schema (nur `label`
    Pflichtfeld; `slug` wird serverseitig aus `label` abgeleitet/dedupliziert; `icon`/`color`
    bekommen einen Default bzw. werden Round-Robin vergeben, analog zum bestehenden Muster
    `AVATAR_COLORS` in `lib/constants.ts`).
  - `lib/services/category-service.ts` — neue Funktion `createCategory()`; Cache-Invalidierung
    für `CACHE_KEY = 'categories:all'` nach dem Anlegen.
  - `lib/rate-limit.ts` — bestehenden `writeLimiter` wiederverwenden (NFR-SEC-002).
- [x] **Datenmodell / Datenbank**: **keine Migration nötig** — `PromptCategory` unterstützt
  bereits beliebige Kategorien (`prisma/schema.prisma:128`); nur der Schreibpfad wird für Nutzer
  geöffnet.
- [x] **UI-Komponenten**:
  - `app/(user)/submit/page.tsx` — Kategorie-Auswahl (bisher Buttons/Kacheln je Kategorie, siehe
    `form.category`-Handling) wird durch eine Combobox ersetzt: Texteingabe + Dropdown mit
    bestehenden Kategorien, die während des Tippens gefiltert werden (Datenquelle weiterhin
    `GET /api/categories`, clientseitig gefiltert — kein neuer Such-Endpoint nötig). Kein Treffer
    unter den Vorschlägen → der eingetippte Text wird als neue Kategorie behandelt und beim Absenden
    des Formulars über `POST /api/categories` angelegt (oder direkt im `POST /api/prompts`-Call
    mitgeliefert, siehe Tasks — Reihenfolge ist Implementierungsdetail).
  - `components/CategoryBadge.tsx` / `components/PromptCard.tsx` — **wichtiger Fund**: diese
    Komponenten lesen Icon/Farbe aktuell aus dem **statischen** `CATEGORY_CONFIG` in
    `lib/constants.ts` (nur 4 hartkodierte Kategorien), **nicht** aus den DB-Feldern
    `PromptCategory.icon`/`.color`. Neue Kategorien (egal ob von Admin oder Nutzer angelegt)
    fallen deshalb schon heute auf einen generischen grauen Badge zurück. Dieser CR muss
    `CategoryBadge`/`PromptCard` umstellen, damit Icon/Farbe aus den mitgelieferten
    `PromptCategoryInfo`-Daten (`icon`, `color`) statt aus `CATEGORY_CONFIG` kommen — sonst sind
    nutzer-erstellte Kategorien optisch nicht von den bestehenden zu unterscheiden.
  - `app/admin/(panel)/prompts/page.tsx` — keine Änderung nötig, nutzt bereits `GET /api/categories`.
- [x] **Tests**: neue Unit-Tests für `CreateCategorySchema`/Slug-Ableitung; neuer E2E-Test
  „Nutzer legt beim Einreichen eine neue Kategorie an → Kategorie erscheint in Bibliothek und
  Filter"; Edge-Case „doppelter Kategoriename (case-insensitiv) → Fehlermeldung statt Duplikat".
- [ ] **Externe Abhängigkeiten**: keine

### Entscheidung Product Owner (2026-07-16)
Neue Kategorien werden **sofort veröffentlicht**, ohne Vorab-Prüfung durch den Admin — gleiches
Muster wie bei Prompts selbst (Admin korrigiert/löscht nachträglich via
`PATCH`/`DELETE /api/admin/categories/[id]`). Kein Review-Status, kein neuer Admin-Workflow.
Absicherung gegen Missbrauch/Duplikate erfolgt über Rate-Limiting (`writeLimiter`) und
case-insensitive Slug-Dedupe beim Anlegen.

### Breaking Change?
- [ ] Ja
- [x] Nein — rein additiv; bestehende Kategorien, API-Verträge und Clients bleiben unverändert.

### Aufwandsschätzung
- **Mittel (2–8h)**
- Begründung: Kein DB-Migrationsaufwand, aber neuer API-Endpoint + Zod-Schema + Slug-Dedupe-Logik,
  UI-Erweiterung im Submit-Formular, und die Korrektur von `CategoryBadge`/`PromptCard` auf
  DB-getriebene Icon/Farb-Werte (betrifft auch bestehende Admin-erstellte Kategorien, ist aber ein
  Nebeneffekt, kein eigener CR wert).

---

## Implementierungs-Tasks

> Wird nach Freigabe von `/implement` generiert

- [x] AC-02-013: `POST /api/categories` (Nutzer-Endpoint, kein Admin) + `CreateCategorySchema` in `lib/validation.ts`
- [x] AC-02-013: `createCategory()` in `lib/services/category-service.ts` + Cache-Invalidierung von `categories:all`
- [x] AC-02-013: Unit-Tests (`CreateCategorySchema`, `slugify()`)
- [x] AC-02-014: Submit-Formular — Kategorie-Combobox (Freitext + Live-Filter bestehender Kategorien)
- [x] AC-02-014: `CategoryBadge`/`PromptCard` auf `PromptCategoryInfo.icon`/`.color` umstellen (statt `CATEGORY_CONFIG`)
- [x] AC-02-014: E2E-Test (Happy Path: neue Kategorie anlegen → sichtbar in Bibliothek; Edge-Case: doppelter Name)

---

## Freigabe

> Es gibt genau **eine** Freigabe-Instanz: den Product Owner / die Projektverantwortliche:n.

- [x] **Freigegeben**: bernoron (Product Owner) Datum: 2026-07-16
- [ ] **Abgelehnt** mit Begründung: ___________________________

---

## Änderungshistorie

| Datum | Autor | Änderung am CR |
|-------|-------|------------------|
| 2026-07-16 | Claude (Intake) | CR erstellt, Impact-Analyse ausgefüllt |
| 2026-07-16 | bernoron | Freigegeben (`approved`); Combobox-UX + sofortige Veröffentlichung bestätigt |
| 2026-07-16 | Claude (Implement) | AC-02-013 + AC-02-014 umgesetzt, verifiziert (Unit + E2E, manuell im Browser), Status → `implemented` |
