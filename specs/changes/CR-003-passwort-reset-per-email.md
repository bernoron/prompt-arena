# CR-003: Passwort zurücksetzen per E-Mail

## Metadaten
- **Status**: `implemented`
- **CR-ID**: CR-003
- **Feature**: 01 – Registrierung & Anmeldung / Identität
- **Typ**: `enhancement`
- **Priorität**: `high`
- **Erstellt von**: Claude (via /intake)
- **Erstellt am**: 2026-07-08
- **Fällig bis**: keine Frist

---

## Problembeschreibung / Anlass

Wer sein Passwort vergisst, kommt nicht mehr in sein Konto — die Nutzerdoku verweist nur auf „wende dich an den Administrator". Es gibt keinen Selbstbedienungs-Weg zur Wiederherstellung. Der Passwort-Reset wurde bei Einführung der E-Mail-Authentifizierung bewusst als „separates Feature" vertagt (`specs/business/12-email-auth.md`, Not-in-Scope) — dieses CR holt ihn nach und ordnet ihn der Identitäts-Spec zu.

---

## Gewünschtes Verhalten (nach der Änderung)

Auf der Anmeldeseite gibt es einen Link „Passwort vergessen?". Der Nutzer gibt seine E-Mail-Adresse ein und bekommt — **falls** ein Konto existiert — eine deutschsprachige E-Mail mit einem zeitlich begrenzten, einmalig verwendbaren Link. Über diesen Link setzt er ein neues Passwort und kann sich sofort damit anmelden. Die Rückmeldung nach der Anfrage ist **immer identisch** („Falls ein Konto existiert, wurde eine E-Mail versendet"), damit sich nicht ausspähen lässt, welche Adressen registriert sind.

---

## Betroffene Specs

### Business-Spec-Änderungen
| Spec-Datei | BAC-ID | Typ der Änderung |
|-----------|--------|-----------------|
| `specs/business/01-identity.md` | BAC-01-012 | neu – Link „Passwort vergessen?" auf Anmeldeseite |
| `specs/business/01-identity.md` | BAC-01-013 | neu – immer identische, neutrale Rückmeldung (Enumeration-Schutz) |
| `specs/business/01-identity.md` | BAC-01-014 | neu – registrierte Adresse erhält deutschsprachige E-Mail mit Reset-Link |
| `specs/business/01-identity.md` | BAC-01-015 | neu – Link zeitlich begrenzt (Vorschlag 1h) und nur einmal gültig |
| `specs/business/01-identity.md` | BAC-01-016 | neu – neues Passwort setzbar; altes wird ungültig; danach Login möglich |
| `specs/business/01-identity.md` | BAC-01-017 | neu – Anforderung von Reset-Links ist rate-limited (Missbrauchsschutz) |
| `specs/business/01-identity.md` | BAC-01-018 | neu – Tokens/Links nie im Klartext in Logs |

### Technical-Spec-Änderungen
| Spec-Datei | AC-ID | Typ der Änderung |
|-----------|-------|-----------------|
| `specs/technical/01-identity.md` | AC-01-0xx ff. | neu – Anfrage-Endpunkt, Setzen-Endpunkt, Token-Modell, E-Mail-Versand |

> Konkrete AC-Nummern werden bei `/specify-tech 01` bzw. `/implement` final vergeben. Wenn CR-002 („Konto löschen") zuerst umgesetzt wird, beginnt dieses CR bei den nächsten freien AC-Nummern — Kollisionen bei `/implement` prüfen.

---

## Impact-Analyse

### Betroffene Komponenten
- [x] **Neue Infrastruktur (E-Mail-Versand)**: erstmals echter Mailversand nötig (bisher nur verschlüsselte Speicherung). Erfordert einen SMTP-/Transaktions-E-Mail-Anbieter, eine Versand-Bibliothek und neue Produktionsgeheimnisse (z. B. `SMTP_URL`/`MAIL_API_KEY` + Absenderadresse) — analog `EMAIL_SECRET` in `.env.example` und in den Fly-Secrets zu ergänzen.
- [x] **API-Routes**: `POST` „Reset anfordern" (E-Mail rein → immer 200 neutral; intern: `hashEmail` → User suchen → Token erzeugen → Mail senden) und `POST` „Passwort setzen" (Token + neues Passwort). Beide strikt rate-limited (`authLimiter`).
- [x] **Datenmodell / Datenbank**: Migration nötig — neues Modell `PasswordResetToken` (nur **Hash** des Tokens, `userId`, `expiresAt`, `usedAt`). Klartext-Token nur in der E-Mail, nie in der DB.
- [x] **UI-Komponenten**: Link „Passwort vergessen?" auf der Anmeldeseite; Seite „Reset anfordern"; Seite „Neues Passwort setzen" (über Link mit Token erreichbar).
- [x] **Wiederverwendung**: `lib/email-crypto.ts` (`hashEmail` zum Finden des Kontos, `decryptEmail` für die Empfängeradresse); bestehende Passwort-Hashing-Logik zum Setzen.
- [x] **Startup-Check / Betrieb**: `instrumentation.ts` sollte in Produktion die neuen Mail-Secrets fordern (analog bestehender Secrets). **Falls** dadurch die Pipeline-/Automation-Spec berührt wird (`specs/technical/99-pipeline.md` / `98-automation.md`, CI-Secrets), ist dafür ein **separates CR** nötig — bei `/specify-tech` prüfen.
- [x] **Tests**: E2E (anfordern → Mail-Token abfangen → neues Passwort → Login); Unit (Token-Erzeugung/-Ablauf/-Einmaligkeit, neutrale Rückmeldung, Rate-Limit). E-Mail-Versand im Test gemockt/abgefangen.

### Breaking Change?
- [x] Nein (rein additiv). Neue Tabelle + neue Endpunkte; bestehende Abläufe unverändert.

### Aufwandsschätzung
- **Mittel–Groß (> 8h)**
- Begründung: externe E-Mail-Infrastruktur inkl. Betrieb/Secrets, neues Token-Modell mit Sicherheitsanforderungen (Ablauf, Einmaligkeit, Enumeration-Schutz), zwei Endpunkte + zwei Seiten + E-Mail-Vorlage, sicherheitskritische Tests.

---

## Implementierungs-Tasks

> Konkrete `AC-01-0xx` werden bei `/specify-tech 01` vergeben.

- [ ] **Entscheidung: E-Mail-Versanddienst wählen** (SMTP vs. Anbieter wie Resend/Postmark/SES) — blockiert die Umsetzung
- [ ] Tech-Spec `specs/technical/01-identity.md` um Reset-ACs ergänzen (2 Endpunkte, Token-Modell, Mailversand)
- [ ] Migration: Modell `PasswordResetToken` (Token-Hash, userId, expiresAt, usedAt)
- [ ] Mail-Versand-Baustein + deutschsprachige Reset-Vorlage; Secrets in `.env.example` + Fly
- [ ] Endpunkte „Reset anfordern" (neutrale Antwort, rate-limited) + „Passwort setzen"
- [ ] UI: Link „Passwort vergessen?" auf Anmeldeseite + Seiten „Reset anfordern" / „Neues Passwort setzen"
- [ ] `instrumentation.ts`: Mail-Secrets in Produktion fordern; **prüfen** ob CR gegen Pipeline/Automation (98/99) nötig
- [ ] Tests: E2E (anfordern → Token abfangen → neues Passwort → Login) + Unit (Ablauf/Einmaligkeit/Enumeration-Schutz/Rate-Limit); Mailversand gemockt

---

## Freigabe

> Eine einzige Freigabe-Instanz: **Product Owner** (gem. `specs/changes/WORKFLOW.md`).

- [x] **Freigegeben**: bernoron (PO) — Datum: 2026-07-08
- [ ] **Abgelehnt** mit Begründung: ___________________________

---

## Änderungshistorie

| Datum | Autor | Änderung am CR |
|-------|-------|---------------|
| 2026-07-08 | Claude (/intake) | CR erstellt inkl. Impact-Analyse; E-Mail-Versand als neue Infrastruktur identifiziert |
| 2026-07-08 | bernoron (PO) | Freigegeben; E-Mail-Transport: Mock-/Log-Transport zuerst |
| 2026-07-09 | Claude (/implement) | Umgesetzt (AC-01-014…019) mit Mock-Mailer, Unit + E2E grün, Status → implemented |
| 2026-07-09 | Claude (/implement) | Echter Versand: Resend-HTTP-Transport in `lib/mailer.ts` (Log-Fallback ohne `RESEND_API_KEY`); Unit-Tests ergänzt. Produktions-Key noch einzutragen |
