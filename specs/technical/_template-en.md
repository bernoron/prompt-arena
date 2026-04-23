# [Feature Name] – Technical Specification

## Metadata
- **Status**: `draft` | `approved` | `deprecated`
- **Version**: 1.0
- **Feature-Nr**: XX
- **Derived from**: `specs/business/XX-feature-name.md` v1.0
- **Last Modified**: YYYY-MM-DD

---

## Technical Acceptance Criteria

> Each AC references at least one BAC from the business spec.
> Format: `AC-XX-NNN` (searched in code by spec-sync.mjs)

- [ ] **AC-XX-001**: [Technical description of what must be implemented]
  - **Reference**: BAC-XX-001
  - **Testable by**: Unit | E2E | Manual
  - **Code Location**: `app/path/to/file.ts`

- [ ] **AC-XX-002**: [...]
  - **Reference**: BAC-XX-001
  - **Testable by**: [...]
  - **Code Location**: [...]

---

## API Contract

### GET /api/[endpoint]

**Request**:
```
GET /api/endpoint?param=value
```

**Response** (200 OK):
```json
{
  "id": 1,
  "field": "value"
}
```

**Errors**:
- `400` - Bad request (invalid params)
- `404` - Not found
- `429` - Rate limit exceeded

---

## Data Model

### New Prisma Model
```prisma
model Entity {
  id        Int     @id @default(autoincrement())
  field     String
  createdAt DateTime @default(now())
}
```

**Migrations required**: Yes – run `npx prisma migrate dev`

### Existing Model Changes
```prisma
model User {
  // existing fields...
  newField String? // NEW: description
}
```

---

## Component Structure

```
app/(user)/feature/
└── page.tsx                     // Server Component

components/
└── FeatureCard.tsx              // Reusable component

lib/
└── feature-helpers.ts           // Business logic
```

---

## Validation (Zod)

```typescript
export const CreateFeatureSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
});

export type CreateFeatureInput = z.infer<typeof CreateFeatureSchema>;
```

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| `GET /api/endpoint` (p95) | < 100ms |
| Page load (p95) | < 500ms |

---

## Security

- [x] Input validation with Zod
- [x] Rate limiting on public endpoints
- [x] No sensitive data in responses
- [x] CORS properly configured
- [x] No N+1 queries

---

## UI Behavior

- [How will users interact with this feature?]
- [What states should be shown?]
- [How does it handle loading/error states?]

---

## Tests

### Unit Tests (`tests/unit/feature.test.ts`)
- [What logic should be tested?]
- [Edge cases?]

### E2E Tests (`tests/e2e/feature.spec.ts`)
- [What user journeys should be tested?]
- [What interactions matter most?]

---

## Dependencies

| Dependency | Type | Why |
|------------|------|-----|
| Feature XX | required | [Why needed?] |
| Prisma | required | [Why needed?] |

---

## Implementation Notes

- [Any gotchas or tricky parts?]
- [Critical decisions?]
- [Known limitations?]

---

## Change History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | YYYY-MM-DD | Initial spec |
