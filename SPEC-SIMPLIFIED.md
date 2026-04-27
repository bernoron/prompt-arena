# Simplified Spec-Driven Development – Quick Start

## Two Workflows

### 🚀 Workflow A: Business Idea → Implementation

**For**: PO/BA has a feature idea and wants to build it.

```
Step 1: PO/BA writes Business Spec
        → Use: specs/business/_template-simple.md
        → Plain language, no tech words
        ↓
Step 2: Agent reviews & helps refine
        → Command: /spec-agent-business
        ↓
Step 3: Dev translates to Implementation plan
        → Command: /spec-agent-translate
        → Output: app/[feature]/IMPLEMENTATION.md
        ↓
Step 4: Dev codes + adds // @spec comments
        → Tests validate all Business ACs pass
        ↓
Step 5: Done! 
        → npm run test:unit && npx playwright test ✅
```

**Commands**:
```bash
/spec-agent-business Feature: "Profile Badges" Action: write
/spec-agent-business Feature: "Profile Badges" Action: review
/spec-agent-translate Business Spec: specs/business/10-profile.md
```

---

### 🔄 Workflow B: Existing Code → Reverse-Engineer Spec

**For**: Code exists but was built without specs. Time to document it.

```
Step 1: Agent reads existing code
        → Command: /spec-extract-reverse Feature: "Profile" Code Path: app/(user)/profile/page.tsx
        ↓
Step 2: Agent extracts what it does
        → Writes Business Spec based on actual behavior
        ↓
Step 3: PO/BA reviews & approves
        → "Yes, this is what we wanted"
        ↓
Step 4: Dev fills in Implementation.md
        → Maps code locations, API contracts, tests
        ↓
Step 5: Add tests if missing
        → E2E tests for all Business ACs
        ↓
Step 6: Annotate code with // @spec
        → Now it's traceable
```

**Command**:
```bash
/spec-extract-reverse Feature: "Profile Page" Code Path: app/(user)/profile/page.tsx
```

---

## Two Types of Specs

### 1. Business Specification
**Who writes?** Product Owner / Business Analyst  
**What?** Plain language description of feature  
**Where?** `specs/business/NN-feature-name.md`

**Template**: `specs/business/_template-simple.md`

```markdown
# Feature Name – What We're Building

## The Problem
[Describe user pain point]

## Who Benefits?
[Who uses this, and why?]

## What We're Building?
[Simple description, no tech words]

## How Do We Know It Works?
- [ ] Users can [action]
- [ ] Badge appears when [condition]
- [ ] Works on mobile and desktop
- [ ] [etc]

## What's NOT in this release?
[What are we NOT doing?]
```

**Quality Check**:
- ✅ Can you say it out loud? Does it make sense?
- ✅ No tech words (no API, database, component, etc)
- ✅ Each AC is ONE sentence
- ✅ Each AC is observable (user sees/does something)

---

### 2. Technical Implementation Plan
**Who writes?** Developer (often assisted by Agent)  
**What?** Maps Business Specs to code files & tests  
**Where?** `app/[feature]/IMPLEMENTATION.md`

**Template**: `app/_IMPLEMENTATION_TEMPLATE.md`

```markdown
# Feature Name – Implementation Plan

## Requirement → Code Mapping
| Business AC | How | Where | Test |
|---|---|---|---|
| Users see badge | calcBadges() in ProfileCard | app/(user)/profile/page.tsx | E2E: badges visible |

## Code Files
- Create: lib/badge-helpers.ts
- Modify: components/ProfileCard.tsx

## API Changes
GET /api/users/[id] includes prompts.usageCount

## Tests
- Unit: calcBadges() handles all thresholds
- E2E: load profile, see badges
```

**Quality Check**:
- ✅ Every Business AC is mapped to a code file
- ✅ All file paths are real (or will be created)
- ✅ API contracts are complete
- ✅ Tests are concrete (not "test it")

---

## The Spec Agent: Your Assistant

The Agent helps both POs and Devs.

### For PO/BA: Writing Business Specs

```
/spec-agent-business
Feature: [Name]
Action: write                    (from idea → first draft)
    or: review                   (is my spec clear?)
    or: refine                   (help improve one AC)
Content: [paste spec or idea]
```

**Agent checks**:
- Is the problem clear?
- Is the solution concrete or too vague?
- Are there tech words that don't belong?
- Are all ACs measurable?
- What questions do you need to answer?

### For Dev: Translating to Code

```
/spec-agent-translate
Business Spec: specs/business/10-profile.md
Action: analyze                  (what's needed?)
    or: extract-implementation   (code mapping)
    or: validate-code           (does existing code match?)
```

**Agent generates**:
- Table: Business AC → code file mapping
- List: files to create/modify
- API contract
- Test scenarios
- Implementation order

### For Onboarding: Reverse-Engineering

```
/spec-extract-reverse
Feature: [Name]
Code Path: app/path/to/file.tsx
```

**Agent extracts**:
- What the code actually does
- Reverse-engineered Business Spec
- Questions for validation
- Implementation.md mapping

---

## Example: End-to-End

### PO writes Business Spec

**File**: `specs/business/10-profile.md`

```markdown
# Profile & Badges – What We're Building

## The Problem
Authors don't see how popular their prompts are. 
They have no motivation to improve.

## Who Benefits?
Prompt authors see usage feedback. 
They compete for "popular" status.

## What We're Building?
Authors see a counter next to each prompt 
showing how many times it was used. 
Popular prompts (10+) get a special badge.

## How Do We Know It Works?
- [ ] Authors see usage count for each prompt
- [ ] "Popular" badge appears at 10+ uses
- [ ] Works on mobile and desktop
- [ ] Message appears if author has 0 prompts

## What's NOT in This Release?
- Analytics dashboard
- Historical trends
- Export data
```

### Agent reviews

```
/spec-agent-business
Feature: Profile & Badges
Action: review
Content: [above spec]
```

**Agent**: 
```
✅ Problem is clear
✅ Who benefits is specific
✅ What we're building is concrete
⚠️  AC #3: "Works on mobile" — how do we test this?
    Specific breakpoints (375px phone) or just "looks OK"?
✅ All other ACs are concrete
```

### PO refines

```
Update AC: "Displays correctly on phone (375px) and desktop (1280px)"
```

### Dev translates

```
/spec-agent-translate
Business Spec: specs/business/10-profile.md
Action: extract-implementation
```

**Agent generates** `app/profile/IMPLEMENTATION.md`:

```markdown
# Profile & Badges – Implementation Plan

## Mapping
| Business AC | Implementation | Code File | Test |
|---|---|---|---|
| Authors see usage count | GET /api/users/[id] returns prompts with usageCount | app/api/users/[id]/route.ts | profile.e2e.ts |
| Popular badge at 10+ | calcBadges() returns 'popular' if usageCount >= 10 | lib/badge-helpers.ts | profile.unit.ts |
| Mobile + desktop | ProfileCard responsive with Tailwind | components/ProfileCard.tsx | playwright mobile viewport |
| Empty state message | Show message + /submit link if no prompts | app/(user)/profile/page.tsx | profile.e2e.ts |

## Files
Create: lib/badge-helpers.ts
Modify: app/(user)/profile/page.tsx, components/ProfileCard.tsx

## Tests
- Unit: calcBadges() with 0, 1, 15 prompts
- E2E: Load profile → see counts + badges
- E2E: Mobile (375px) → badges display correctly
```

### Dev codes

```typescript
// app/(user)/profile/page.tsx
// @spec AC-10-001, AC-10-002, AC-10-003, AC-10-004
export default function ProfilePage() {
  const badges = calcBadges(prompts);
  return <ProfileCard badges={badges} prompts={prompts} />;
}
```

### Tests run

```bash
npm run test:unit       ✅ calcBadges logic
npx playwright test     ✅ Profile page display + mobile
```

### Done! 🎉

```
spec-check output:
✓ Feature 10: 4/4 ACs at 100%
✓ All Business ACs have code + tests
```

---

## Quick Reference: Commands

| Command | When | What |
|---------|------|------|
| `/spec-agent-business Feature: X Action: write` | New idea | PO writes first draft |
| `/spec-agent-business Feature: X Action: review` | Draft done | Agent checks clarity |
| `/spec-agent-business Feature: X Action: refine` | One AC unclear | Help improve wording |
| `/spec-agent-translate Business: [file] Action: analyze` | Before coding | What code is needed? |
| `/spec-agent-translate Business: [file] Action: extract-implementation` | Before coding | Generate Implementation.md |
| `/spec-agent-translate Code: [file] Action: validate-code` | After coding | Does code match spec? |
| `/spec-extract-reverse Feature: X Code Path: [path]` | Existing code | Extract Business Spec |

---

## File Locations

```
specs/
  business/
    _template-simple.md         ← PO/BA uses this template
    10-profile.md               ← Each feature gets one
    
app/
  [feature]/
    IMPLEMENTATION.md           ← Dev writes this
  _IMPLEMENTATION_TEMPLATE.md   ← Dev uses this template
  (user)/profile/
    page.tsx                    ← Code with // @spec comments
```

---

## Success Criteria

✅ **Business Spec is Good When**:
- PO/BA wrote it (not Dev)
- Has no tech words
- Each AC is one sentence
- Each AC describes what user sees/does
- Someone outside the team can understand it

✅ **Implementation.md is Good When**:
- Every Business AC is mapped to code
- All file paths are real
- Test scenarios are concrete
- Dev can code without guessing

✅ **Code is Good When**:
- Has `// @spec AC-XX-YYY` comments
- All tests pass
- `npm run test:unit && npx playwright test` ✅

---

## Key Principle

> **Business Spec = WHAT (no tech)**  
> **Implementation = HOW (all the tech)**  
> **Code = WORKING SOLUTION**

All three linked by AC numbers. One fails? You notice immediately.
