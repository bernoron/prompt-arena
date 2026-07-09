# User-Registrierung & Identität – Business-Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 01
- **Product Owner**: PromptArena Team
- **Letzte Änderung**: 2026-07-08
- **Technische Spec**: `specs/technical/01-identity.md`

> **Hinweis**: Das Auth-Modell wurde seither um E-Mail + Passwort erweitert (siehe `specs/business/12-email-auth.md`). Die unten beschriebenen Passwort- und Abteilungs-Details sind historisch.

---

## Geschäftlicher Kontext

Damit Nutzer Prompts einreichen, bewerten und Punkte sammeln können, braucht jeder eine eigene Identität auf der Plattform. Die Registrierung soll bewusst einfach gehalten sein — kein Passwort, keine E-Mail-Bestätigung — um die Hemmschwelle zur Teilnahme so gering wie möglich zu halten. Das System erkennt den Nutzer beim nächsten Besuch automatisch wieder, solange er denselben Browser verwendet.

---

## Zielgruppe

| Rolle | Beschreibung | Hauptnutzen |
|-------|-------------|-------------|
| Nutzer | Alle Interessierten, unabhängig von technischem Vorwissen | Schneller Einstieg, sofortige Teilnahme am Plattformleben |
| Admin | Einzelner Plattformverwalter | Sieht alle registrierten User und kann deren Aktivität nachverfolgen |

---

## User Stories

- Als **Nutzer** will ich mich mit meinem Namen registrieren, damit ich eine persönliche Identität auf der Plattform habe und meine Beiträge anderen zugeordnet werden.
- Als **Nutzer** will ich nach der Registrierung automatisch erkannt werden, damit ich beim nächsten Besuch sofort loslegen kann ohne erneut anzumelden.
- Als **Nutzer** will ich sehen, wer sonst noch auf der Plattform aktiv ist, damit ich Kollegen finden und deren Prompts gezielt suchen kann.
- Als **Nutzer** will ich meinen aktiven Account bequem wechseln können, damit ich z. B. auf einem Gemeinschaftsgerät mit meiner eigenen Identität arbeiten kann.

---

## Business-Akzeptanzkriterien

- [ ] **BAC-01-001**: Ein Nutzer kann sich durch Angabe seines Namens registrieren und erhält sofort Zugang zur Plattform.
  - **Messgrösse**: Registrierungsvorgang dauert unter 30 Sekunden; der neue Account erscheint unmittelbar in der Nutzerliste.
  - **Geschäftsregel**: Der Name muss mindestens 2 und maximal 60 Zeichen lang sein.

- [ ] **BAC-01-002**: Der angemeldete Nutzer wird vom System im Browser gespeichert, sodass er bei einem erneuten Besuch automatisch wiedererkannt wird.
  - **Messgrösse**: Nach einem Seitenneuladen ist derselbe User noch aktiv, ohne erneut den UserPicker durchlaufen zu müssen.
  - **Geschäftsregel**: Die Wiedererkennung erfolgt lokal im Browser des Nutzers. Sie ist gerätespezifisch — auf einem anderen Gerät muss erneut ausgewählt werden.

- [ ] **BAC-01-003**: Alle registrierten Nutzer sind über eine Auswahlliste erreichbar, sortiert nach Gesamtpunkten.
  - **Messgrösse**: Die Liste zeigt alle User korrekt; der Wechsel zu einem anderen Nutzer erfolgt ohne Seitenneuladen.
  - **Geschäftsregel**: Jeder Nutzer kann jeden Account aus der Liste auswählen, da kein Passwort-Schutz für reguläre Nutzer vorgesehen ist.

- [ ] **BAC-01-004**: Jedes Nutzerprofil erhält automatisch eine eindeutige Farbe als visuellen Avatar.
  - **Messgrösse**: Kein Nutzer sieht zwei identische Avatarfarben hintereinander in der Liste.
  - **Geschäftsregel**: Die Farbe wird bei der Registrierung nach einem Rundlauf-Verfahren aus einer vordefinierten Palette zugewiesen und kann nicht manuell geändert werden.

- [ ] **BAC-01-005**: Ein einzelnes Nutzerprofil ist mit globalem Rang und eingereichten Prompts abrufbar.
  - **Messgrösse**: Profilseite lädt vollständig in unter 2 Sekunden und zeigt Rang, Punkte und Promptliste.
  - **Geschäftsregel**: Der Rang wird dynamisch berechnet — er ist die Position des Nutzers in der nach Gesamtpunkten absteigend sortierten Liste aller User.

### Konto löschen (CR-002)

- [x] **BAC-01-006**: Auf der eigenen Profilseite gibt es einen klar sichtbaren, abgesetzten Bereich „Konto löschen".
- [x] **BAC-01-007**: Ein Klick löscht nicht sofort, sondern verlangt eine bewusste Bestätigung (Passwort oder Bestätigungswort); Abbruch ist möglich.
- [x] **BAC-01-008**: Nach bestätigter Löschung ist der Nutzer abgemeldet und kann sich nicht mehr anmelden.
- [x] **BAC-01-009**: Persönliche Daten (Name, E-Mail, Passwort) sind nach der Löschung nicht mehr vorhanden.
- [x] **BAC-01-010**: Beiträge des Nutzers bleiben erhalten, werden aber anonymisiert dem Autor „Gelöschter Nutzer" zugeordnet; keine verwaisten Verweise.
- [x] **BAC-01-011**: Ein Nutzer kann nur sein eigenes Konto löschen; der Vorgang ist gegen Mehrfachauslösung begrenzt (Rate-Limit).

### Passwort zurücksetzen per E-Mail (CR-003)

- [x] **BAC-01-012**: Auf der Anmeldeseite gibt es einen sichtbaren Link „Passwort vergessen?".
- [x] **BAC-01-013**: Nach Eingabe einer E-Mail sieht der Nutzer immer dieselbe neutrale Bestätigung — unabhängig davon, ob die Adresse registriert ist.
- [x] **BAC-01-014**: Ist die Adresse registriert, erhält der Nutzer eine deutschsprachige E-Mail mit einem Link zum Zurücksetzen.
- [x] **BAC-01-015**: Der Link ist zeitlich begrenzt gültig (Vorschlag 1 Stunde) und nur einmal verwendbar.
- [x] **BAC-01-016**: Über einen gültigen Link kann ein neues Passwort gesetzt werden (gleiche Regeln wie bei Registrierung); das alte Passwort wird ungültig, danach ist Login möglich.
- [x] **BAC-01-017**: Das Anfordern von Reset-Links ist gegen Missbrauch begrenzt (Rate-Limit pro Adresse/Zeitfenster).
- [x] **BAC-01-018**: Reset-Links und -Tokens erscheinen niemals im Klartext in Protokollen/Logs.

---

## Nicht im Scope

- Passwort-geschützte Nutzerkonten
- E-Mail-Verifikation oder externe Anmeldeverfahren (OAuth, SSO, LDAP)
- Profilbild-Upload oder manuelle Anpassung der Avatarfarbe
- Zwei-Faktor-Authentifizierung
- Passwort ändern im eingeloggten Zustand (separates Feature „Profil bearbeiten")

---

## Abhängigkeiten

| Feature / System | Typ | Beschreibung |
|-----------------|-----|-------------|
| Alle anderen Features | vorausgesetzt | Ohne Benutzeridentität können keine Prompts eingereicht, bewertet oder Punkte vergeben werden |

---

## Risiken & Annahmen

| # | Beschreibung | Wahrscheinlichkeit | Massnahme |
|---|-------------|-------------------|-----------|
| R1 | Ein Nutzer wählt versehentlich den Account eines Kollegen | mittel | Klare Anzeige des aktiven Users in der Navigation; bewusste Auswahl per Dropdown |
| A1 | Nutzer nutzen ausschliesslich eigene, nicht geteilte Geräte | hoch | Kein technischer Schutz nötig; Vertrauensbasis reicht für diese Plattform |
| A2 | Namens-Duplikate sind akzeptabel (kein Eindeutigkeitszwang) | hoch | Unterscheidung erfolgt visuell über Avatarfarbe |

---

## Erfolgsmessung (KPIs)

| Metrik | Zielwert | Messmethode |
|--------|----------|-------------|
| Registrierungsrate | Stetiges Wachstum der registrierten Nutzerbasis | Datenbankabfrage: Anzahl User-Einträge |
| Abbruchquote Registrierung | < 5 % | Verhältnis: aufgerufene Registrierungsseite zu abgeschlossenen Registrierungen |

---

## Änderungshistorie

| Version | Datum | Änderung | Genehmigt von |
|---------|-------|----------|---------------|
| 1.0 | 2026-04-22 | Erstversion | PromptArena Team |
| 1.1 | 2026-07-08 | CR-002: Konto löschen (BAC-01-006…011); „Nicht im Scope"-Ausschluss der Selbst-Löschung entfernt | bernoron (PO) |
| 1.2 | 2026-07-08 | CR-003: Passwort zurücksetzen per E-Mail (BAC-01-012…018) | bernoron (PO) |

---

## Freigabe

- [ ] **PO-Freigabe**: ___________________________ Datum: ___________
- [ ] **BA-Review**: ___________________________ Datum: ___________
