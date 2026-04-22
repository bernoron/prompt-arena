# Admin-Panel – Business-Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 07
- **Product Owner**: PromptArena Team
- **Letzte Änderung**: 2026-04-22
- **Technische Spec**: `specs/technical/07-admin.md`

---

## Geschäftlicher Kontext

Damit die Plattform qualitativ hochwertig bleibt, braucht es eine Vertrauensperson, die bei Bedarf eingreifen kann: unangemessene Prompts entfernen, Challenges steuern und den Zustand der Plattform im Überblick behalten. Das Admin-Panel ist ein internes Verwaltungswerkzeug, das nur dem designierten Plattformverantwortlichen zugänglich ist. Da es sich um ein internes Tool handelt, genügt ein einfacher Passwortschutz — kein Multi-User-Admin-System ist nötig.

---

## Zielgruppe

| Rolle | Beschreibung | Hauptnutzen |
|-------|-------------|-------------|
| Admin | Einzelner interner Plattformverantwortlicher | Vollständige Kontrolle über Inhalte, Challenges und Nutzerverwaltung |

---

## User Stories

- Als **Admin** will ich mich mit einem Passwort sicher anmelden, damit Mitarbeiter keinen Zugang zum Verwaltungsbereich haben.
- Als **Admin** will ich auf einem übersichtlichen Dashboard die wichtigsten Plattform-Kennzahlen sehen, damit ich den Gesundheitszustand der Plattform schnell einschätzen kann.
- Als **Admin** will ich alle Prompts einsehen, bearbeiten und bei Bedarf löschen können, damit die Bibliothek sauber und qualitativ bleibt.
- Als **Admin** will ich Challenges erstellen, aktivieren und beenden können, damit das wöchentliche Programm funktioniert.
- Als **Admin** will ich Nutzerkonten einsehen und bei Bedarf verwalten können, damit ich bei Problemen eingreifen kann.
- Als **Admin** will ich mich wieder abmelden können, damit der Admin-Zugang auf geteilten Geräten nicht offen bleibt.

---

## Business-Akzeptanzkriterien

- [ ] **BAC-07-001**: Der Admin kann sich mit dem konfigurierten Passwort anmelden und wird danach in den Verwaltungsbereich weitergeleitet.
  - **Messgrösse**: Nach korrekter Passworteingabe ist der Admin sofort im Verwaltungsbereich; ein falsches Passwort zeigt eine verständliche Fehlermeldung.
  - **Geschäftsregel**: Es gibt genau einen Admin-Account; das Passwort wird serverseitig konfiguriert (nicht in der Datenbank). Kein Benutzername erforderlich.

- [ ] **BAC-07-002**: Alle Seiten des Verwaltungsbereichs sind ohne aktive Admin-Sitzung nicht erreichbar.
  - **Messgrösse**: Ein direkter Aufruf einer Admin-Seite ohne vorherige Anmeldung leitet automatisch zur Login-Seite weiter.
  - **Geschäftsregel**: Die Anmelde-Session wird serverseitig als sicheres, nicht auslesbares Cookie gespeichert. Die Login-Seite selbst ist ohne Anmeldung erreichbar.

- [ ] **BAC-07-003**: Der Admin sieht auf dem Dashboard die Gesamtzahl von Nutzern, Prompts, Bewertungen und Challenges.
  - **Messgrösse**: Alle vier Kennzahlen sind korrekt und spiegeln den aktuellen Datenbankstand wider.
  - **Geschäftsregel**: Die Zahlen werden bei jedem Dashboard-Aufruf aktuell geladen — keine Caching-Verzögerung im Admin-Bereich.

- [ ] **BAC-07-004**: Der Admin kann alle Prompts einsehen, bearbeiten (Titel, Inhalt, Kategorie, Schwierigkeit) und löschen.
  - **Messgrösse**: Änderungen sind nach dem Speichern sofort in der öffentlichen Bibliothek sichtbar; gelöschte Prompts verschwinden sofort.
  - **Geschäftsregel**: Das Löschen eines Prompts entfernt auch alle zugehörigen Bewertungen und Favoriten. Es gibt keine Papierkorb-Funktion — Löschungen sind endgültig.

- [ ] **BAC-07-005**: Der Admin kann Challenges erstellen, aktivieren und beenden.
  - **Messgrösse**: Neu erstellte Challenges erscheinen sofort in der Admin-Übersicht; aktivierte Challenges sind sofort für Mitarbeiter sichtbar.
  - **Geschäftsregel**: Nur eine Challenge kann gleichzeitig aktiv sein. Aktivierung einer Challenge deaktiviert automatisch alle anderen.

- [ ] **BAC-07-006**: Der Admin kann Nutzerkonten einsehen und verwalten.
  - **Messgrösse**: Alle registrierten Nutzer sind im Admin-Panel aufgelistet; Änderungen werden korrekt gespeichert.
  - **Geschäftsregel**: Der Umfang der Nutzer-Verwaltung beschränkt sich auf das Einsehen von Profildaten und ggf. Anpassungen — kein Löschen von Nutzerkonten aus der Oberfläche.

- [ ] **BAC-07-007**: Der Admin kann sich abmelden; danach ist der Verwaltungsbereich wieder gesperrt.
  - **Messgrösse**: Nach dem Abmelden wird die Admin-Session sofort ungültig; ein erneuter Aufruf einer Admin-Seite leitet zur Login-Seite um.
  - **Geschäftsregel**: Der Abmelde-Button ist in der Admin-Navigation jederzeit sichtbar und erreichbar.

---

## Nicht im Scope

- Mehrere Admin-Accounts (es gibt genau einen Admin)
- Rollenkonzept (z. B. „Moderator" ohne vollen Admin-Zugang)
- Audit-Log der Admin-Aktionen
- Admin-Zugang per SSO oder externem Identitätsanbieter
- Massen-Aktionen (z. B. alle Prompts einer Kategorie löschen)
- Passwort-Änderung über die Oberfläche (nur über Serverkonfiguration)

---

## Abhängigkeiten

| Feature / System | Typ | Beschreibung |
|-----------------|-----|-------------|
| Feature 02 – Prompt-Bibliothek | benötigt | Admin verwaltet Prompts |
| Feature 06 – Challenges | benötigt | Admin erstellt und steuert Challenges |
| Serverkonfiguration / Deployment | benötigt | Admin-Passwort wird als Umgebungsvariable gesetzt |

---

## Risiken & Annahmen

| # | Beschreibung | Wahrscheinlichkeit | Massnahme |
|---|-------------|-------------------|-----------|
| R1 | Admin-Passwort wird versehentlich weitergegeben | niedrig | Regelmässiges Passwort-Rotation; Passwort in Umgebungsvariable (nicht in Code) |
| R2 | Admin vergisst die Abmeldung auf einem Gemeinschaftsgerät | mittel | Session-Timeout nach einer definierten Inaktivitätszeit kann ergänzt werden |
| A1 | Es gibt zu jederzeit genau einen designierten Admin | hoch | Kein Multi-Admin-System nötig; organisatorisch sichergestellt |

---

## Erfolgsmessung (KPIs)

| Metrik | Zielwert | Messmethode |
|--------|----------|-------------|
| Admin-Login-Erfolgsrate | > 99 % (kein Passwort-Vergessen-Problem) | Server-Logs: Verhältnis erfolgreiche/fehlgeschlagene Logins |
| Reaktionszeit auf problematische Prompts | < 24 Stunden nach Meldung | Operativ gemessen (kein technisches Tracking) |

---

## Änderungshistorie

| Version | Datum | Änderung | Genehmigt von |
|---------|-------|----------|---------------|
| 1.0 | 2026-04-22 | Erstversion | PromptArena Team |

---

## Freigabe

- [ ] **PO-Freigabe**: ___________________________ Datum: ___________
- [ ] **BA-Review**: ___________________________ Datum: ___________
