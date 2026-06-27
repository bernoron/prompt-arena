# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Prisma engines need these on Alpine.
RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

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

# Prisma schema, migrations and CLI — required to run `migrate deploy` at startup.
COPY --from=builder /app/prisma                 ./prisma
COPY --from=builder /app/node_modules/prisma    ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma   ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma   ./node_modules/.prisma

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
