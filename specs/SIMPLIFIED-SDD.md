# Simplified Spec-Driven Development

## Two-Layer Architecture

```
Layer 1: Business Specification
   ↓ (PO/BA writes in plain language)
Layer 2: Technical Implementation
   ↓ (Developers implement + annotate code)
Code with @spec markers
```

---

## Layer 1: Business Specification (PO/BA writes this)

**Goal**: Describe WHAT the user needs and WHY, in plain business language.  
**No technical jargon. No implementation details.**

### Template: `specs/business/NN-feature-name.md`

```markdown
# [Feature Name] – What We're Building

## The Problem
[1-2 sentences describing the user pain point or opportunity]
Example: "Users can't track how many times their prompts are used. 
They have no motivation to improve popular prompts."

## Who Benefits?
[1-2 sentences: who uses this feature and how do they benefit]
Example: "Prompt authors see usage metrics and compete for popularity. 
This drives quality improvement."

## What Are We Building?
[Simple, non-technical description of the feature]
Example: "When users click on a prompt they created, 
they see how many times it's been used and get a badge for popular prompts."

## How Do We Know It Works?
[3-5 acceptance criteria — each is a **single sentence**, measurable, no tech words]

- [ ] Users can see how many times their prompt was used
- [ ] A badge appears when a prompt reaches 10+ uses
- [ ] The usage counter updates in real-time
- [ ] Users can see which of their prompts is most popular
- [ ] Mobile view shows the same information

## What's NOT in this release?
[What are we explicitly NOT doing?]
- User analytics dashboard (future feature)
- Detailed usage graphs
- Export usage reports
```

---

## Layer 2: Technical Implementation (Developers write this)

**Goal**: Translate business AC into technical requirements.  
**Code locations, API contracts, data model changes.**

### Template: `app/[feature-folder]/IMPLEMENTATION.md`

```markdown
# [Feature Name] – How We're Building It

## Maps Business AC to Code

| Business AC | How We Implement | Where | Test |
|------------|------------------|-------|------|
| "Users can see usage count" | GET /api/users/[id]/prompts returns `usageCount` | `app/api/users/[id]/route.ts` | E2E: profile page loads count |
| "Badge appears at 10+ uses" | Client-side calculation in ProfileCard component | `components/ProfileCard.tsx` | Unit: `calcBadges(prompts)` |
| "Counter updates real-time" | Fetch on page mount + refetch after prompt use action | `app/(user)/profile/page.tsx` | E2E: use prompt → count updates |

## Code Changes Needed

**Files to create/modify**:
- `app/(user)/profile/page.tsx` — Profile page (new)
- `app/api/users/[id]/route.ts` — Add `usageCount` to response
- `components/ProfileCard.tsx` — Display badges
- `lib/profile-helpers.ts` — Badge calculation logic
- `tests/e2e/profile.spec.ts` — Profile E2E tests

## Database Changes
- No new fields needed (usageCount already exists on Prompt model)

## API Example
```
GET /api/users/42/prompts
Response: [
  { id: 1, title: "...", usageCount: 15, avgRating: 4.2 },
  { id: 2, title: "...", usageCount: 3, avgRating: 3.8 }
]
```

## Testing Checklist
- [ ] Unit: calcBadges() returns correct badges for usage thresholds
- [ ] E2E: User loads profile, sees usage counts and badges
- [ ] E2E: Using a prompt increments its usage counter
```

---

## Two Workflows

### Workflow A: Business Idea → Spec → Code ✨

```
1. WRITE Business Spec
   → PO/BA describes feature in plain language
   → Agent reviews & asks clarifying questions
   → PO/BA refines until clear

2. TRANSLATE to Technical Implementation
   → Dev reads business spec
   → Dev writes Implementation.md
   → Dev maps each Business AC to code locations
   → Agent reviews: "Does this actually implement the AC?"

3. CODE
   → Dev implements per Implementation.md
   → Dev marks code with // @spec comments
   → Tests validate each AC

4. VERIFY
   → Run spec-check: all ACs have code?
   → Run tests: all AC tests pass?
   → PO/BA reviews: "Does this solve the problem?"
```

### Workflow B: Existing Code → Reverse-Engineer Spec 🔄

```
1. READ Code
   → Dev/Agent scans existing feature code
   → Identifies what it actually does

2. EXTRACT Business AC
   → "What problem does this solve?"
   → "Who benefits?"
   → Write plain-language Business Spec

3. MAP to Implementation
   → Dev writes Implementation.md
   → Adds code locations & how it works
   → Agent checks: "Do code + spec match?"

4. VALIDATE with PO/BA
   → PO/BA reads Business Spec
   → Confirms: "Is this what we wanted?"
   → Refine if needed
```

---

## The Agent: Your Spec Assistant

The `/spec-agent` will help you:

### For Business Specs:
✅ "Is my AC measurable? Or too vague?"  
✅ "Am I describing WHAT (good) or HOW (bad)?"  
✅ "What's missing? What's ambiguous?"  
✅ "Is this actually a PO/BA job, or should Dev write it?"

### For Technical Specs:
✅ "Does my Implementation.md actually solve each Business AC?"  
✅ "Are my code paths real? Do those files exist?"  
✅ "What tests should I write?"  
✅ "Does the existing code already do this?"

### Usage:

**Refine a Business Spec:**
```
/spec-agent
Feature: Profile & Usage Badges
File: specs/business/10-profile.md
Action: review
```

**Translate Business → Technical:**
```
/spec-agent
Business Spec: specs/business/10-profile.md
Action: extract-implementation-plan
```

**Reverse-Engineer from Code:**
```
/spec-agent
Feature Code: app/(user)/profile/page.tsx
Action: extract-business-spec
```

---

## When to Use Each Workflow

**Workflow A (Business → Code)**: 
- New feature request from business
- Unimplemented idea
- PO has a requirement

**Workflow B (Code → Spec)**:
- Feature already exists but unspecified
- Onboarding new team member ("What does this do?")
- Validating existing implementation

---

## Quality Checklist: Business Spec Ready?

- [ ] **The Problem** is clear (not "improve the app")
- [ ] **Who Benefits** is specific (not "everyone")
- [ ] **What We're Building** has NO tech words (no API, no database, no component names)
- [ ] **Each AC is one sentence** (test: can you say it out loud?)
- [ ] **Each AC is measurable** (someone can verify it works)
- [ ] **Not in Scope** prevents misunderstanding (what are we NOT doing?)

If any box is unchecked → `/spec-agent` to refine.

---

## Quality Checklist: Technical Spec Ready?

- [ ] **Each Business AC is mapped** to specific code files
- [ ] **All file paths are real** (files exist or will be created)
- [ ] **API contract is complete** (request format, response format, errors)
- [ ] **Database changes are listed** (or "no changes needed")
- [ ] **Test scenarios are concrete** (not "test it")
- [ ] Code paths match reality (grep for them in project)

If any box is unchecked → `/spec-agent` to fix.

---

## Commands

```bash
# Write a new Business Spec
/spec-write-business Feature: "Profile & Badges"

# Extract Implementation plan from Business Spec
/spec-translate specs/business/10-profile.md

# Reverse-engineer Business Spec from existing code
/spec-extract-from-code app/(user)/profile/page.tsx

# Review a Business Spec for clarity
/spec-review specs/business/10-profile.md kind=business

# Review a Technical Spec for completeness
/spec-review app/[feature]/IMPLEMENTATION.md kind=technical

# Check if code matches specs
/spec-check
```

---

## Example: End-to-End

### Step 1: PO writes Business Spec

```markdown
# Profile & Usage Badges

## The Problem
Authors can't see how popular their prompts are. 
No feedback loop to improve.

## Who Benefits?
Authors see which prompts matter to the team. 
Motivates iteration and quality.

## What We're Building
Authors see a counter showing how many times each prompt was used. 
Popular prompts (10+) get a badge.

## How Do We Know It Works?
- [ ] Authors see usage count for each of their prompts
- [ ] Badges appear for prompts with 10+ uses
- [ ] Usage counter updates when someone uses a prompt
- [ ] Mobile view shows the same information
- [ ] Works for users with 0 prompts (shows message)

## What's NOT in This Release
- Analytics dashboard
- Usage trends over time
- Export data
```

### Step 2: /spec-agent reviews

```
Agent: "Good start! Questions:
1. 'Usage counter updates when someone uses' — is this real-time (< 1s)?
   Or is refresh-on-page-load OK?
2. 'Mobile view' — should we test all breakpoints, or just phone?
3. 'Works for users with 0 prompts' — should we link to submission page?"
```

### Step 3: PO refines

```
PO: "1. Refresh-on-load is fine. 2. Phone size only. 
3. Yes, link to /submit."
```

### Step 4: Dev writes Implementation.md

```markdown
# How We're Building It

| Business AC | Implementation | Where | Test |
|---|---|---|---|
| See usage count | GET /api/users/[id] includes prompts.usageCount | app/api/users/[id]/route.ts | profile.e2e.ts: load profile, count visible |
| Badge at 10+ uses | ProfileCard checks usageCount >= 10 | components/ProfileCard.tsx | profile.unit.ts: calcBadges() |
| Counter updates | Profile page refetches after use action | app/(user)/profile/page.tsx | profile.e2e.ts: use prompt, reload, count +1 |
...
```

### Step 5: /spec-agent reviews Implementation.md

```
Agent: "
✅ All BCs mapped
✅ File paths are real
⚠️  'Refetches after use action' — add code location showing event listener
✅ Tests are concrete"
```

### Step 6: Dev fixes, then codes

```typescript
// app/(user)/profile/page.tsx
// @spec AC-10-001, AC-10-002, AC-10-003, AC-10-004, AC-10-005
export default function ProfilePage() { ... }
```

### Step 7: Tests run

```
✅ profile.unit.ts: calcBadges() ✓
✅ profile.e2e.ts: load profile, see count ✓
✅ profile.e2e.ts: use prompt, count updates ✓
```

### Step 8: PO verifies

```
PO: "Perfect. This is what we wanted."
```

---

## Key Principles

1. **Business Spec = PO/BA responsibility**  
   → No tech words, no file paths, no implementation details

2. **Technical Spec = Dev responsibility**  
   → Maps BCs to code, concrete file paths, API contracts

3. **Agent helps both**  
   → Clarity, completeness, alignment

4. **Code annotated with `// @spec`**  
   → Traceable link between spec and implementation

5. **Tests validate ACs**  
   → Each AC has a test that confirms it works
