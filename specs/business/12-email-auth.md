# E-Mail-Adresse bei Registrierung – Was wir bauen

> **Für Product Owner & Business Analysts**
> Keine Tech-Begriffe. Nur Problem und Lösung.

---

## Das Problem

Beim Erstellen eines Kontos werden Nutzer nach ihrer Abteilung gefragt — für eine öffentlich zugängliche Plattform ist das sinnlos. Gleichzeitig haben wir keine E-Mail-Adresse und damit kein Mittel, Nutzern bei Problemen (vergessenes Passwort, Kontofragen) zu helfen. Personendaten wie E-Mails müssen bei einem Datenbankzugriff durch Unbefugte unlesbar bleiben.

---

## Wer profitiert?

Alle neuen Nutzer, die sich öffentlich registrieren: das Formular ist schlanker (kein irrelevantes Abteilungsfeld), und die Plattform hat einen sicheren Kontaktweg für spätere Funktionen (z. B. Passwort-Reset). Datenschutz-Verantwortliche profitieren davon, dass E-Mails auch bei einem Datenbankdiebstahl nicht lesbar sind.

---

## Was bauen wir?

Das Registrierungsformular fragt künftig nach **Name**, **E-Mail** und **Passwort** — kein Abteilungsfeld mehr. Die E-Mail wird auf dem Server mit einem geheimen Schlüssel verschlüsselt, bevor sie gespeichert wird. Selbst wenn jemand Zugriff auf die Datenbank bekommt, sieht er nur unlesbaren Text, nicht die echten E-Mail-Adressen.

Administratoren können im Admin-Panel die E-Mail-Adresse eines Nutzers einsehen (der Server entschlüsselt sie für Admins).

Bestehende Nutzerkonten sind von dieser Änderung nicht betroffen. Das nun ungenutzte Abteilungsfeld wurde inzwischen vollständig aus der Datenbank entfernt.

---

## Wie wissen wir, dass es funktioniert?

**BAC-12-001** Das Registrierungsformular zeigt drei Felder: Name, E-Mail und Passwort. Das Abteilungsfeld existiert nicht mehr.

**BAC-12-002** Eine bereits registrierte E-Mail-Adresse kann kein zweites Mal verwendet werden; der Nutzer sieht eine klare Fehlermeldung.

**BAC-12-003** E-Mail-Adressen sind in der Datenbank niemals im Klartext sichtbar — nur als verschlüsselte Zeichenkette.

**BAC-12-004** Bestehende Nutzerkonten ohne E-Mail-Adresse können sich weiterhin normal anmelden; sie sind von der Änderung nicht betroffen.

**BAC-12-005** Admins sehen im Nutzerverwaltungs-Panel die (entschlüsselte) E-Mail-Adresse jedes Nutzers.

---

## Was ist NICHT in diesem Release?

- Kein Passwort-Reset per E-Mail (separates Feature)
- Keine E-Mail-Verifikation (Bestätigungsmail)
- Migration bestehender Nutzer: Sie erhalten kein E-Mail-Feld rückwirkend

---

## Status

- **Status**: `approved`
- **Version**: 1.0
- **Datum**: 2026-06-28
- **PO**: bernoron
- **Technische Spec**: `specs/technical/12-email-auth.md`
