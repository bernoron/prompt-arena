# Profile & Badge System – Business Specification

## Metadata
- **Status**: `approved`
- **Version**: 1.0
- **Feature-Nr**: 10
- **Product Owner**: PromptArena Team
- **Last Modified**: 2026-04-22
- **Technical Spec**: `specs/technical/10-profile.md`

---

## Business Context

Every employee should be able to see at a glance what they have accomplished on the platform: which prompts they've submitted, how often they're used, what rank they hold, and what achievements they've earned. The personal profile creates transparency about one's contribution and motivates through visible milestones (badges). Through display on a public profile page, healthy competition emerges—colleagues can view each other's profiles.

---

## Target Audience

| Role | Description | Primary Benefit |
|------|-------------|-----------------|
| Employee (own profile) | Logged-in user | Overview of progress, badges, and prompt portfolio |
| Employee (peer profile) | Any user | Can view colleague profiles from the leaderboard |
| Admin | Platform manager | Profile view for activity overview |

---

## User Stories

- As an **employee**, I want to view my personal profile and see at a glance my current points, level, and progress to the next level.
- As an **employee**, I want to see all prompts I've submitted, including how many times they've been used and how they've been rated.
- As an **employee**, I want to collect badges for milestones so that my achievements are visibly recognized.
- As an **employee**, I want to access my profile as soon as I select my name in the top right—without separate registration.

---

## Business Acceptance Criteria

- [ ] **BAC-10-001**: The profile displays name, department, level title, and current rank among all employees.
  - **Measurement**: All four pieces of information are visible and match current database values.
  - **Business Rule**: Rank is determined by the count of employees with more points + 1. In case of a tie, the earlier registration date wins.

- [ ] **BAC-10-002**: The profile displays a progress bar toward the next level milestone.
  - **Measurement**: The progress bar and point count match the gamification system (level thresholds from Feature 04).
  - **Business Rule**: At max level (AI Ambassador, 600+ points), instead of a bar, "Maximum level reached" is displayed.

- [ ] **BAC-10-003**: The profile lists all submitted prompts with usage count and rating.
  - **Measurement**: All user prompts appear; usage count and average rating match current values.
  - **Business Rule**: Prompts are sorted by usage count (descending). If no prompts exist, a helpful message with a link to the submission page is shown.

- [ ] **BAC-10-004**: The profile shows earned badges and unreached badges (locked).
  - **Measurement**: Earned badges are highlighted in color; unreached badges are grayed out and locked.
  - **Business Rule**: Badges cannot be lost once earned. The 7 badges are: First Prompt (1+ prompts), Productive (5+ prompts), Popular (prompt used 10+ times), Top-Rated (prompt with avg ≥ 4 stars), Craftsperson (100 points), Prompt Smith (300 points), AI Ambassador (600 points).

- [ ] **BAC-10-005**: The profile is accessible via direct URL and handles missing users correctly.
  - **Measurement**: Without a selected user, a clear message appears. With a selected user, all profile data loads without page reload.
  - **Business Rule**: The profile reacts to user switching (when a colleague selects their name in the top right) and updates immediately.

---

## Not in Scope

- Editing own profile (name, department, avatar) by users
- Private messaging between employees
- Follower/friend lists
- Manual badge assignment by admins
- Profile pictures (photos)—only colored initial avatars
- Comments on profile

---

## Dependencies

| Feature / System | Type | Description |
|-----------------|------|-------------|
| Feature 01 – User Identity | required | Profile based on user account (name, points, level) |
| Feature 02 – Prompt Library | required | User's submitted prompts with usage count |
| Feature 03 – Voting System | required | Average rating of prompts |
| Feature 04 – Gamification | required | Level thresholds, progress bar |

---

## Risks & Assumptions

| # | Description | Likelihood | Mitigation |
|---|-------------|-----------|-----------|
| R1 | Employees might compare profiles and feel demotivated by leaderboard position | medium | Progress bar emphasizes personal progress; badges reward activity, not just rank |
| A1 | Employees primarily view their own profile | high | Optimize for own-profile view; peer profile access via leaderboard as secondary path |

---

## Success Metrics (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Profile views per week | ≥1 per active user | API logs: GET /api/users/[id] |
| "First Prompt" badge earned | >80% of registered users within 4 weeks | DB query: users with ≥1 prompt |

---

## Change History

| Version | Date | Change | Approved By |
|---------|------|--------|-------------|
| 1.0 | 2026-04-22 | Initial version—feature was implemented but not specified | PromptArena Team |

---

## Approval

- [ ] **Product Owner Approval**: ___________________________ Date: ___________
- [ ] **Business Analyst Review**: ___________________________ Date: ___________
