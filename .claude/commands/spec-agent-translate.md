# Spec Agent: Translate Business → Technical

## Purpose
Convert an approved Business Specification into a Technical Implementation plan.

## How to Use

```
/spec-agent-translate
Business Spec: specs/business/NN-feature-name.md
Action: [analyze | extract-implementation | validate-code]
```

## Example Workflow

### Step 1: Analyze Business Spec

```
/spec-agent-translate
Business Spec: specs/business/10-badges.md
Action: analyze
```

Agent reads the Business Spec and responds:

```markdown
# Translation Plan: Employee Badges

## Business ACs Found
- AC-BIZ-01: Employee sees badge when they achieve milestone
- AC-BIZ-02: Badge shows on profile page
- AC-BIZ-03: Badges are visible in leaderboard
- AC-BIZ-04: Works for mobile and desktop
- AC-BIZ-05: Employee with 0 achievements sees helpful message

## Questions Before Implementation

1. **Badge Calculation**: "Employee sees badge at 10+ uses"
   → Where does usageCount live in the database? 
   → Is it on the Prompt model? Updated when someone uses a prompt?

2. **Display Logic**: "Badge shows on profile page"
   → Should we show:
     - Just earned badges? 
     - All earned badges ever?
     - Show progress toward next badge?

3. **Mobile**: "Works for mobile and desktop"
   → Tested on phones only, or all breakpoints?

4. **Real-time**: Does badge appear immediately, or can it be delayed?

---

**Next**: Run `/spec-agent-translate ... Action: extract-implementation` 
once you answer these questions.
```

---

### Step 2: Extract Implementation Plan

```
/spec-agent-translate
Business Spec: specs/business/10-badges.md
Action: extract-implementation
```

Agent generates `app/badges/IMPLEMENTATION.md`:

```markdown
# Employee Badges – Implementation Plan

## Maps Business ACs to Code

| Business AC | What It Means | Code Location | Test |
|---|---|---|---|
| Employee sees badge at 10+ uses | ProfileCard component displays badge when prompt.usageCount >= 10 | `components/ProfileCard.tsx` or `app/(user)/profile/page.tsx` | Unit: calcBadges() test all thresholds |
| Badge shows on profile page | Profile page loads user's prompts + calculates badges client-side | `app/(user)/profile/page.tsx` | E2E: Load profile, see badges |
| Badges on leaderboard | Leaderboard shows badges alongside username | `app/(user)/leaderboard/page.tsx` | E2E: Load leaderboard, badges visible |
| Mobile + desktop | Tailwind responsive classes handle layout | Components use `flex`, `grid`, media queries | E2E with Playwright on mobile viewport |
| Empty state message | If no badges, show message + link to /submit | `components/ProfileCard.tsx` | E2E: New user profile shows message |

## Required Code Changes

### New Files
- `lib/badge-helpers.ts` — Export `calcBadges(prompts)` function

### Files to Modify
- `app/(user)/profile/page.tsx` — Import ProfileCard, pass prompts
- `components/ProfileCard.tsx` — Use calcBadges(), display badges
- `app/(user)/leaderboard/page.tsx` — Include badges in user rows
- `tests/e2e/badges.spec.ts` — E2E tests for all ACs

### Database Changes
- **No schema changes needed**
- usageCount already exists on Prompt model
- Prompts already relationship on User model

## API Changes
- GET /api/users/[id] must include prompts with usageCount
- GET /api/prompts must include usageCount
- **No new endpoints needed**

## Testing Plan

### Unit Tests
```typescript
test('calcBadges: returns empty array for 0 prompts', () => {
  expect(calcBadges([])).toEqual([]);
});

test('calcBadges: returns "First Prompt" for 1+ prompts', () => {
  expect(calcBadges([{ usageCount: 1 }])).toContain('first_prompt');
});

test('calcBadges: returns "Popular" for 10+ uses', () => {
  expect(calcBadges([{ usageCount: 15 }])).toContain('popular');
});
```

### E2E Tests
```typescript
test('Profile shows badges for user with 10+ usage prompt', async () => {
  // Given: User Alice with 1 prompt that's been used 15 times
  // When: Navigate to /profile (Alice selected)
  // Then: See "Popular" badge displayed
});
```

## Implementation Order

1. Create `lib/badge-helpers.ts` with calcBadges()
2. Modify ProfileCard to use calcBadges(), display badges
3. Test unit tests pass
4. Modify /profile page to show badges
5. Test E2E: profile badge display
6. Modify /leaderboard to show badges
7. Test responsive design on mobile
8. Final E2E all scenarios pass

## Code Annotations

```typescript
// In all files that implement badge logic:
// @spec AC-BIZ-01 (or whatever the mapping is)
```

## Review Checklist

- [ ] All Business ACs are mapped to code files
- [ ] All code files exist (or will be created)
- [ ] Database changes are minimal (or none)
- [ ] API changes don't break existing endpoints
- [ ] Tests are concrete (can write them without guessing)
- [ ] Implementation order is logical (dependencies first)
```

---

### Step 3: Validate Against Existing Code

```
/spec-agent-translate
Business Spec: specs/business/10-badges.md
Existing Code: app/(user)/profile/page.tsx
Action: validate-code
```

Agent compares and responds:

```markdown
# Validation: Does Existing Code Match Business AC?

## ✅ ALREADY IMPLEMENTED

Business AC: "Employee sees badge when achieving milestone"
Code exists at: `app/(user)/profile/page.tsx` lines 19-27
```typescript
const BADGES = [
  { id: 'first_prompt', label: 'First Prompt', icon: '📝', 
    condition: (u) => u.prompts.length >= 1 },
  ...
];
```

✅ Yes, badges are calculated and displayed.

---

## ⚠️  PARTIALLY IMPLEMENTED

Business AC: "Badge shows on profile page"
- ✅ Badges displayed on /profile
- ❌ Badges NOT shown on /leaderboard
- ❌ Badges NOT shown on profile when viewing peer profile

Action: Need to add badges to leaderboard + peer profile views.

---

## ❌ NOT IMPLEMENTED

Business AC: "Mobile view shows badges"
- Needs Playwright E2E test with mobile viewport
- Needs to verify badges don't overflow on 375px width

Action: Add E2E test for mobile, fix layout if needed.

---

## Summary

**Gaps to close**:
1. Add badges to /leaderboard
2. Test mobile viewport
3. Add E2E tests for all scenarios

**Then run**:
```
npm run test:unit && npx playwright test
```

All Business ACs must pass tests before we're done.
```

---

## Reverse: Extract Business Spec from Code

If code already exists but isn't specified:

```
/spec-agent-translate
Existing Code: app/(user)/profile/page.tsx
Action: extract-business-spec
```

Agent reads the code and generates a Business Spec based on what it actually does.

---

## Output Files

After translation, you get:

```
app/[feature]/IMPLEMENTATION.md
├── Business AC → Code mapping (table)
├── Required code changes (what files)
├── API contract (if any changes)
├── Testing plan (unit + E2E)
├── Implementation order (what to code first)
└── Review checklist (how to verify it's done)
```

This file is now the **source of truth for developers**.

---

## When Translation is Done

Developer can:
1. Read IMPLEMENTATION.md
2. Know exactly what to code
3. Know where to code it
4. Know how to test it
5. Annotate with `// @spec AC-BIZ-01`

Then:
```
npm run test:unit && npx playwright test
/spec-check  # Verify all ACs have code + tests
```

Done! ✅
