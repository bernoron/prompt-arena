# Profile & Badges – Implementation Plan

## Business AC → Code Mapping

| Business AC | How We Implement | Code File | Test |
|---|---|---|---|
| See name, level, points, rank | GET /api/users/[id] returns these fields; ProfilePage displays hero section | `app/(user)/profile/page.tsx` | E2E: load profile, see all 4 fields |
| Progress bar to next level | getLevelProgress() calculates %; ProgressBar component displays | `app/(user)/profile/page.tsx`, `components/ProgressBar.tsx` | E2E: verify bar fills correctly |
| See prompts with usage count | GET /api/users/[id] includes prompts array with usageCount; ProfilePage maps prompts | `app/api/users/[id]/route.ts`, `app/(user)/profile/page.tsx` | E2E: load profile, see prompt list + counts |
| Badges for achievements | calcBadges() checks prompts.length, totalPoints, usageCount, avgRating; BADGES array defines 7 badge types | `app/(user)/profile/page.tsx` (or `lib/badge-helpers.ts`) | Unit: calcBadges() with various inputs; E2E: see badges appear |
| Badges are permanent | Badges calculated from current metrics, not stored separately (if they drop below threshold, badge doesn't show, but that's OK) | `app/(user)/profile/page.tsx` | E2E: manually verify badge behavior |
| Mobile + desktop | Tailwind responsive classes; ProfilePage uses `grid-cols-1 lg:grid-cols-3` | `app/(user)/profile/page.tsx`, `components/` | E2E Playwright: test at 375px and 1280px |
| Empty state for 0 prompts | If prompts.length === 0, show message + link to /submit | `app/(user)/profile/page.tsx` | E2E: new user profile shows message |

## Code Files to Create/Modify

**Already exists** (just annotate with @spec):
- `app/(user)/profile/page.tsx` — Main profile component (exists, needs // @spec)
- `app/api/users/[id]/route.ts` — Already returns user + prompts (check: does it include usageCount?)
- `components/LevelBadge.tsx` — Already exists
- `components/ProgressBar.tsx` — Check if exists; if not, create

**May need**:
- `lib/badge-helpers.ts` — If badge logic not already in profile/page.tsx

## API: No Changes Needed?

Check if `GET /api/users/[id]` already returns:
```json
{
  "id": 42,
  "name": "Alice",
  "department": "Engineering",
  "totalPoints": 285,
  "level": "Prompt-Schmied",
  "rank": 3,
  "prompts": [
    {
      "id": 7,
      "title": "...",
      "usageCount": 15,
      "avgRating": 4.2,
      "voteCount": 8
    }
  ]
}
```

**If yes**: ✅ No changes needed.  
**If no**: Add usageCount, avgRating, voteCount to prompts in response.

## Database Changes

**None**. usageCount already exists on Prompt model.

## Tests Needed

### Unit Tests (if extracting badge logic to separate file)
```typescript
test('calcBadges: 1 prompt → includes "first_prompt"', () => {
  expect(calcBadges({ prompts: [{ usageCount: 0 }] })).toContain('first_prompt');
});

test('calcBadges: 5 prompts → includes "five_prompts"', () => {
  expect(calcBadges({ prompts: [{}, {}, {}, {}, {}] })).toContain('five_prompts');
});

test('calcBadges: prompt with 10+ uses → includes "popular"', () => {
  expect(calcBadges({ prompts: [{ usageCount: 15 }] })).toContain('popular');
});

test('calcBadges: prompt avg ≥ 4 stars → includes "top_rated"', () => {
  expect(calcBadges({ prompts: [{ avgRating: 4.2 }] })).toContain('top_rated');
});

test('calcBadges: 100+ points → includes "handwerker"', () => {
  expect(calcBadges({ totalPoints: 150 })).toContain('handwerker');
});
```

### E2E Tests
```typescript
test('Profile: load profile → see name, level, points, rank', async () => {
  // Select Alice (userId: 1)
  // Navigate to /profile
  // Verify: name, level badge, 285 points, rank #3 visible
});

test('Profile: see progress bar for next level', async () => {
  // Load profile for Alice (285 points)
  // Verify: progress bar visible, shows % to next level
  // Verify: text "Next: 300 points" or similar
});

test('Profile: see all prompts with usage counts', async () => {
  // Load profile
  // Verify: 3 prompts listed
  // Verify: first shows "15×" (used 15 times)
  // Verify: sorted by usage descending
});

test('Profile: badges appear for achievements', async () => {
  // Load profile for Alice (who has multiple achievements)
  // Verify: 5 earned badges visible (green/highlighted)
  // Verify: 2 locked badges visible (gray/dimmed)
  // Verify: badge tooltips show description ("5 prompts submitted", etc)
});

test('Profile: mobile view', async () => {
  // Playwright mobile viewport (375px)
  // Load profile
  // Verify: no overflow, badges stack vertically
  // Verify: all info readable on small screen
});

test('Profile: empty state for 0 prompts', async () => {
  // Create new user (has 0 prompts)
  // Load profile
  // Verify: message "No prompts yet"
  // Verify: link to /submit
});
```

## Implementation Checklist

1. [ ] Check: GET /api/users/[id] returns usageCount, avgRating, voteCount
   - If not: modify `app/api/users/[id]/route.ts` to include them
2. [ ] Add `// @spec AC-BIZ-01, AC-BIZ-02, AC-BIZ-03, AC-BIZ-04, AC-BIZ-05, AC-BIZ-06, AC-BIZ-07` to profile/page.tsx
3. [ ] Verify ProfilePage maps `prompts.usageCount` to display
4. [ ] Verify badges are calculated (check existing BADGES array)
5. [ ] Write/verify unit tests for calcBadges()
6. [ ] Write/verify E2E tests for all scenarios
7. [ ] Test at mobile viewport (375px)
8. [ ] Run `npm run test:unit && npx playwright test`

## Code Review Checklist

- [ ] All Business ACs mapped to code
- [ ] File paths are real
- [ ] // @spec comments present
- [ ] Tests are concrete
- [ ] Tests pass
- [ ] No tech jargon in comments

## Questions Before Starting?

1. **usageCount already in response?** Check GET /api/users/[id]
2. **Badge logic already exists?** Check existing profile/page.tsx — BADGES array
3. **Should we extract badge logic to lib/badge-helpers.ts** for reusability (leaderboard)?
4. **How strict on mobile testing?** Just phone (375px) or all breakpoints (375, 768, 1024)?
