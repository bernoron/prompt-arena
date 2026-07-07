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
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const logLevel = (process.env.LOG_LEVEL ?? 'info').toLowerCase();

const prismaLog: ('query' | 'info' | 'warn' | 'error')[] =
  logLevel === 'debug'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'];

function createPrismaClient() {
  // Prisma 7 requires a driver adapter instead of a bundled query engine binary.
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
  const client = new PrismaClient({ adapter, log: prismaLog });

  // Tune SQLite for throughput and concurrency. Each PRAGMA returns a row, so
  // it must use $queryRawUnsafe — $executeRawUnsafe rejects result rows
  // ("Execute returned results, which is not allowed in SQLite") and the PRAGMA
  // would silently never take effect.
  //
  //   journal_mode=WAL   Concurrent readers don't block a writer; survives
  //                      process restarts cleanly and avoids corruption.
  //   synchronous=NORMAL Safe with WAL (only loses the last txn on OS crash,
  //                      never corrupts) and removes an fsync per commit —
  //                      the single biggest write-latency win for SQLite.
  //   busy_timeout=5000  Wait up to 5s for a lock instead of failing writes
  //                      with SQLITE_BUSY the instant two commits overlap.
  //   temp_store=MEMORY  Keep temp B-trees (ORDER BY / GROUP BY spills) in RAM.
  //   cache_size=-16000  ~16 MB page cache (negative value = KiB) so hot pages
  //                      stay resident instead of being re-read from disk.
  //   mmap_size=128MB    Memory-map the DB file to cut read syscall overhead.
  if (process.env.DATABASE_URL?.startsWith('file:')) {
    const pragmas = [
      'PRAGMA journal_mode=WAL;',
      'PRAGMA synchronous=NORMAL;',
      'PRAGMA busy_timeout=5000;',
      'PRAGMA temp_store=MEMORY;',
      'PRAGMA cache_size=-16000;',
      'PRAGMA mmap_size=134217728;',
    ];
    client.$connect()
      .then(async () => {
        for (const pragma of pragmas) {
          await client.$queryRawUnsafe(pragma).catch(() => {});
        }
      })
      .catch(() => {});
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
