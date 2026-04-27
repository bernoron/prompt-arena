# [Feature Name] – Implementation Plan

> **For Developers**  
> This translates the Business Spec into code locations and test requirements.

---

## Requirement → Code Mapping

| What We're Building | How We Implement | Where | How We Test |
|---|---|---|---|
| [Business AC] | [Technical detail] | `file/path/file.tsx` | Unit test / E2E test |

**Example**:
| Authors see usage count | GET /api/users/[id] returns prompts with usageCount | `app/api/users/[id]/route.ts` | E2E: Load profile, see count |
| Badge at 10+ uses | ProfileCard checks usageCount >= 10 | `components/ProfileCard.tsx` | Unit: `calcBadges(15) includes 'popular'` |

---

## Code Files to Create/Modify

```
NEW:
  lib/badge-helpers.ts        (calcBadges function)
  app/[feature]/IMPLEMENTATION.md (this file)

MODIFY:
  app/(user)/profile/page.tsx    (add badge display)
  components/ProfileCard.tsx     (use calcBadges)
  app/(user)/leaderboard/page.tsx (show badges)

TEST:
  tests/unit/badges.test.ts     (calcBadges logic)
  tests/e2e/badges.spec.ts      (full user flows)
```

---

## API Changes

| Endpoint | Change | Reason |
|---|---|---|
| GET /api/users/[id] | Add prompts.usageCount to response | Need count to show badges |
| [Add if needed] | [Change] | [Why] |

**No new endpoints needed** (reuse existing)

---

## Database Changes

- [ ] No schema changes needed (usageCount already exists)
- [ ] OR: Add new field `[fieldName]` to [table]

---

## Test Scenarios

### Unit Tests
- [ ] calcBadges() with 0 prompts → returns []
- [ ] calcBadges() with 1 prompt → includes 'first_prompt'
- [ ] calcBadges() with 10+ used prompt → includes 'popular'
- [ ] [Add more]

### E2E Tests
- [ ] Load profile → see usage counts
- [ ] Load profile → see badges for achievements
- [ ] Load on mobile → badges display correctly
- [ ] New user with 0 prompts → see helpful message
- [ ] [Add more]

---

## Implementation Checklist

1. [ ] Create lib/badge-helpers.ts
2. [ ] Add unit tests, run `npm run test:unit`
3. [ ] Modify ProfileCard.tsx, add @spec comments
4. [ ] Test E2E: profile badges display
5. [ ] Test mobile view
6. [ ] Run full test suite: `npm run test:unit && npx playwright test`
7. [ ] Code review: all @spec annotations present?

---

## Code Annotation Template

```typescript
// @spec AC-BIZ-01, AC-BIZ-02, AC-BIZ-03
export function ProfilePage() {
  // This component implements multiple business ACs
}
```

**Rule**: Every function/component that implements a requirement gets a `// @spec` comment.

---

## Review Checklist

Before merging:
- [ ] All Business ACs mapped to code files
- [ ] All code files are real (grep to verify they exist)
- [ ] API contract is complete (request + response shown)
- [ ] Database changes are minimal or none
- [ ] Tests are concrete, not vague
- [ ] `// @spec` annotations on every component/function
- [ ] Tests pass: `npm run test:unit && npx playwright test`

---

## Questions Before Starting?

Ask developer questions to clarify:
1. Can we reuse existing endpoints, or need new ones?
2. Are there database migrations needed?
3. Does this impact other features?
