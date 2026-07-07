# syntax=docker/dockerfile:1
#
# PromptArena production image — Next.js standalone + Prisma 7 (SQLite).
#
# Four stages, each single-purpose:
#   deps       full install (dev+prod) — used to build Next
#   prod-deps  runtime-only install    — deterministic node_modules for the
#              startup `prisma migrate deploy`. Replaces the old hand-maintained
#              list of ~30 transitive Prisma CLI deps: never breaks on a bump.
#   builder    the actual `next build`
#   runner     minimal runtime image (non-root)

# ─── deps: full install (compiles better-sqlite3 for musl/Alpine) ─────────────
FROM node:20-alpine AS deps
WORKDIR /app
# CI=true makes the "prepare" script skip git-hooks setup (no git on Alpine).
ENV CI=true
# libc6-compat/openssl: Prisma query engine on Alpine.
# python3/make/g++: better-sqlite3 has no musl prebuilt → node-gyp compiles it.
RUN apk add --no-cache libc6-compat openssl python3 make g++
COPY package*.json ./
# schema.prisma must exist before `npm ci`: the postinstall `prisma generate`
# needs it. prisma.config.ts is intentionally NOT copied here so generate does
# not eagerly resolve DATABASE_URL (unset at build time).
COPY prisma ./prisma
RUN npm ci

# ─── prod-deps: runtime dependencies only, for the migrate-deploy at startup ──
FROM node:20-alpine AS prod-deps
WORKDIR /app
ENV CI=true
RUN apk add --no-cache libc6-compat openssl python3 make g++
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

# ─── builder: next build ──────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
ENV CI=true
COPY . .
RUN npm run build
# This project has no public/ dir (favicon lives at app/favicon.ico via the App
# Router). Create it so the runner COPY below never fails; no-op if one is added.
RUN mkdir -p public

# ─── runner: minimal runtime image ───────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat openssl && \
    addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Next.js standalone server output. Copied first; prod-deps node_modules is
# overlaid on top below (union — the traced standalone subset plus the full
# Prisma CLI tree needed by `migrate deploy`).
COPY --from=builder /app/public           ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static

# Deterministic runtime node_modules (includes the whole Prisma CLI + its
# transitive deps and the generated client). Replaces the old cherry-picked list.
COPY --from=prod-deps /app/node_modules ./node_modules

# Prisma schema, migrations and config — required to run `migrate deploy` at
# startup. prisma.config.ts carries the datasource URL (Prisma 7 no longer
# allows `url` inside schema.prisma).
COPY --from=builder /app/prisma           ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# lib/ is not needed by the standalone server (it bundles its own copy) but
# prisma/seed.ts imports from it via relative paths for the one-off manual
# `fly ssh console` seeding step.
COPY --from=builder /app/lib              ./lib

COPY docker-entrypoint.sh ./docker-entrypoint.sh

# /data is the mount point for the persistent SQLite volume
# (DATABASE_URL=file:/data/prod.db).
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
