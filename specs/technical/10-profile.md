# Profile & Badge System – Technical Specification

## Metadata
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 10
- **Derived from**: `specs/business/10-profile.md` v1.0
- **Last Modified**: 2026-04-22

---

## Technical Acceptance Criteria

- [ ] **AC-10-001**: `GET /api/users/[id]` returns complete profile data including name, points, level, rank, and all user prompts with vote counts and average ratings.
  - **Reference**: BAC-10-001
  - **Testable by**: Unit, E2E
  - **Code Location**: `app/api/users/[id]/route.ts`

- [ ] **AC-10-002**: Profile page (`/profile`) loads user data from localStorage (user_id) and displays hero section with name, avatar, level badge, points, and progress bar.
  - **Reference**: BAC-10-002
  - **Testable by**: E2E
  - **Code Location**: `app/(user)/profile/page.tsx`

- [ ] **AC-10-003**: Profile displays user's submitted prompts sorted by `usageCount` descending, with category badge, difficulty badge, usage count, and average rating (star display).
  - **Reference**: BAC-10-003
  - **Testable by**: E2E
  - **Code Location**: `app/(user)/profile/page.tsx`

- [ ] **AC-10-004**: Profile calculates and displays 7 badges based on conditions (first_prompt, five_prompts, popular, top_rated, handwerker, schmied, botschafter); earned badges highlighted, locked badges grayed out.
  - **Reference**: BAC-10-004
  - **Testable by**: Unit, E2E
  - **Code Location**: `app/(user)/profile/page.tsx`

- [ ] **AC-10-005**: Profile page reacts to `userChanged` event (emitted by user selector) and reloads profile data without page reload; shows friendly message when no user selected.
  - **Reference**: BAC-10-005
  - **Testable by**: E2E
  - **Code Location**: `app/(user)/profile/page.tsx`

---

## API Contract

### GET /api/users/[id]

**Request**:
```
GET /api/users/42
```

**Response** (200 OK):
```json
{
  "id": 42,
  "name": "Alice Johnson",
  "department": "Engineering",
  "avatarColor": "#3B82F6",
  "totalPoints": 285,
  "level": "Prompt-Schmied",
  "rank": 3,
  "createdAt": "2026-03-15T10:30:00Z",
  "prompts": [
    {
      "id": 7,
      "title": "System Prompt Generator",
      "titleEn": "System Prompt Generator",
      "category": "prompting",
      "difficulty": "advanced",
      "usageCount": 23,
      "voteCount": 8,
      "avgRating": 4.5,
      "createdAt": "2026-04-10T14:22:00Z"
    },
    ...
  ]
}
```

**Errors**:
- `400` - Invalid user ID format
- `404` - User not found
- `429` - Rate limit exceeded

---

## Data Model

No new Prisma model needed. Profile aggregates existing data:
- `User.id`, `User.name`, `User.department`, `User.avatarColor`, `User.totalPoints`, `User.level`, `User.createdAt`
- `User.prompts[]` relationship (via Prisma include)
- `Vote[]` for each prompt to calculate avgRating
- Rank calculated via COUNT query: `users where totalPoints > currentUser.totalPoints`

**Migrations required**: None (all fields exist from Feature 01)

---

## Component Structure

```
app/(user)/profile/
└── page.tsx                    // Server + Client Component (AC-10-002, AC-10-003, AC-10-004, AC-10-005)

components/
├── LevelBadge.tsx              // Displays level title (reused from Feature 04)
├── CategoryBadge.tsx           // Category label (reused from Feature 02)
└── DifficultyBadge.tsx         // Difficulty label (reused from Feature 02)

lib/
└── profile-helpers.ts          // Badge calculation logic (AC-10-004)
```

---

## Badge System

Seven badges defined in `app/(user)/profile/page.tsx`:

```typescript
const BADGES = [
  { id: 'first_prompt', label: 'First Prompt', icon: '📝', condition: (u) => u.prompts.length >= 1 },
  { id: 'five_prompts', label: 'Productive', icon: '✍️', condition: (u) => u.prompts.length >= 5 },
  { id: 'popular', label: 'Popular', icon: '🚀', condition: (u) => u.prompts.some(p => p.usageCount >= 10) },
  { id: 'top_rated', label: 'Top-Rated', icon: '⭐', condition: (u) => u.prompts.some(p => p.avgRating >= 4) },
  { id: 'handwerker', label: 'Craftsperson', icon: '🔨', condition: (u) => u.totalPoints >= 100 },
  { id: 'schmied', label: 'Prompt Smith', icon: '⚒️', condition: (u) => u.totalPoints >= 300 },
  { id: 'botschafter', label: 'AI Ambassador', icon: '🏅', condition: (u) => u.totalPoints >= 600 },
];
```

**Rules**:
- Badges cannot be lost (one-way achievement)
- All badge conditions checked client-side (computed from user data)
- Earned badges: green background, white text, checkmark
- Locked badges: gray background, 50% opacity, lock icon

---

## Validation (Zod)

**Path Parameter** (`lib/validation.ts`):
```typescript
export const PathId = z.coerce.number().int().positive();
```

**Response Schema** (implicit in response shape above; no separate schema needed):
- `totalPoints`, `voteCount` are integers
- `avgRating` is 0.0–5.0 number
- All timestamps are ISO 8601 strings

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| `GET /api/users/[id]` (p95) | < 100ms |
| Profile page load (p95) | < 500ms |
| Prompts list render (p95) | < 200ms |

**Optimizations**:
- Prompts sorted by usageCount server-side (O(1) via SQL ORDER BY)
- Votes included in single query (no N+1)
- Rank calculated via efficient COUNT query with filter

---

## Security

- [x] Rate limiting on `GET /api/users/[id]` (uses global read limiter)
- [x] Path parameter validated with Zod (positive integer)
- [x] No sensitive data in response (no password, email, API keys)
- [x] User can only see their own localStorage selection (browser-side)
- [x] No PII in logs (prompts contain only public data)

---

## UI Behavior

**Page Loads**:
- Show skeleton loaders (animated placeholders) while fetching
- Fetch triggered on component mount via `useEffect`
- Subscribe to `window.userChanged` event for reactive updates

**No User Selected**:
- Display: "No user selected" message with instruction to select name in top right
- Show empty state, not error

**User Switched**:
- Event listener fires on `userChanged`
- Fetch new user data
- Render profile without page reload

**Sorting**:
- Prompts sorted by `usageCount` (highest first) — communicates most successful prompts
- Reflects importance: "what did I create that matters most?"

**Badges**:
- Earned and locked shown together (not separate sections initially)
- Visual distinction: color + lock icon
- Hover shows full description

---

## Tests

### Unit Tests (`tests/unit/profile.test.ts`)
- Badge condition functions evaluate correctly for edge cases (0 prompts, 100 points, etc.)
- Average rating calculation (empty votes, single vote, multiple votes)
- Rank calculation (no higher scores, one higher score, many higher scores)

### E2E Tests (`tests/e2e/profile.spec.ts`)
- User loads profile after selecting name → sees own data
- Profile data matches API response values
- Prompts display in correct order (usage count descending)
- Badges display correctly (earned highlighted, locked grayed out)
- No user selected → shows message
- Switching user via dropdown → profile updates without reload

---

## Dependencies

| Dependency | Type | Why |
|------------|------|-----|
| Feature 01 – User Identity | required | User model with totalPoints, level, createdAt |
| Feature 02 – Prompt Library | required | Prompts relationship, usageCount |
| Feature 03 – Voting System | required | Votes for avgRating calculation |
| Feature 04 – Gamification | required | Level thresholds, badge level thresholds |
| Prisma Client | required | Database queries with include/select |

---

## Change History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-04-22 | Initial spec — feature was implemented, now documented |
