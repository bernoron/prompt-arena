# [Feature Name] – Business-Spezifikation

## Metadaten
- **Status**: `draft` | `review` | `approved`
- **Version**: 1.0
- **Feature-Nr**: XX
- **Product Owner**: [Name]
- **Letzte Änderung**: YYYY-MM-DD
- **Technische Spec**: [noch nicht erstellt] | `specs/technical/XX-feature.md`

---

## Geschäftlicher Kontext

> Warum brauchen wir dieses Feature? Welches Problem löst es für das Unternehmen?

[2–3 Sätze in Alltagssprache. Keine Technologie, keine Implementierungsdetails.]

---

## Zielgruppe

| Rolle | Beschreibung | Hauptnutzen |
|-------|-------------|-------------|
| [z.B. Mitarbeiter] | [Wer ist das?] | [Was gewinnt er/sie?] |

---

## User Stories

- Als **[Rolle]** will ich **[Aktion]**, damit **[Nutzen]**.
- Als **[Rolle]** will ich **[Aktion]**, damit **[Nutzen]**.

---

## Business-Akzeptanzkriterien

> Format: `BAC-XX-NNN` — Business Acceptance Criterion  
> Diese IDs werden in der technischen Spec referenziert.

- [ ] **BAC-XX-001**: [Was der Nutzer tun kann / was das System leisten muss]
  - **Messgrösse**: [Wie wird Erfolg gemessen? Z.B. „Aktion dauert < 3 Sek."]
  - **Geschäftsregel**: [Welche Regel gilt? Z.B. „Jeder User darf max. 1x täglich einreichen"]

- [ ] **BAC-XX-002**: [...]
  - **Messgrösse**: [...]
  - **Geschäftsregel**: [...]

---

## Nicht im Scope

> Was gehört explizit NICHT zu diesem Feature? (verhindert Scope Creep)

- ❌ [Was wir NICHT bauen]
- ❌ [Was erst in einem späteren Release kommt]

---

## Abhängigkeiten

| Feature / System | Typ | Beschreibung |
|-----------------|-----|-------------|
| [Feature XX] | benötigt | [Warum?] |
| [Externes System] | optional | [Warum?] |

---

## Risiken & Annahmen

| # | Beschreibung | Wahrscheinlichkeit | Massnahme |
|---|-------------|-------------------|-----------|
| R1 | [Risiko] | hoch / mittel / niedrig | [Gegenmassnahme] |
| A1 | [Annahme, die wir treffen] | — | [Was wenn falsch?] |

---

## Erfolgsmessung (KPIs)

| Metrik | Zielwert | Messmethode |
|--------|----------|-------------|
| [z.B. Feature-Nutzungsrate] | [z.B. > 30% der User pro Woche] | [Analytics / DB-Query] |

---

## Änderungshistorie

| Version | Datum | Änderung | Genehmigt von |
|---------|-------|----------|---------------|
| 1.0 | YYYY-MM-DD | Erstversion | [PO Name] |

---

## Freigabe

- [ ] **PO-Freigabe**: ___________________________ Datum: ___________
- [ ] **BA-Review**: ___________________________ Datum: ___________
