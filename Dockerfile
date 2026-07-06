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

COPY . .
RUN npx prisma generate
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

# Prisma schema, migrations, config and CLI — required to run `migrate deploy`
# at startup. prisma.config.ts now carries the datasource URL (Prisma 7 no
# longer allows `url` inside schema.prisma).
COPY --from=builder /app/prisma                 ./prisma
COPY --from=builder /app/prisma.config.ts       ./prisma.config.ts
COPY --from=builder /app/node_modules/prisma    ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma   ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma   ./node_modules/.prisma

# The `prisma` CLI package (config loading via @prisma/config, plus its
# bundled `prisma bootstrap`/dev tooling) requires this whole tree at its own
# require-time, regardless of what prisma.config.ts itself imports. Found by
# actually running `migrate deploy` against a minimal copy of this image and
# adding each "Cannot find module" one at a time until it succeeded — not
# guessed from package.json alone, since several of these (proper-lockfile,
# zeptomatch, etc.) come from an internal dependency, not @prisma/config
# directly. Keep in sync if a future Prisma bump breaks this.
COPY --from=builder \
  /app/node_modules/@standard-schema \
  /app/node_modules/c12 \
  /app/node_modules/confbox \
  /app/node_modules/deepmerge-ts \
  /app/node_modules/defu \
  /app/node_modules/destr \
  /app/node_modules/dotenv \
  /app/node_modules/effect \
  /app/node_modules/empathic \
  /app/node_modules/exsolve \
  /app/node_modules/fast-check \
  /app/node_modules/get-port-please \
  /app/node_modules/giget \
  /app/node_modules/graceful-fs \
  /app/node_modules/grammex \
  /app/node_modules/graphmatch \
  /app/node_modules/ohash \
  /app/node_modules/pathe \
  /app/node_modules/perfect-debounce \
  /app/node_modules/pkg-types \
  /app/node_modules/proper-lockfile \
  /app/node_modules/pure-rand \
  /app/node_modules/rc9 \
  /app/node_modules/remeda \
  /app/node_modules/retry \
  /app/node_modules/valibot \
  /app/node_modules/zeptomatch \
  ./node_modules/

# lib/ is not otherwise needed at runtime (Next's standalone output bundles
# its own compiled copy), but prisma/seed.ts imports from it directly via
# relative paths (lib/points, lib/password, lib/email-crypto, lib/constants)
# for the one-off `fly ssh console -C "npx tsx prisma/seed.ts"` seeding step.
COPY --from=builder /app/lib                    ./lib

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
