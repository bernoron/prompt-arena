/**
 * Structured application logger for PromptArena.
 *
 * Behaviour by environment:
 *   Development  → coloured, human-readable terminal output
 *   Production   → JSON lines (parseable by Loki, Datadog, CloudWatch …)
 *
 * Log level is controlled via the LOG_LEVEL env var:
 *   debug  – everything including Prisma queries   (default in development)
 *   info   – requests, business events             (default in production)
 *   warn   – rate-limit hits, soft failures
 *   error  – exceptions only
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('Prompt created', { promptId: 42, authorId: 7, pts: 20 });
 *   logger.error('DB write failed', { err: e.message, promptId: 42 });
 */

export type LogLevel   = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = Record<string, unknown>;

// ─── Internal config ──────────────────────────────────────────────────────────

const WEIGHTS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const isDev  = process.env.NODE_ENV !== 'production';
const rawLvl = ((process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info')).toLowerCase()) as LogLevel;
const minW   = WEIGHTS[rawLvl] ?? WEIGHTS.info;

// ANSI escape codes – only used in development
const A = {
  reset:  '\x1b[0m',
  dim:    '\x1b[2m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
} as const;

const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: A.cyan,
  info:  A.green,
  warn:  A.yellow,
  error: A.red,
};

// ─── Emit ─────────────────────────────────────────────────────────────────────

function emit(level: LogLevel, msg: string, ctx?: LogContext): void {
  if (WEIGHTS[level] < minW) return;

  const ts = new Date().toISOString();

  if (isDev) {
    // Human-readable coloured output for the terminal
    const color   = LEVEL_COLOR[level];
    const label   = `${color}${level.toUpperCase().padEnd(5)}${A.reset}`;
    const ctxPart = ctx && Object.keys(ctx).length
      ? ` ${A.dim}${JSON.stringify(ctx)}${A.reset}`
      : '';
    process.stdout.write(`${A.dim}${ts}${A.reset} ${label} ${msg}${ctxPart}\n`);
  } else {
    // Structured JSON – one line per event, parseable by log aggregators
    process.stdout.write(JSON.stringify({ level, ts, msg, ...ctx }) + '\n');
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const logger = {
  /** Verbose diagnostics – Prisma queries, branch decisions. */
  debug: (msg: string, ctx?: LogContext) => emit('debug', msg, ctx),

  /** Normal operational events – requests, point awards, prompt creation. */
  info:  (msg: string, ctx?: LogContext) => emit('info',  msg, ctx),

  /** Degraded situations that don't stop execution – rate-limit hits. */
  warn:  (msg: string, ctx?: LogContext) => emit('warn',  msg, ctx),

  /** Caught exceptions and unrecoverable failures. */
  error: (msg: string, ctx?: LogContext) => emit('error', msg, ctx),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Serialises any error value into a plain object safe for log context. */
export function serializeError(err: unknown): LogContext {
  if (err instanceof Error) {
    return {
      err:   err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    };
  }
  return { err: String(err) };
}
