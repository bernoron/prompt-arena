# Spec-Driven Development (SDD) Guide

## Overview

Spec-Driven Development (SDD) is a layered approach to building software where **specifications are the single source of truth**. Every feature is captured in three layers:

1. **Business Spec** — What we're building and why (for Product Owners, Business Analysts)
2. **Technical Spec** — How we're building it (for Developers)
3. **Implementation Code** — The actual code, referenced back to specs via `@spec` annotations

This ensures that **every line of code traces back to a requirement**, and **every requirement has an implementation and tests**.

---

## Why Spec-Driven Development?

### Problems It Solves

- **Scope creep**: Specs make requirements explicit and testable
- **Ambiguity**: Business and technical teams use the same document as source of truth
- **Change management**: Changes to specs are tracked and require approval before code changes
- **Knowledge transfer**: New team members understand not just what code does, but why it exists
- **Traceability**: Automated tools scan code for spec compliance and coverage gaps

### Benefits

| Benefit | Impact |
|---------|--------|
| **Single source of truth** | No conflicting requirements in email chains or Slack |
| **Testability** | ACs are unambiguous → tests are clear → fewer defects |
| **Change control** | All changes go through a proposal→impact assessment→approval→implementation workflow |
| **Handoff quality** | New features documented before implementation; old features retain context |
| **Audit trail** | Git history shows both code AND the spec it implements |

---

## Three-Layer Spec Architecture

### Layer 1: Business Specification (`specs/business/NN-feature-name.md`)

**Audience**: Product Owners, Business Analysts, Stakeholders

**Purpose**: Describe *what* we're building and *why*, in non-technical language

**Structure**:
```markdown
# Feature Name – Business Specification

## Metadata
- Status: draft | approved | deprecated
- Version: 1.0
- Feature-Nr: NN
- Product Owner: Name
- Technische Spec: specs/technical/NN-feature-name.md

## Business Context
Why does this feature exist? What problem does it solve?

## Target Audience
Who will use this feature? What's the business value for each role?

## User Stories
- As [Role] I want [Action] so that [Benefit]
- ...

## Business Acceptance Criteria (BAC-NN-NNN)
- [ ] **BAC-10-001**: User can view their profile with points and level
  - **Measurement**: All fields appear and match DB values
  - **Business Rule**: Rank updates in real-time based on points leaderboard

## Not in Scope
Features explicitly excluded from this release

## Dependencies
Other features or systems this depends on

## Risks & Assumptions
Known risks and their mitigations

## Success Metrics (KPIs)
How will we measure if this feature succeeded?

## Change History
Version tracking with dates and approvals
```

**Key Rules**:
- Use business language, no technical jargon
- Write acceptance criteria in measurable terms
- Reference technical spec explicitly
- Status must be `approved` before `/specify-tech` can be called
- All BACs must eventually be marked `[x]` in production

### Layer 2: Technical Specification (`specs/technical/NN-feature-name.md`)

**Audience**: Developers, QA, DevOps

**Purpose**: Describe *how* to implement the feature, grounded in code

**Structure**:
```markdown
# Feature Name – Technical Specification

## Metadata
- Status: draft | approved | deprecated
- Version: 1.0
- Feature-Nr: NN
- Abgeleitet von: Business Spec link
- Letzte Änderung: Date

## Technical Acceptance Criteria (AC-NN-NNN)
- [ ] **AC-10-001**: GET /api/users/[id] returns profile data
  - **Reference**: BAC-10-001
  - **Testable by**: Unit, E2E
  - **Code location**: `app/api/users/[id]/route.ts`

## API Contract
### GET /api/users/[id]
Request: `{}`
Response: `{ id, name, totalPoints, level, rank, prompts: [...], ... }`
Errors: 404 (not found), 429 (rate limited)

## Data Model
Prisma schema changes needed

## Component Structure
```
app/(user)/profile/
  └── page.tsx          // Client Component
components/
  └── ProfileCard.tsx   // Reusable component
lib/
  └── profile-helpers.ts
```

## Validation (Zod)
Input/output schemas

## Performance Requirements
| Metric | Target |
|--------|--------|
| GET /api/users/[id] (p95) | < 100ms |
| Profile page load (p95) | < 500ms |

## Security
- Rate limiting on read endpoints
- No PII in logs
- Input validation on all API params

## Tests
- Unit: profile-helpers.test.ts — calculateRank(), etc.
- E2E: profile.spec.ts — user loads profile, sees correct data

## Implementation Notes
Any gotchas, edge cases, or critical decisions
```

**Key Rules**:
- Each AC references at least one BAC
- File paths must be real (searchable in the codebase)
- API contracts must be complete (params, response, errors)
- Prisma schemas must be valid
- All data model changes must be listed

### Layer 3: Implementation Code

**Location**: `app/`, `components/`, `lib/`, `tests/`

**Rule**: Every file containing business logic must have a `// @spec AC-NN-NNN` comment

**Example**:
```typescript
// @spec AC-10-001, AC-10-004
export async function getUserProfile(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { prompts: true },
  });
  if (!user) return null;
  
  const rank = await calculateRank(user.id);
  const badges = calculateBadges(user);
  
  return { ...user, rank, badges };
}
```

**Annotation Rules**:
- Use `// @spec AC-NN-NNN` for TypeScript/JavaScript
- Multiple ACs: `// @spec AC-10-001, AC-10-002, AC-10-003`
- One per function/component is typical
- Run `npm run spec-check` to verify coverage

---

## Workflow: From Idea to Live Feature

### Phase 1: Propose Feature (Draft Status)

**Who**: Product Owner or stakeholder  
**Input**: Feature description or user request  
**Output**: `specs/business/NN-feature-name.md` with status `draft`

**Steps**:
1. Write business spec with user stories and BACs
2. Reference related features
3. List dependencies
4. Save as `draft`

**Example command** (in Claude Code):
```
/specify-business feature=profile
```

### Phase 2: Business Approval (Approved Status)

**Who**: Product Owner + Stakeholders  
**Input**: Draft business spec  
**Output**: Status changed to `approved`

**Checklist**:
- [ ] All user stories make sense
- [ ] All BACs are measurable
- [ ] Dependencies are identified
- [ ] Not-in-scope is explicit
- [ ] Success metrics are realistic

**Action**: Update status in spec file to `approved`

### Phase 3: Technical Design (Technical Spec)

**Who**: Tech Lead + Developers  
**Input**: Approved business spec  
**Output**: `specs/technical/NN-feature-name.md`

**Steps**:
1. Map each BAC to one or more ACs
2. Define API contracts
3. Design data model
4. List component structure
5. Write Zod validation schemas
6. Define performance targets
7. Save as `draft`

**Example command**:
```
/specify-tech feature=profile
```

### Phase 4: Technical Approval

**Who**: Tech Lead  
**Input**: Draft technical spec  
**Output**: Status changed to `approved`

**Checklist**:
- [ ] All ACs reference BACs
- [ ] API contracts are complete
- [ ] Database changes are minimal/safe
- [ ] Performance targets are achievable
- [ ] Security concerns are addressed
- [ ] Component structure is testable

**Action**: Update status to `approved`

### Phase 5: Implementation

**Who**: Developers  
**Input**: Approved technical spec  
**Output**: Code with `@spec` annotations + tests

**Steps**:
1. Create feature branch: `git checkout -b feature/profile`
2. Implement per technical spec
3. Add `// @spec AC-NN-NNN` annotations
4. Write unit tests for helpers
5. Write E2E tests for user journeys
6. Run `npm run spec-check` — all ACs must have `@spec` annotations
7. Run tests: `npm run test:unit && npx playwright test`
8. Commit: `git commit -m "feat: add profile page — closes #42"`

**Example commit message**:
```
feat: implement profile page with badges

- GET /api/users/[id] returns profile data (AC-10-001)
- Profile page shows points, level, rank (AC-10-002)
- 7 badges earned/locked based on conditions (AC-10-004)
- E2E test: user loads profile, sees own data (AC-10-005)

Closes #42
```

### Phase 6: Review & QA

**Who**: Code reviewers + QA  
**Input**: Pull Request with code  
**Output**: Approved PR

**Checklist**:
- [ ] All `@spec` annotations match AC numbers
- [ ] All ACs mentioned in code are in technical spec
- [ ] No hardcoded values (constants go to `lib/constants.ts`)
- [ ] Zod validation on all API inputs
- [ ] Rate limiting on all read endpoints
- [ ] Tests exist and pass
- [ ] No TypeScript errors (`npm run build`)

### Phase 7: Merge & Deploy

**Who**: Tech Lead  
**Input**: Approved PR  
**Output**: Code merged to main + tagged with semver

**Steps**:
1. Merge PR to `main`
2. Auto-tagging hook runs → bumps `package.json` → creates annotated tag → pushes
3. CI runs: `npm run build` + `npx playwright test`
4. Tag pushed to GitHub

**Example**:
```bash
# Local: git commit + git push origin main
# → PostToolUse hook detects "git push origin main"
# → runs node scripts/auto-tag.mjs
# → reads commits since last tag
# → bumps version (feat: → minor, fix: → patch)
# → creates tag v4.3.0
# → pushes tag + commits
```

### Phase 8: Launch & Monitor

**Who**: DevOps + Product  
**Input**: Merged code on main  
**Output**: Live feature + KPI tracking

**Steps**:
1. Feature deployed to production
2. KPIs tracked (per business spec success metrics)
3. If problems: create Change Request (CR-NNN) and follow change workflow

---

## Change Management: Existing Features

When requirements change on an existing feature, follow the **Change Request (CR)** workflow:

### CR Workflow

1. **Proposed** — someone identifies a needed change
   ```bash
   /change-request feature=profile change="Add verified badge"
   ```
   Creates: `specs/changes/CR-NNN.md` with status `proposed`

2. **Impact-Assessed** — Tech Lead analyzes scope
   - What code changes? What tests? Any breaking changes?
   - Update CR with assessment

3. **Approved** — PO (business) + Tech Lead (technical) sign off
   - Update status to `approved`
   - No code changes allowed until approved

4. **In Progress** — Developer implements change
   - Updates affected business + technical specs
   - Adds/modifies code with updated `@spec` annotations
   - Tests must pass

5. **Implemented** — Change is live
   - All affected ACs marked `[x]`
   - CR status updated to `implemented`
   - Tagged version deployed

### CR Blocking Rules

The `/implement` command **blocks** if:
- A CR exists for this feature but is not yet `approved` → ⛔ BLOCK
- An approved CR's business spec changed without a new CR → ⛔ BLOCK

---

## Spec Files Organization

```
specs/
├── constitution.md              # Non-negotiable project principles
├── spec.md                      # Product vision & scope
├── plan.md                      # Technology decisions
├── tasks.md                     # Feature task list + progress
├── business/                    # Layer 1: Business specs
│   ├── 01-identity.md
│   ├── 02-prompt-library.md
│   ├── ...
│   ├── 10-profile.md            # NEW Feature 10
│   └── _template.md             # Copy for new features
├── technical/                   # Layer 2: Technical specs
│   ├── 01-identity.md
│   ├── 02-prompt-library.md
│   ├── ...
│   ├── 10-profile.md            # NEW Feature 10
│   └── _template.md
└── changes/                     # Change Requests (CRs)
    ├── WORKFLOW.md              # CR process
    ├── CR-001.md
    ├── CR-002.md
    └── _template.md
```

---

## Tools & Commands

### For Product Owners / Business Analysts

```bash
# Write or update business spec (draft)
/specify-business feature=profile

# Approve business spec (move from draft → approved)
/specify-business feature=profile action=approve

# Create a change request for an existing feature
/change-request feature=profile change="Add verified badge"

# View current task status
/tasks
```

### For Developers

```bash
# Generate technical spec from business spec
/specify-tech feature=profile

# Check spec compliance (do all ACs have @spec annotations?)
npm run spec-check

# See which specs don't have code yet
npm run spec-gaps

# List all tasks and current progress
/tasks

# Implement next assigned task
/implement task=TASK-042

# Create a change request (technical perspective)
/change-request feature=profile change="Optimize rank query" type=performance
```

### For DevOps / Reviewers

```bash
# Pre-merge checklist: tests green? specs complete? annotations correct?
npm run test:unit
npx playwright test
npm run spec-check

# Security review
/security-review
```

---

## Spec Checklist: Before You Mark [x]

### Business Spec Ready to Approve?

- [ ] Every BAC is measurable (not "should be good")
- [ ] User stories are realistic (not "do the impossible")
- [ ] Success metrics are trackable (not vague)
- [ ] Dependencies are listed (not assumed)
- [ ] Technical spec reference is filled in
- [ ] Not-in-scope prevents misunderstanding

### Technical Spec Ready to Approve?

- [ ] Every AC references at least one BAC
- [ ] API contracts are complete (method, path, params, response, errors)
- [ ] Data model changes are listed (or "no changes needed")
- [ ] File paths exist in codebase (or will be created)
- [ ] Zod schemas are provided (or "validated elsewhere")
- [ ] Performance targets are realistic for the scale
- [ ] Security rules are explicit (rate limit, validation, logging)
- [ ] Test scenarios are listed (unit + E2E at minimum)

### Code Ready to Merge?

- [ ] All `// @spec AC-NN-NNN` annotations match the spec
- [ ] No new ACs added without updating the technical spec
- [ ] No hardcoded magic values (all go to `lib/constants.ts`)
- [ ] All API inputs validated with Zod
- [ ] All public endpoints rate-limited
- [ ] Unit tests exist for helpers
- [ ] E2E tests cover user journeys
- [ ] `npm run build` succeeds (no TypeScript errors)
- [ ] Tests pass: `npm run test:unit && npx playwright test`
- [ ] Code review sign-off from 1+ dev

---

## Example: Adding a New Feature

### You: Product Owner
1. **Write business spec** for "Verified Badges"
2. **Get approval** from stakeholders
3. **Tell the Tech Lead**: "Feature 11 is approved, specs are ready"

### Tech Lead
1. **Review business spec** for feasibility
2. **Create technical spec** with AC-11-001, AC-11-002, etc.
3. **Map BACs to ACs** (every BAC gets at least one AC)
4. **Estimate effort** — is it 1 sprint or 3 sprints?
5. **Approve technical spec**
6. **Create tasks** in `/tasks` for developers

### Developer
1. **Read technical spec** end-to-end
2. **Create feature branch**: `git checkout -b feature/verified-badges`
3. **Implement each AC** in order
4. **Add `// @spec` annotations** to code
5. **Write tests** for each AC
6. **Commit with clear message**: `feat: add verified badge system`
7. **Open PR** with tech spec link
8. **Pass review**: all annotations, tests green, no hardcoded values
9. **Merge to main** → auto-tag → deploy

### QA / Product
1. **Verify in staging**: all BACs met?
2. **Check KPIs** after production launch
3. **File CR-NNN** if changes needed

---

## Automation: `spec-sync.mjs`

The codebase includes an automated spec scanner that:

1. **Scans all code** for `// @spec AC-NN-NNN` annotations
2. **Compares to specs** — which ACs have code? Which don't?
3. **Generates coverage report**: `✓ 72/72 ACs at 100%`
4. **Runs on every `/implement` push** via PostToolUse hook

**Run manually**:
```bash
npm run spec-check
```

**Output**:
```
✓ Feature 01 – Identity: 8/8 ACs (100%)
✓ Feature 02 – Prompt Library: 12/12 ACs (100%)
✓ Feature 03 – Voting: 8/8 ACs (100%)
...
✓ Feature 10 – Profile & Badges: 5/5 ACs (100%)

📊 Overall: 72/72 ACs at 100%
```

If a spec has no code:
```
❌ Feature 11 – Verified Badges: 0/3 ACs (0%) — NOT STARTED
```

---

## Semver & Tagging

The project uses **Conventional Commits** + **automatic semver bumping**:

### Commit Message Rules

- `feat: ...` → minor bump (v1.0.0 → v1.1.0)
- `fix: ...` → patch bump (v1.0.0 → v1.0.1)
- `chore: ...` → patch bump
- `BREAKING CHANGE: ...` in body → major bump (v1.0.0 → v2.0.0)

### Auto-Tagging

When you `git push origin main`:
1. PostToolUse hook detects the push
2. Runs `node scripts/auto-tag.mjs`
3. Script reads commits since last tag
4. Calculates semver bump based on commit types
5. Updates `package.json` version
6. Creates annotated tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
7. Pushes tag to GitHub
8. CI runs tests on the tag → deploy

**Example**:
```bash
git log v4.2.2..HEAD --oneline
# feat: add verified badges
# fix: profile rank calculation
# chore: update dependencies

# Auto-tag decides: feat = minor bump
# v4.2.2 → v4.3.0
# Creates: git tag -a v4.3.0 -m "Release v4.3.0"
# Pushes: git push origin v4.3.0
```

---

## Troubleshooting

### "My code doesn't have a `@spec` annotation"

**Solution**: Add `// @spec AC-NN-NNN` to the function/component

### "The AC I want to implement isn't in the technical spec"

**Solution**: 
1. File a CR (`/change-request`) to add the AC
2. Get it approved
3. Update the technical spec
4. Then implement the new AC

### "The spec says one thing, the code does another"

**Solution**:
1. Which is correct? The spec or the code?
2. If code is right: update the spec (via CR if it's an existing feature)
3. If spec is right: fix the code
4. Update `@spec` annotations to match

### "I merged code but specs aren't updated"

**Solution**: 
1. Update the technical spec to match the code
2. Make sure all ACs in the spec have `@spec` annotations
3. Run `npm run spec-check` — should show 100%

---

## Key Principles

1. **Specs are the source of truth** — not Slack, not email, not verbal agreements
2. **Every AC must have a test** — unit, E2E, or manual (documented in spec)
3. **Every AC must have code** — `@spec` annotations prove implementation
4. **Changes need approval** — use CRs for existing features, drafts → approved for new
5. **Code is comment** — specs explain *why*, code shows *how*
6. **Automate verification** — `npm run spec-check` runs on every push

---

## FAQ

**Q: Do I have to write specs for every small fix?**
A: No. Use these categories:
- **Bug fix**: quick fix (< 1 hour), no spec needed, just commit message
- **Small feature**: new AC, add to existing technical spec, minor CR
- **Major feature**: new business + technical specs, full workflow
- **Refactoring**: no spec needed, just ensure `@spec` annotations still match

**Q: Can I start coding before specs are approved?**
A: You can write draft specs and start prototyping, but don't merge to `main` until:
1. Business spec is approved by PO
2. Technical spec is approved by Tech Lead
3. All tests pass

**Q: What if requirements change mid-sprint?**
A: File a CR (`/change-request`), go through approval, then implement. Don't just change code.

**Q: How do I know what to build next?**
A: Check `/tasks` — it lists all features and their status. Pick the next task.

**Q: Who approves specs?**
A: Business specs: Product Owner. Technical specs: Tech Lead. Both must agree before implementation.

---

## Next Steps

- Read the **Feature Template**: `specs/business/_template.md`
- Understand the **Change Workflow**: `specs/changes/WORKFLOW.md`
- Check **Current Tasks**: `specs/tasks.md`
- Try `/specify-business feature=your-feature-name`

Welcome to Spec-Driven Development! 🚀
