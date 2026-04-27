# Spec Agent: Reverse-Engineer Spec from Code

## Purpose
When code already exists but has no spec, extract what the code does and create specs.

## How to Use

```
/spec-extract-reverse
Feature: [Feature Name]
Code Path: [app/path/to/file.tsx or route.ts]
```

## Example: Existing Profile Feature

```
/spec-extract-reverse
Feature: Profile Page & Badges
Code Path: app/(user)/profile/page.tsx
Code Path: app/api/users/[id]/route.ts
```

Agent:

1. **Reads the code** to understand what it does
2. **Extracts Business AC** — "What user problem does this solve?"
3. **Writes Business Spec** — Plain language, no tech jargon
4. **Maps to Implementation** — Lists code locations and file structure
5. **Asks for validation** — "Is this what you intended?"

Example output:

```markdown
# Profile & Badges – Extracted Business Spec

## What the Code Does
The profile page shows:
- User name, department, avatar, points, level, rank
- All prompts the user submitted (sorted by usage)
- 7 badges earned based on achievement milestones

---

## Reverse-Engineered Business AC

Based on code at `app/(user)/profile/page.tsx`:

- [ ] **AC-1**: User can view their profile with name, points, level, rank
  - Code: Loads from localStorage, fetches GET /api/users/[id]
  - Files: ProfilePage component, UserPicker triggers 'userChanged' event

- [ ] **AC-2**: Profile shows a progress bar to next level
  - Code: getLevelProgress() calculates percentage
  - Files: ProgressBar component

- [ ] **AC-3**: User sees all their submitted prompts sorted by popularity
  - Code: prompts array sorted by usageCount descending
  - Files: ProfilePage map() over prompts array

- [ ] **AC-4**: 7 badges shown (earned highlighted, locked grayed)
  - Code: BADGES array with condition() functions
  - Files: ProfilePage calculates earnedBadges/lockedBadges
  - Badges: first_prompt, five_prompts, popular, top_rated, handwerker, schmied, botschafter

- [ ] **AC-5**: Profile reacts to user switching without page reload
  - Code: window.addEventListener('userChanged', ...) refetches data
  - Files: useEffect with event listener

---

## Questions for PO/BA

1. **Is this feature intentional?**
   → Or was it added during development without requirements?

2. **Is the badge system complete?**
   → Should there be more/different badges?

3. **Missing from code**: What about mobile view?
   → Does this need mobile testing?

4. **Should peer profiles show badges?**
   → Current code only shows own profile

5. **Real-time updates?**
   → Usage counter updates only on page reload. Is this intended?

---

## Next Steps

1. **PO confirms**: "Yes, this matches what we wanted"
2. **Agent creates formal Business Spec** with your answers
3. **Dev writes IMPLEMENTATION.md** mapping this to tests
4. **We add E2E tests** for each AC
```

---

## When to Use This Command

✅ **Do use** when:
- Code exists but was built before specs
- Onboarding team member: "What does this feature do?"
- Validating: "Did dev build what was requested?"
- Writing docs: "What does our app actually do?"

❌ **Don't use** when:
- You're writing a new feature (use `/spec-agent-business` instead)
- Feature is well-documented already
- You need to change the feature (create a Change Request instead)

---

## Output Files

```
specs/business/[feature].md (extracted)
└── Based on actual code behavior
└── With questions for PO/BA validation

app/[feature]/IMPLEMENTATION.md
└── Maps each AC to code files
└── Lists API contracts & database schema
└── Testing plan
```

---

## Example Checklist: Before Extraction is Done

- [ ] All code files analyzed
- [ ] Each visible user behavior → one AC
- [ ] AC descriptions have no tech jargon
- [ ] Questions asked for ambiguous parts
- [ ] PO/BA validates: "Is this what we built?"
