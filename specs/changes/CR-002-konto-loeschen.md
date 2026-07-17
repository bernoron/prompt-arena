# CR-002: Konto löschen (Selbstbedienung)

## Metadaten
- **Status**: `implemented`
- **CR-ID**: CR-002
- **Feature**: 01 – Registrierung & Anmeldung / Identität
- **Typ**: `enhancement`
- **Priorität**: `medium`
- **Erstellt von**: Claude (via /intake)
- **Erstellt am**: 2026-07-08
- **Fällig bis**: keine Frist
- **Nutzer-Ankündigung**: 2026-07-09 | Konto selbst löschen | Du kannst dein Konto jetzt jederzeit selbst löschen, direkt im Profil.

---

## Problembeschreibung / Anlass

Nutzer können ihr eigenes Konto derzeit nicht selbst entfernen — die Identitäts-Spec schließt das sogar ausdrücklich aus („Nicht im Scope: Löschen oder Deaktivieren eines Nutzerkontos durch den User selbst"). Wer die Plattform verlassen oder aus Datenschutzgründen seine Daten löschen möchte, ist auf einen Administrator angewiesen. Für eine öffentliche Plattform ist das nicht mehr tragbar.

---

## Gewünschtes Verhalten (nach der Änderung)

Auf der eigenen Profilseite gibt es einen abgesetzten Bereich „Konto löschen". Nach einer bewussten Sicherheitsabfrage (Passwort bzw. Eingabe eines Bestätigungsworts) wird das Konto endgültig entfernt: Der Nutzer wird abgemeldet und kann sich nicht mehr anmelden. Persönliche Daten (Name, E-Mail, Passwort) verschwinden; die Beiträge des Nutzers (Prompts, Bewertungen) bleiben erhalten, werden aber **anonymisiert** dem Autor „Gelöschter Nutzer" zugeordnet, damit Bibliothek, Bewertungen und Ranglisten konsistent bleiben.

---

## Betroffene Specs

### Business-Spec-Änderungen
| Spec-Datei | BAC-ID | Typ der Änderung |
|-----------|--------|-----------------|
| `specs/business/01-identity.md` | BAC-01-006 | neu – „Konto löschen"-Bereich auf eigener Profilseite |
| `specs/business/01-identity.md` | BAC-01-007 | neu – Löschung nur nach bewusster Bestätigung; Abbruch möglich |
| `specs/business/01-identity.md` | BAC-01-008 | neu – nach Löschung abgemeldet, kein Login mehr möglich |
| `specs/business/01-identity.md` | BAC-01-009 | neu – persönliche Daten (Name, E-Mail, Passwort) entfernt |
| `specs/business/01-identity.md` | BAC-01-010 | neu – Beiträge anonymisiert („Gelöschter Nutzer"), keine verwaisten Verweise |
| `specs/business/01-identity.md` | BAC-01-011 | neu – nur eigenes Konto löschbar; Schutz gegen Mehrfachauslösung (Rate-Limit) |
| `specs/business/01-identity.md` | „Nicht im Scope" | geändert – Zeile „Löschen … durch den User selbst" entfernen |

### Technical-Spec-Änderungen
| Spec-Datei | AC-ID | Typ der Änderung |
|-----------|-------|-----------------|
| `specs/technical/01-identity.md` | AC-01-010 ff. | neu – Lösch-Endpunkt, Bestätigungsprüfung, Anonymisierungs-Logik, Session-Invalidierung |

> Konkrete AC-Nummern werden bei `/specify-tech 01` bzw. `/implement` final vergeben (fortlaufend ab AC-01-010).

---

## Impact-Analyse

### Betroffene Komponenten
- [x] **API-Routes**: neuer Endpunkt für Selbst-Löschung (z. B. `DELETE /api/account` / `POST /api/account/delete`), nur mit gültiger `user_session`; Rate-Limit (`writeLimiter`/`authLimiter`).
- [x] **Datenmodell / Datenbank**: Migration nötig. Empfohlener Ansatz **Tombstone/Anonymisierung** statt Zeilenlöschung: den `User`-Datensatz behalten, aber `name → "Gelöschter Nutzer"`, `emailHash`/`emailEncrypted`/`passwordHash → null`, neues Feld `deletedAt`. Dadurch bleiben Fremdschlüssel (Prompts, Votes) gültig und die Beiträge sind automatisch anonymisiert. Alternative (harte Löschung + Re-Assign auf Sentinel-User) in der Tech-Spec abwägen.
- [x] **UI-Komponenten**: Bereich „Konto löschen" auf der Profilseite (`app/(user)/profile/…`) inkl. Bestätigungsdialog; gelöschte User in Listen/Rangliste als „Gelöschter Nutzer" darstellen.
- [x] **Auth/Session**: nach Löschung `user_session`-Cookie invalidieren (analog Logout); gelöschter User darf sich nicht mehr anmelden (`login`/`me` müssen `deletedAt` berücksichtigen).
- [x] **Tests**: E2E (löschen → abgemeldet → kein Login mehr; fremdes Konto nicht löschbar), Unit (Anonymisierungs-/Guard-Logik).

### Breaking Change?
- [x] Nein (rein additiv; bestehende Abläufe unverändert). Falls „Tombstone"-Feld gewählt: additive Migration.

### Aufwandsschätzung
- **Klein–Mittel (2–8h)**
- Begründung: ein neuer Endpunkt + UI-Dialog + Session-Invalidierung + eine additive Migration; keine externe Infrastruktur nötig.

---

## Implementierungs-Tasks

> Konkrete `AC-01-0xx` werden bei `/specify-tech 01` vergeben.

- [ ] Tech-Spec `specs/technical/01-identity.md` um Lösch-ACs ergänzen (Endpunkt, Bestätigung, Anonymisierung, Session-Invalidierung)
- [ ] Migration: `deletedAt`-Feld / Tombstone-Ansatz für `User`
- [ ] Endpunkt Selbst-Löschung (session-geschützt, rate-limited)
- [ ] Profil-UI: Bereich „Konto löschen" + Bestätigungsdialog
- [ ] `login`/`me` berücksichtigen gelöschte Konten; gelöschte User in Listen als „Gelöschter Nutzer"
- [ ] Tests: E2E (löschen → abgemeldet → kein Login; fremdes Konto nicht löschbar) + Unit (Guard/Anonymisierung)

---

## Freigabe

> Eine einzige Freigabe-Instanz: **Product Owner** (gem. `specs/changes/WORKFLOW.md`).

- [x] **Freigegeben**: bernoron (PO) — Datum: 2026-07-08
- [ ] **Abgelehnt** mit Begründung: ___________________________

---

## Änderungshistorie

| Datum | Autor | Änderung am CR |
|-------|-------|---------------|
| 2026-07-08 | Claude (/intake) | CR erstellt inkl. Impact-Analyse; Anonymisierung von Beiträgen vom PO bestätigt |
| 2026-07-08 | bernoron (PO) | Freigegeben |
| 2026-07-09 | Claude (/implement) | Umgesetzt (AC-01-010…013), Unit + E2E grün, Status → implemented |
