# Produkt-Spec – PromptArena

## Vision
PromptArena ist eine interne Web-Plattform für Unternehmens-Mitarbeiter, auf der KI-Prompts geteilt, bewertet und gesammelt werden. Ziel: kollektives Wissen über effektive KI-Nutzung im Unternehmen aufbauen und gamifiziert zugänglich machen.

## Nutzer
- **Mitarbeiter**: Registrieren sich selbst (kein Passwort), wählen Abteilung, teilen und nutzen Prompts
- **Admin**: Einzelner interner Admin (Passwort geschützt), verwaltet Inhalte und Challenges

## Kernszenarien

### Als Mitarbeiter will ich…
- mich mit Name und Abteilung registrieren, um eine Identität in der Plattform zu haben
- Prompts anderer Mitarbeiter in der Bibliothek durchsuchen und filtern, um schnell nützliche Prompts zu finden
- Prompts nach Kategorie (Writing, Email, Analyse, Excel) und Schwierigkeit filtern
- einen Prompt als „benutzt" markieren, damit der Autor Punkte bekommt und der Prompt aufsteigt
- Prompts mit 1–5 Sternen bewerten, um Qualitätssignale zu setzen
- eigene Prompts einreichen (deutsch + englisch), um Wissen zu teilen und Punkte zu sammeln
- Prompts favorisieren und in meiner persönlichen Bibliothek abrufen
- meinen Fortschritt auf dem Dashboard sehen (Punkte, Level, Rang, Trend)
- die Rangliste aller Mitarbeiter sehen, um mich zu vergleichen
- an wöchentlichen Challenges teilnehmen, um Bonus-Punkte zu verdienen

### Als Admin will ich…
- mich mit Passwort einloggen und sicher ausloggen
- alle Prompts einsehen, bearbeiten und löschen
- wöchentliche Challenges erstellen, aktivieren und beenden
- Benutzer-Accounts einsehen und verwalten

## Nicht in Scope
- Externe Logins (OAuth, SSO)
- Mobil-App
- Echtzeit-Updates (WebSockets)
- E-Mail-Benachrichtigungen
- Prompt-Ausführung direkt in der App

## Erfolgsmetriken
- Monatlich aktive Nutzer > 50% der Belegschaft
- Durchschnittliche Bewertung eingreichter Prompts > 3.5 Sterne
- Mind. 10 neue Prompts pro Woche
