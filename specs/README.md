# Specs – Übersicht

Alle Spezifikationen folgen einem einfachen **2-Layer-Prinzip**:

```
specs/
  business/         ← WAS wir bauen   (PO/BA schreibt, kein Tech-Jargon)
  technical/        ← WIE wir es bauen (Dev schreibt, Maps zu Code)
  changes/          ← Änderungsanträge an bestehende Specs
  constitution.md   ← Regeln die immer gelten
  tasks.md          ← Aktuelle Task-Liste
```

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
| `11-jrgame.md` | Jump & Run Spiel | 📝 draft |

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
Neue Idee          → /specify    → specs/business/NN.md
Business fertig    → /plan       → specs/technical/NN.md
Bereit zum Bauen   → /tasks      → specs/tasks.md aktualisieren
Implementieren     → /implement  → Code + @spec Kommentare
Bestehendes ändern → /change-request
```

---

## Regeln (immer gültig)

→ `specs/constitution.md`
