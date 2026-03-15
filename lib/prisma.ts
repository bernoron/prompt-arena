/**
 * Singleton Prisma client for PromptArena.
 *
 * Next.js hot-reloads modules during development, which would create a new
 * PrismaClient on every reload and quickly exhaust the SQLite connection pool.
 * The singleton pattern below stores the instance on `globalThis` so it
 * survives HMR without leaking connections.
 *
 * In production `globalThis.prisma` is never set, so a fresh client is
 * created once per server process.
 *
 * Prisma log levels are driven by LOG_LEVEL:
 *   debug  → query + info + warn + error  (shows every SQL statement)
 *   info   → warn + error
 *   warn   → warn + error
 *   error  → error only
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const logLevel = (process.env.LOG_LEVEL ?? 'info').toLowerCase();

const prismaLog: ('query' | 'info' | 'warn' | 'error')[] =
  logLevel === 'debug'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: prismaLog });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
