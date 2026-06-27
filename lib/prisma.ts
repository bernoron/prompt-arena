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

function createPrismaClient() {
  const client = new PrismaClient({ log: prismaLog });

  // Enable WAL mode for SQLite to prevent database corruption under concurrent
  // access and survive process restarts cleanly. PRAGMA journal_mode returns a
  // row, so it must use $queryRawUnsafe — $executeRawUnsafe rejects result rows
  // ("Execute returned results, which is not allowed in SQLite") and the PRAGMA
  // would silently never take effect.
  if (process.env.DATABASE_URL?.startsWith('file:')) {
    client.$connect().then(() =>
      client.$queryRawUnsafe('PRAGMA journal_mode=WAL;').catch(() => {})
    );
  }

  return client;
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown: close Prisma connection on process exit
if (typeof process !== 'undefined') {
  const disconnect = () => { prisma.$disconnect().catch(() => {}); };
  process.once('beforeExit', disconnect);
  process.once('SIGINT',     disconnect);
  process.once('SIGTERM',    disconnect);
}
