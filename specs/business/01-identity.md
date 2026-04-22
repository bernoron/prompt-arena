# User-Registrierung & Identität – Business-Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 01
- **Product Owner**: PromptArena Team
- **Letzte Änderung**: 2026-04-22
- **Technische Spec**: `specs/technical/01-identity.md`

---

## Geschäftlicher Kontext

Damit Mitarbeiter Prompts einreichen, bewerten und Punkte sammeln können, braucht jeder eine eigene Identität auf der Plattform. Die Registrierung soll bewusst einfach gehalten sein — kein Passwort, keine E-Mail-Bestätigung — um die Hemmschwelle zur Teilnahme so gering wie möglich zu halten. Das System erkennt den Mitarbeiter beim nächsten Besuch automatisch wieder, solange er denselben Browser verwendet.

---

## Zielgruppe

| Rolle | Beschreibung | Hauptnutzen |
|-------|-------------|-------------|
| Mitarbeiter | Alle Unternehmensangehörigen, unabhängig von technischem Vorwissen | Schneller Einstieg ohne Passwort, sofortige Teilnahme am Plattformleben |
| Admin | Einzelner interner Plattformverwalter | Sieht alle registrierten User und kann deren Aktivität nachverfolgen |

---

## User Stories

- Als **Mitarbeiter** will ich mich mit meinem Namen und meiner Abteilung registrieren, damit ich eine persönliche Identität auf der Plattform habe und meine Beiträge anderen zugeordnet werden.
- Als **Mitarbeiter** will ich nach der Registrierung automatisch erkannt werden, damit ich beim nächsten Besuch sofort loslegen kann ohne erneut anzumelden.
- Als **Mitarbeiter** will ich sehen, wer sonst noch auf der Plattform aktiv ist, damit ich Kollegen finden und deren Prompts gezielt suchen kann.
- Als **Mitarbeiter** will ich meinen aktiven Account bequem wechseln können, damit ich z. B. auf einem Gemeinschaftsgerät mit meiner eigenen Identität arbeiten kann.

---

## Business-Akzeptanzkriterien

- [ ] **BAC-01-001**: Ein Mitarbeiter kann sich durch Angabe seines Namens und seiner Abteilung registrieren und erhält sofort Zugang zur Plattform.
  - **Messgrösse**: Registrierungsvorgang dauert unter 30 Sekunden; der neue Account erscheint unmittelbar in der Nutzerliste.
  - **Geschäftsregel**: Der Name muss mindestens 2 und maximal 60 Zeichen lang sein. Eine Abteilung muss angegeben werden. Kein Passwort erforderlich.

- [ ] **BAC-01-002**: Der angemeldete Mitarbeiter wird vom System im Browser gespeichert, sodass er bei einem erneuten Besuch automatisch wiedererkannt wird.
  - **Messgrösse**: Nach einem Seitenneuladen ist derselbe User noch aktiv, ohne erneut den UserPicker durchlaufen zu müssen.
  - **Geschäftsregel**: Die Wiedererkennung erfolgt lokal im Browser des Nutzers. Sie ist gerätespezifisch — auf einem anderen Gerät muss erneut ausgewählt werden.

- [ ] **BAC-01-003**: Alle registrierten Mitarbeiter sind über eine Auswahlliste erreichbar, sortiert nach Gesamtpunkten.
  - **Messgrösse**: Die Liste zeigt alle User korrekt; der Wechsel zu einem anderen Nutzer erfolgt ohne Seitenneuladen.
  - **Geschäftsregel**: Jeder Mitarbeiter kann jeden Account aus der Liste auswählen, da kein Passwort-Schutz für reguläre Nutzer vorgesehen ist.

- [ ] **BAC-01-004**: Jedes Nutzerprofil erhält automatisch eine eindeutige Farbe als visuellen Avatar.
  - **Messgrösse**: Kein Mitarbeiter sieht zwei identische Avatarfarben hintereinander in der Liste.
  - **Geschäftsregel**: Die Farbe wird bei der Registrierung nach einem Rundlauf-Verfahren aus einer vordefinierten Palette zugewiesen und kann nicht manuell geändert werden.

- [ ] **BAC-01-005**: Ein einzelnes Mitarbeiterprofil ist mit globalem Rang und eingereichten Prompts abrufbar.
  - **Messgrösse**: Profilseite lädt vollständig in unter 2 Sekunden und zeigt Rang, Punkte und Promptliste.
  - **Geschäftsregel**: Der Rang wird dynamisch berechnet — er ist die Position des Mitarbeiters in der nach Gesamtpunkten absteigend sortierten Liste aller User.

---

## Nicht im Scope

- Passwort-geschützte Mitarbeiterkonten
- E-Mail-Verifikation oder externe Anmeldeverfahren (OAuth, SSO, LDAP)
- Profilbild-Upload oder manuelle Anpassung der Avatarfarbe
- Löschen oder Deaktivieren eines Mitarbeiterkontos durch den User selbst
- Zwei-Faktor-Authentifizierung

---

## Abhängigkeiten

| Feature / System | Typ | Beschreibung |
|-----------------|-----|-------------|
| Alle anderen Features | vorausgesetzt | Ohne Benutzeridentität können keine Prompts eingereicht, bewertet oder Punkte vergeben werden |

---

## Risiken & Annahmen

| # | Beschreibung | Wahrscheinlichkeit | Massnahme |
|---|-------------|-------------------|-----------|
| R1 | Ein Mitarbeiter wählt versehentlich den Account eines Kollegen | mittel | Klare Anzeige des aktiven Users in der Navigation; bewusste Auswahl per Dropdown |
| A1 | Mitarbeiter nutzen ausschliesslich eigene, nicht geteilte Geräte | hoch | Kein technischer Schutz nötig; Vertrauensbasis reicht für internes Tool |
| A2 | Namens-Duplikate sind akzeptabel (kein Eindeutigkeitszwang) | hoch | Unterscheidung erfolgt visuell über Avatarfarbe und Abteilung |

---

## Erfolgsmessung (KPIs)

| Metrik | Zielwert | Messmethode |
|--------|----------|-------------|
| Registrierungsrate | > 80 % der aktiven Belegschaft innerhalb der ersten 4 Wochen | Datenbankabfrage: Anzahl User-Einträge |
| Abbruchquote Registrierung | < 5 % | Verhältnis: aufgerufene Registrierungsseite zu abgeschlossenen Registrierungen |

---

## Änderungshistorie

| Version | Datum | Änderung | Genehmigt von |
|---------|-------|----------|---------------|
| 1.0 | 2026-04-22 | Erstversion | PromptArena Team |

---

## Freigabe

- [ ] **PO-Freigabe**: ___________________________ Datum: ___________
- [ ] **BA-Review**: ___________________________ Datum: ___________
