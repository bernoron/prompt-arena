# PromptArena – Claude Code Instructions

## Permissions
All bash commands, file writes, git operations, npm scripts, and server restarts are **pre-approved**.
Do NOT ask for confirmation before:
- Running `npm run *`, `npx *`, `git *`
- Writing or editing files
- Starting/stopping the dev server
- Running tests
- Committing or pushing to git

## Project Context
- **Stack**: Next.js 14 App Router, Prisma 5 (SQLite), TailwindCSS, TypeScript strict
- **Architecture**: Two completely separate route groups:
  - `app/(user)/` – user-facing app (Navigation bar)
  - `app/admin/` – admin panel (sidebar only, no user nav)
- **Tests**: Vitest (unit) + Playwright (E2E) – always run after changes
- **Dev server**: managed via `.claude/launch.json` → `preview_start("prompt-arena")`

## Development Workflow
1. Make changes
2. Run `npm run test:unit` to check unit tests
3. Run `npm run test:e2e` to check E2E tests
4. Commit with conventional commits (`feat:`, `fix:`, `refactor:`, `test:`)
5. Push to `origin/main`

## Key Files
- `lib/constants.ts` – all magic values (categories, levels, points guide)
- `lib/validation.ts` – all Zod schemas (must update with new enum values)
- `lib/points.ts` – gamification logic
- `lib/db-helpers.ts` – server-only Prisma helpers (`awardPoints`)
- `middleware.ts` – admin auth guard + request logging

## Never
- Use raw SQL (Prisma only)
- Add `any` types
- Put magic values inline (use `lib/constants.ts`)
- Skip Zod validation on POST endpoints
- Skip rate limiting on any route handler
