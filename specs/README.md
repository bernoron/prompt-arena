# Specs – Übersicht

> 🗺️ **Gesamtbild zuerst:** [`specs/OVERVIEW.md`](OVERVIEW.md) — eine Landkarte über *alle* Aspekte
> der Lösung (Lebenszyklus, Artefakte, Governance, Rollen, Automatik, Abdeckung) mit Diagrammen.

Alle Spezifikationen folgen einem einfachen **2-Layer-Prinzip**:

```
specs/
  business/           ← WAS wir bauen   (PO/BA schreibt, kein Tech-Jargon)
  technical/          ← WIE wir es bauen (Dev schreibt, Maps zu Code)
  changes/            ← Änderungsanträge an bestehende Specs
  non-functional.md   ← Nichtfunktionale Anforderungen (NFR-Katalog, CR-geschützt)
  constitution.md     ← Regeln die immer gelten
  tasks.md            ← Aktuelle Task-Liste
```

> **Ein Prompt, ein Fluss:** Statt selbst zu entscheiden ob neu/Änderung/Bugfix, einfach
> `/intake <deine Anforderung>` — der Router klassifiziert, erzeugt den freigabereifen Entwurf
> (Business-Spec-Draft oder Change Request) und legt ihn zur Freigabe vor. Erst nach Freigabe
> wird implementiert. Details unten unter „Workflow".

---

## Layer 1 – Business Specs (`specs/business/`)

**Wer schreibt:** Product Owner / Business Analyst
**Sprache:** Kein Tech-Jargon — verständlich ohne IT-Hintergrund
**Template:** `specs/business/_template.md`

| Datei | Feature | Status |
|-------|---------|--------|
| `00-product-vision.md` | Produkt-Vision & Nutzerszenarien | ✅ |
| `01-identity.md` | Registrierung & Login | ✅ |
| `02-prompt-library.md` | Prompt-Bibliothek | ✅ |
| `03-voting.md` | Bewertungssystem | ✅ |
| `04-gamification.md` | Punkte, Level, Rangliste | ✅ |
| `05-favorites.md` | Favoriten | ✅ |
| `06-challenges.md` | Wöchentliche Challenges | ✅ |
| `07-admin.md` | Admin-Panel | ✅ |
| `08-learning-path.md` | Lernpfade | ✅ |
| `09-extended-learning.md` | Erweitertes Lernen | ✅ |
| `10-profile.md` | Profil & Badges | ✅ |
| `11-feedback.md` | Nutzer-Feedback | ✅ |
| `12-email-auth.md` | E-Mail-Authentifizierung | ✅ |
| `13-landing-page.md` | Öffentliche Startseite | ✅ |

---

## Layer 2 – Technical Specs (`specs/technical/`)

**Wer schreibt:** Developer (oft mit Agent-Unterstützung)
**Inhalt:** API-Vertrag, Datenmodell, Datei-Pfade, Zod-Schema, Tests
**Template:** `specs/technical/_template.md`

| Datei | Feature | Status |
|-------|---------|--------|
| `00-architecture.md` | Tech-Stack & Architektur | ✅ |
| `01-identity.md` | Registrierung & Login | ✅ |
| `02-prompt-library.md` | Prompt-Bibliothek | ✅ |
| `03-voting.md` | Bewertungssystem | ✅ |
| `04-gamification.md` | Punkte, Level, Rangliste | ✅ |
| `05-favorites.md` | Favoriten | ✅ |
| `06-challenges.md` | Wöchentliche Challenges | ✅ |
| `07-admin.md` | Admin-Panel | ✅ |
| `08-learning-path.md` | Lernpfade | ✅ |
| `09-extended-learning.md` | Erweitertes Lernen | ✅ |
| `10-profile.md` | Profil & Badges | ✅ |
| `11-feedback.md` | Nutzer-Feedback | ✅ |
| `12-email-auth.md` | E-Mail-Authentifizierung | ✅ |
| `13-landing-page.md` | Öffentliche Startseite | ✅ |
| `98-automation.md` | Doku-Generator, Git-Hooks, Spec-Sync (CR-geschützt) | ✅ |
| `99-pipeline.md` | CI/CD-Pipeline (CR-geschützt) | ✅ |

---

## Querschnitt – Nichtfunktionale Anforderungen (`specs/non-functional.md`)

**Wer schreibt:** Dev / Claude
**Inhalt:** Messbare Qualitätsziele mit stabilen IDs (`NFR-<KATEGORIE>-NNN`) für Performance,
Verfügbarkeit, Sicherheit, Barrierefreiheit, i18n, Observability, Wartbarkeit, Kompatibilität.
Gilt für alle Features; wird von Feature-Specs referenziert statt dupliziert. **CR-geschützt.**

---

## Änderungen an bestehenden Specs (`specs/changes/`)

Wenn ein bereits implementiertes Feature geändert werden soll:

```
/change-request [Feature-Name] [Beschreibung]
```

→ Erstellt `specs/changes/CR-NNN.md`
→ Muss reviewed und approved werden bevor Code geändert wird

---

## Workflow

```
Formloser Prompt   → /intake     → Router: klassifiziert + erzeugt Entwurf zur Freigabe
                                    (danach folgt automatisch einer der Pfade unten)

Neue Idee          → /specify    → specs/business/NN.md
Business fertig    → /plan       → specs/technical/NN.md
Bereit zum Bauen   → /tasks      → specs/tasks.md aktualisieren
Implementieren     → /implement  → Code + @spec Kommentare
Bestehendes ändern → /change-request → /approve-change → /implement
```

**Regel:** Änderungen an einer `approved` Spec, am NFR-Katalog oder an der Pipeline-Spec
brauchen immer ein genehmigtes Change Request. `/intake` erzwingt das automatisch.

---

## Regeln (immer gültig)

→ `specs/constitution.md`
