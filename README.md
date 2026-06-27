# PromptArena

PromptArena is an internal Next.js app for collecting, rating, favoriting, and learning from practical AI prompts. It combines a prompt library, gamification, weekly challenges, an admin panel, and a lightweight spec-driven development workflow.

## Tech Stack

- Next.js 14 App Router
- React 18
- Prisma 5 with SQLite for local development
- Tailwind CSS
- Vitest for unit tests
- Playwright for fast spec-contract tests

## Getting Started

Install dependencies:

```bash
npm ci
```

Create a local environment file:

```bash
cp .env.example .env
```

Set at least these values in `.env`:

```env
DATABASE_URL="file:./dev.db"
ADMIN_SECRET="replace-with-a-local-admin-password"
USER_SECRET="replace-with-at-least-32-random-characters"
```

Prepare the database:

```bash
npm run db:generate
npm run db:reset:dev
```

Start the app:

```bash
npm run dev
```

Open http://localhost:3000.

## Useful Scripts

```bash
npm run dev              # local dev server
npm run build            # production build
npm run lint             # ESLint
npm run test:unit        # unit tests
npm run test:e2e         # spec-contract tests against the running app
npm run test             # unit + e2e
npm run db:generate      # regenerate Prisma client
npm run db:reset:dev     # reset local DB and seed data
npm run docs             # generate docs from specs
```

## Authentication Model

The admin area is protected by `ADMIN_SECRET` and an HttpOnly `admin_session` cookie.

User identity is intentionally lightweight: selecting a user creates a signed HttpOnly `user_session` cookie using `USER_SECRET`. Mutating API routes verify that the body `userId` matches the signed cookie user. If `USER_SECRET` is not set, local development falls back to trusting the body user ID for backward compatibility.

## Project Structure

```text
app/                  Next.js routes, pages, and API handlers
components/           Shared UI components
hooks/                Client hooks
lib/                  Server/client helpers, validation, auth, points logic
prisma/               Prisma schema, migrations, and seed data
specs/                Business and technical specifications
tests/unit/           Vitest tests
tests/e2e/            Playwright tests
docs/                 Generated and curated documentation
```

## Quality Gates

Before pushing, run:

```bash
npm run lint
npm run test:unit
npm run build
```

The E2E suite is intentionally small and spec-driven. It tests core business contracts through real HTTP flows instead of brittle UI selectors:

- identity and session handling
- prompt library contracts
- submit, vote, favorite, and usage flows
- admin authentication and stats protection
- learning module read/completion flow

For larger visual changes, add focused UI tests only for the affected workflow.

```bash
npm run test:e2e
```

CI runs unit tests, Playwright tests, type checking, linting, and a production build on pushes and pull requests to `main`.

## Releases

Releases are managed by Release Please on pushes to `main`.

Use Conventional Commit prefixes so the next version is calculated correctly:

```text
fix: repair session cookie verification      # patch release, e.g. v5.0.1
feat: add a new learning module              # minor release, e.g. v5.1.0
feat!: change public API behavior            # major release, e.g. v6.0.0
docs: update setup guide                     # changelog only, no version bump by itself
test: simplify spec contract suite           # changelog only, no version bump by itself
```

Workflow:

1. Merge normal work into `main`.
2. The `Release Please` workflow opens or updates a release PR.
3. Review the generated `CHANGELOG.md`, `package.json`, and `package-lock.json` changes.
4. Merge the release PR.
5. Release Please creates the Git tag and GitHub Release.

## Docker

The Dockerfile builds a standalone Next.js runtime image. The Next config sets `output: 'standalone'`, so `.next/standalone` is produced during `npm run build`.

Build locally:

```bash
docker build -t prompt-arena .
```

Run locally:

```bash
docker run --rm -p 3000:3000 --env-file .env prompt-arena
```

## Spec-Driven Workflow

Business specs live under `specs/business/`. Technical implementation notes live close to the feature under `app/**/IMPLEMENTATION.md`. Code references acceptance criteria with `@spec` comments where practical.

Use this flow for new work:

1. Clarify the user-facing requirement in a business spec.
2. Map acceptance criteria to files, APIs, and tests.
3. Implement the smallest coherent slice.
4. Add or update tests.
5. Run the quality gates.
