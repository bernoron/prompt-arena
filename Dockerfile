# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# .dockerignore excludes .git from the build context, so the "prepare" script's
# git-hooks setup (npm run setup:hooks) would fail with "git: not found" on this
# alpine image. CI=true makes it skip, matching the same check GitHub Actions
# already relies on. Builder-stage-only — never carried into the runner image.
ENV CI=true

# libc6-compat/openssl: Prisma's query engine on Alpine.
# python3/make/g++: better-sqlite3 (Prisma's SQLite driver adapter) ships
# prebuilt binaries for glibc Linux but not musl/Alpine, so its install falls
# back to compiling from source via node-gyp here.
RUN apk add --no-cache libc6-compat openssl python3 make g++

COPY package*.json ./
# schema.prisma must exist before `npm ci`, because npm ci runs the
# "postinstall": "prisma generate" script, which fails without it.
COPY prisma ./prisma
RUN npm ci

# Standalone install of the prisma CLI (pinned to the version npm ci just
# resolved) into its own tree, for the runtime image's `migrate deploy` step.
# npm resolves the CLI's full transitive dependency closure here, so the
# runtime stage can copy one complete node_modules instead of maintaining a
# hand-curated package list that breaks on every Prisma bump.
RUN npm install --prefix /prisma-cli --no-save --no-audit --no-fund \
      "prisma@$(node -p "require('prisma/package.json').version")"

COPY . .
# No separate `prisma generate` here: npm ci's postinstall hook already ran it
# above, and re-running it now would fail anyway - prisma.config.ts (copied in
# by `COPY . .`, unlike the plain prisma/ dir copied earlier) makes the CLI
# resolve DATABASE_URL eagerly, which isn't set as a build-time env var here.
RUN npm run build

# This project has no public/ directory (favicon lives at app/favicon.ico via
# the App Router convention) — ensure it exists so the runner stage's COPY
# below doesn't fail. If a real public/ is added later, this is a no-op.
RUN mkdir -p public

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat openssl && \
    addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Next.js standalone server output.
COPY --from=builder /app/public           ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static

# Prisma schema, migrations, config and generated client — prisma.config.ts
# carries the datasource URL (Prisma 7 no longer allows `url` inside
# schema.prisma).
COPY --from=builder /app/prisma                 ./prisma
COPY --from=builder /app/prisma.config.ts       ./prisma.config.ts
COPY --from=builder /app/node_modules/@prisma   ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma   ./node_modules/.prisma

# Prisma CLI with its complete dependency tree (standalone install from the
# builder stage) — required to run `migrate deploy` at startup. This replaces
# an earlier hand-curated multi-source COPY of the CLI's transitive
# dependencies: Docker copies a directory source's *contents*, not the
# directory itself, so that COPY flattened all the packages on top of each
# other in node_modules/ and the CLI crash-looped every machine at boot with
# MODULE_NOT_FOUND before the server ever started.
COPY --from=builder /prisma-cli/node_modules    ./node_modules

# lib/ is not otherwise needed at runtime (Next's standalone output bundles
# its own compiled copy), but prisma/seed.ts imports from it directly via
# relative paths (lib/points, lib/password, lib/email-crypto, lib/constants)
# for the one-off `fly ssh console -C "npx tsx prisma/seed.ts"` seeding step.
COPY --from=builder /app/lib                    ./lib

# lib/services/feature-announcements-service.ts reads these at request time
# (landing page "Neuigkeiten" section, CR-007) via a dynamic readdir() — that
# can't be picked up by Next's standalone-output file tracing (which only
# resolves statically-analysable imports/literal fs paths), so the directory
# has to be copied explicitly.
COPY --from=builder /app/specs                  ./specs

# scripts/update-learning-content.ts is the non-destructive way to refresh
# learning-path content on a live deployment (see DEPLOYMENT.md §4) via
# `fly ssh console -C "npx tsx scripts/update-learning-content.ts"`. It only
# imports prisma/learning-content.ts (already copied above), so this one file
# is enough — the rest of scripts/ is dev-only tooling and stays out of the
# runtime image.
COPY --from=builder /app/scripts/update-learning-content.ts ./scripts/update-learning-content.ts

COPY docker-entrypoint.sh ./docker-entrypoint.sh

# /data is the mount point for the persistent SQLite volume (DATABASE_URL=file:/data/prod.db).
RUN chmod +x docker-entrypoint.sh && \
    mkdir -p /data && \
    chown -R nextjs:nodejs /data

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
