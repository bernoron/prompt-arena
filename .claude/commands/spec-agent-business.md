# Spec Agent for Business Analysts & Product Owners

## Purpose
Help POs and BAs write clear, measurable Business Specifications without technical jargon.

## How to Use

```
/spec-agent-business
Feature: [Feature Name]
Action: [write | review | refine]
Content: [paste spec or describe idea]
```

## Examples

### Action: write
User describes a business idea, agent structures it into a Business Spec.

```
/spec-agent-business
Feature: Employee Badges
Action: write
Content: "We want to recognize employees who submit good prompts. 
They should see badges when they hit milestones."
```

Agent responds with:
```markdown
# Employee Badges – Business Spec Draft

## The Problem
Employees don't see recognition for quality contributions. 
No motivation to improve their prompts.

## Who Benefits?
- Employees: See visual recognition for achievements
- Company: Drives quality and engagement

## What We're Building?
Employees see badges appear when they submit 5 prompts, 
when their prompt gets 10+ uses, etc.

## How Do We Know It Works?
- [ ] Employee sees badge appear when they achieve milestone
- [ ] Badge disappears if they go below threshold ← QUESTION: Should badges be permanent or conditional?
- [ ] New employees without badges get helpful message
- [ ] Badges are visible on their profile page

## What's NOT in This Release
- Badge shop / paid badges
- Trading badges
- Notifications when badges appear

---
**Questions for you:**
1. Once earned, should badges be permanent? Or go away if metrics drop?
2. Should we show how close an employee is to next badge ("2 more uses to Popular")?
3. Are there any other badge types we should consider beyond the ones you mentioned?
```

User refines, agent iterates.

---

### Action: review
Agent checks if a Business Spec is clear, measurable, and has no tech jargon.

```
/spec-agent-business
Feature: Profile Page
Action: review
Content: [paste your spec]
```

Agent responds:
```
✅ GOOD:
- Problem is clear ("Authors can't see usage")
- Who benefits is specific ("Authors")
- What we're building is non-technical

⚠️  NEEDS WORK:
1. AC #2: "Badge system shows achievements" — TOO VAGUE
   → Make it concrete: "Employee sees 'Popular' badge when prompt is used 10+ times"
   
2. AC #4: "Mobile responsive" — NOT MEASURABLE
   → How do we test it? Specific breakpoints? Or just "looks good on phone"?

3. Missing clarity: "Usage counter updates in real-time"
   → Does "real-time" mean < 1 second? Or OK if they refresh page?

❓ CLARIFY:
- What happens if employee deletes a prompt? Do badges disappear?
- Should badges be editable by admin?

🎯 Next Step:
Refine these ACs, then send back for final review before Dev starts.
```

---

### Action: refine
Agent helps improve a specific AC that's too vague or technical.

```
/spec-agent-business
Feature: Badges
Action: refine
Content: |
  Current AC: "Real-time badge sync across all user devices"
  
  I think this is too technical, but I'm not sure how to simplify.
```

Agent responds:
```
🎯 SIMPLER VERSION:

Instead of: "Real-time badge sync across all user devices"

Try one of these (choose based on what you actually need):

**Option A** (Most lenient):
"Employee sees their latest badge within a few minutes of earning it"
→ Means: We can update once per minute, that's fine

**Option B** (More strict):
"When an employee earns a badge, they see it on their profile immediately after refreshing the page"
→ Means: Data is current, but they need to refresh

**Option C** (Very strict):
"Badge appears within 5 seconds of the event that earned it"
→ Means: Real-time updates, websockets maybe needed

💬 Which of these matches what you actually need?
If none fit, describe the employee experience: "When they use a prompt and it reaches 10 uses, then..."
```

---

## What Makes a Good Business AC?

✅ **DO**:
- One sentence per AC
- Describe **what the user sees/does**, not how it works
- Be specific ("Usage counter shows a number" vs "System is updated")
- Be measurable ("User can see X" vs "User likes the feature")

❌ **DON'T**:
- Use tech words: "API", "database", "real-time sync", "cache", "microservice"
- Describe implementation: "Add usageCount field", "Fetch from endpoint", "Use React state"
- Mix AC types: One AC = one user-visible behavior

---

## Common Mistakes Agent Catches

```
❌ "The system should track prompts efficiently"
✅ "Users can see how many times their prompt was used"

❌ "Implement badge calculation via enum"
✅ "Employee sees 'Popular' badge when prompt reaches 10 uses"

❌ "Real-time data synchronization"
✅ "Usage count updates when page is refreshed"

❌ "Graceful degradation without user"
✅ "Anonymous visitors see message: 'Sign in to see your prompts'"
```

---

## Agent Checklist (Runs Automatically)

When you send a spec, agent checks:

```
☑️ No mentions of: API, database, component, route, fetch, state, cache, real-time
☑️ Each AC is one sentence (if longer, split it)
☑️ Each AC describes user action or what they see (not system behavior)
☑️ No negations ("doesn't show") — rephrase positively
☑️ "Not in Scope" prevents misunderstanding
☑️ At least 3 ACs, max 8 (if more, split into multiple features)
```

---

## Next Step

Once Business Spec is approved:
```
/spec-translate
Business Spec: specs/business/NN-feature-name.md
```

This generates the Technical Implementation plan for Devs.
