# Persönliche Favoriten – Business-Spezifikation

## Metadaten
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 05
- **Product Owner**: PromptArena Team
- **Letzte Änderung**: 2026-04-22
- **Technische Spec**: `specs/technical/05-favorites.md`

---

## Geschäftlicher Kontext

In einer wachsenden Bibliothek mit Dutzenden oder Hunderten von Prompts verliert ein Mitarbeiter schnell den Überblick über die Prompts, die er persönlich als besonders wertvoll empfindet. Die Favoriten-Funktion erlaubt es jedem Mitarbeiter, seine persönliche Shortlist anzulegen und direkt aufzurufen — ähnlich wie Lesezeichen im Browser. Das erstmalige Favorisieren eines Prompts belohnt ausserdem den Autor mit Punkten, was den Anreiz zur Einreichung hochwertiger Prompts weiter stärkt.

---

## Zielgruppe

| Rolle | Beschreibung | Hauptnutzen |
|-------|-------------|-------------|
| Mitarbeiter | Nutzt die Plattform regelmässig und hat persönliche LieblingsPrompts | Greift in seiner persönlichen Bibliothek sofort auf bewährte Prompts zu |
| Autor | Hat Prompts eingereicht | Erhält Punkte, wenn Kollegen seinen Prompt als wertvoll genug zum Merken erachten |

---

## User Stories

- Als **Mitarbeiter** will ich einen Prompt mit einem Klick als Favorit markieren, damit ich ihn später ohne Suchen schnell wiederfinden kann.
- Als **Mitarbeiter** will ich alle meine Favoriten auf einer eigenen Seite sehen und darin suchen können, damit ich meinen persönlichen Fundus verwalten kann.
- Als **Mitarbeiter** will ich einen Prompt wieder aus meinen Favoriten entfernen können, wenn er für mich nicht mehr relevant ist.
- Als **Autor** will ich erfahren, wenn jemand meinen Prompt zum ersten Mal favorisiert, damit ich weiss, dass mein Beitrag wertgeschätzt wird (durch Punkte-Benachrichtigung).

---

## Business-Akzeptanzkriterien

- [ ] **BAC-05-001**: Ein Mitarbeiter kann jeden Prompt als Favorit markieren; ein erneuter Klick hebt den Favorit-Status wieder auf.
  - **Messgrösse**: Nach dem Favorisieren erscheint der Prompt auf der persönlichen Favoriten-Seite; nach dem Entfernen verschwindet er von dort.
  - **Geschäftsregel**: Der Favorit-Status ist benutzerspezifisch — die Markierung ist nur für denjenigen sichtbar, der sie gesetzt hat.

- [ ] **BAC-05-002**: Beim erstmaligen Favorisieren eines Prompts erhält der Autor 10 Punkte.
  - **Messgrösse**: Punktestand des Autors steigt nach erstmaligem Favorisieren durch irgendeinen User um 10; bei weiteren Favorisierungen desselben Prompts durch denselben User werden keine Punkte mehr vergeben.
  - **Geschäftsregel**: Punkte werden nur einmal pro User-Prompt-Kombination vergeben. Wenn ein User den Favorit entfernt und später erneut setzt, werden keine neuen Punkte vergeben.

- [ ] **BAC-05-003**: In der Bibliothek und auf der Favoriten-Seite ist auf Prompt-Karten ersichtlich, ob der Prompt favorisiert ist.
  - **Messgrösse**: Favorisierte Prompts haben eine sichtbare Markierung (Stern-Icon); nicht-favorisierte Prompts zeigen diese Markierung nicht.
  - **Geschäftsregel**: Die Markierung ist nur sichtbar, wenn ein User aktiv ausgewählt ist.

- [ ] **BAC-05-004**: Die persönliche Favoriten-Seite listet alle markierten Prompts und bietet eine Suchfunktion.
  - **Messgrösse**: Alle favoritisierten Prompts des aktiven Users erscheinen auf der Seite; die Suche filtert die Liste korrekt.
  - **Geschäftsregel**: Die Suche auf der Favoriten-Seite filtert nur innerhalb der Favoriten-Liste, nicht in der Gesamtbibliothek.

- [ ] **BAC-05-005**: Bei einer leeren Favoriten-Liste sieht der Mitarbeiter einen hilfreichen Hinweis und einen direkten Link zur Bibliothek.
  - **Messgrösse**: Leerer Zustand ist sichtbar und klar verständlich; der Link zur Bibliothek funktioniert.
  - **Geschäftsregel**: Kein User-Account aktiv oder Account hat keine Favoriten → Hinweis auf Leeren Zustand erscheint.

---

## Nicht im Scope

- Geteilte oder öffentliche Favoriten-Listen (Favoriten sind privat)
- Favoriten-Ordner oder Kategorien
- Exportieren der Favoriten-Liste
- Benachrichtigung an den Mitarbeiter, wenn ein favorisierter Prompt bearbeitet wurde
- Sortierung der Favoriten-Liste (sie erscheint nach Einreichungsdatum)

---

## Abhängigkeiten

| Feature / System | Typ | Beschreibung |
|-----------------|-----|-------------|
| Feature 01 – Benutzeridentität | benötigt | Favoriten sind immer einem User zugeordnet |
| Feature 02 – Prompt-Bibliothek | benötigt | Favoriten beziehen sich auf bestehende Prompts |
| Feature 04 – Gamification | benötigt | Punkte für erstmaliges Favorisieren werden über das Gamification-System vergeben |

---

## Risiken & Annahmen

| # | Beschreibung | Wahrscheinlichkeit | Massnahme |
|---|-------------|-------------------|-----------|
| R1 | Mitarbeiter nutzen Favoriten nicht, weil sie die Funktion übersehen | niedrig | Stern-Icon ist prominent im Modal platziert; Onboarding weist darauf hin |
| A1 | Mitarbeiter wollen ihre Favoriten nicht mit anderen teilen | hoch | Favoriten bleiben privat; kein Feature zum Teilen geplant |

---

## Erfolgsmessung (KPIs)

| Metrik | Zielwert | Messmethode |
|--------|----------|-------------|
| Anteil User mit mind. 1 Favorit | > 60 % der aktiven User | Datenbankabfrage: User mit mind. 1 Favorite-Eintrag |
| Durchschnittliche Favoriten pro aktiver User | mind. 3 | Datenbankabfrage: Gesamt-Favoriten / aktive User |
| Favoriten-Seiten-Aufrufe pro Woche | mind. 30 | Server-Logs oder Analytics |

---

## Änderungshistorie

| Version | Datum | Änderung | Genehmigt von |
|---------|-------|----------|---------------|
| 1.0 | 2026-04-22 | Erstversion | PromptArena Team |

---

## Freigabe

- [ ] **PO-Freigabe**: ___________________________ Datum: ___________
- [ ] **BA-Review**: ___________________________ Datum: ___________
