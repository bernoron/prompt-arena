#!/bin/sh
#
# Container entrypoint for PromptArena.
#
# Applies any pending Prisma migrations against DATABASE_URL, then starts the
# Next.js standalone server. `migrate deploy` is safe and idempotent: it only
# applies migrations that have not yet run and never resets data.
#
# NOTE: This intentionally does NOT run the seed script. prisma/seed.ts is
# destructive (it deletes all rows first). Seed the learning content exactly
# once, manually, against an empty database — see DEPLOYMENT.md.

set -e

echo "→ Applying database migrations (prisma migrate deploy)…"
node node_modules/prisma/build/index.js migrate deploy

echo "→ Starting PromptArena…"
exec "$@"
