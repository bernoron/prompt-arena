# [Feature Name] – Technische Spezifikation

## Metadaten
- **Status**: `draft` | `review` | `approved`
- **Version**: 1.0
- **Feature-Nr**: XX
- **Abgeleitet von**: `specs/business/XX-feature.md` v1.0
- **Letzte Änderung**: YYYY-MM-DD

---

## Technische Akzeptanzkriterien

> Jedes TAC referenziert ein BAC aus der Business-Spec.
> Format: `AC-XX-NNN` (wird von spec-sync.mjs im Code gesucht)

- [ ] **AC-XX-001**: [Technische Beschreibung was umgesetzt werden muss]
  - **Referenz**: BAC-XX-001
  - **Testbar durch**: [Unit / E2E / Manual]

- [ ] **AC-XX-002**: [...]
  - **Referenz**: BAC-XX-001
  - **Testbar durch**: [...]

---

## API-Vertrag

### GET /api/[endpoint]
**Query-Parameter:**
| Parameter | Typ | Pflicht | Beschreibung |
|-----------|-----|---------|-------------|
| `userId` | number | nein | Filtert nach User |

**Response `200`:**
```json
{
  "id": 1,
  "field": "value"
}
```

**Fehler:**
| Code | Grund |
|------|-------|
| 400 | Ungültige Parameter (Zod-Fehler) |
| 401 | Nicht authentifiziert |

---

## Datenmodell

```prisma
model Example {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  // ...
}
```

**Migrationen nötig:** ja / nein  
**Migration-Datei:** `prisma/migrations/YYYYMMDDHHMMSS_name/`

---

## Komponenten-Struktur

```
app/(user)/[route]/
├── page.tsx          // Server Component (AC-XX-NNN)
└── components/
    ├── FeatureCard.tsx   // (AC-XX-NNN)
    └── FeatureModal.tsx  // (AC-XX-NNN)

lib/
└── feature.ts        // Business-Logik (AC-XX-NNN)

app/api/[endpoint]/
└── route.ts          // API Handler (AC-XX-NNN)
```

---

## Validierung (Zod)

```typescript
const CreateSchema = z.object({
  field: z.string().min(1).max(200),
});
```

---

## Performance-Anforderungen

| Metrik | Zielwert |
|--------|----------|
| API Response Time (p95) | < 200ms |
| Bundle Size Increase | < 10KB |

---

## Sicherheit

- [ ] Input-Validierung via Zod
- [ ] Rate-Limiting auf POST-Routes
- [ ] Keine sensiblen Daten im Client-State

---

## Tests

### Unit-Tests (`tests/unit/`)
- [ ] `feature.test.ts`: [Was wird getestet?]

### E2E-Tests (`tests/e2e/`)
- [ ] `feature.spec.ts` Szenario: [User Journey]

---

## Abhängigkeiten

| Abhängigkeit | Typ | Warum |
|-------------|-----|-------|
| Feature XX | benötigt | [Grund] |

---

## Änderungshistorie

| Version | Datum | CR | Änderung |
|---------|-------|----|---------|
| 1.0 | YYYY-MM-DD | — | Erstversion |
