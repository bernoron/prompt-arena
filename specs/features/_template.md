# Feature: [Name]

## Metadaten
- **Status**: `draft` | `ready` | `implemented`
- **Feature-Nr**: XX
- **Letzte Änderung**: YYYY-MM-DD

---

## User Story
Als [Rolle] will ich [Aktion], damit [Nutzen].

---

## Akzeptanzkriterien

> IDs sind stabil — nie umbenennen, nur ergänzen.
> Code-Implementierung trägt Kommentar `// @spec AC-XX-NNN`

- [ ] **AC-XX-001**: [Beschreibung]
- [ ] **AC-XX-002**: [Beschreibung]

---

## API-Vertrag

### GET /api/[route]
**Request**: `?param=value`
**Response 200**:
```json
{ "field": "type" }
```

### POST /api/[route]
**Body**:
```json
{ "field": "type" }
```
**Response 201**:
```json
{ "id": 1 }
```
**Response 400**: `{ "error": "Validation message" }`

---

## Datenmodell

```prisma
model [Name] {
  id Int @id @default(autoincrement())
  // ...
}
```

Änderungen an bestehenden Modellen:
- `Model.field` ergänzen: `relation [Name][]`

---

## UI-Verhalten

### Seite: `/[route]`
- Komponente: `[ComponentName]`
- States: loading | empty | filled | error
- Interaktion: [Beschreibung]

---

## Punkte-Impact
| Aktion | Punkte | Empfänger |
|--------|--------|-----------|
| [Aktion] | +N | [User/Autor] |

---

## Tests

### E2E (Playwright)
- Happy Path: [Beschreibung]
- Edge Case: [Beschreibung]

### Unit (Vitest)
- [Funktion]: [Was wird getestet]
