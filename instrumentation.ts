/**
 * Next.js instrumentation hook — runs once when the server process starts.
 *
 * Purpose: fail fast (or at least warn loudly) on a misconfigured production
 * deployment, instead of discovering missing/weak secrets only when the first
 * admin login or write request returns 503 at runtime.
 *
 * Enabled via `experimental.instrumentationHook` in next.config.mjs.
 */

export async function register(): Promise<void> {
  // Only run in the Node.js server runtime (not Edge, not the browser).
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) return;

  // Imported lazily so the Edge runtime never pulls this in.
  const { logger } = await import('@/lib/logger');

  const problems: string[] = [];
  const warnings: string[] = [];

  const adminSecret = process.env.ADMIN_SECRET ?? '';
  const userSecret  = process.env.USER_SECRET ?? '';
  const dbUrl       = process.env.DATABASE_URL ?? '';

  // ── Hard requirements ────────────────────────────────────────────────────
  if (!adminSecret) {
    problems.push('ADMIN_SECRET is not set — the admin panel will reject every login (503).');
  } else if (adminSecret.length < 12) {
    warnings.push('ADMIN_SECRET is shorter than 12 characters — choose a stronger password.');
  }

  if (!userSecret) {
    problems.push('USER_SECRET is not set — all write actions (submit, vote, favorite) will be blocked (503).');
  } else if (userSecret.length < 32) {
    warnings.push('USER_SECRET is shorter than 32 characters — HMAC signing key should be at least 32 chars.');
  }

  if (!dbUrl) {
    problems.push('DATABASE_URL is not set — the application cannot reach the database.');
  } else if (dbUrl.startsWith('file:') && dbUrl.includes('dev.db')) {
    warnings.push('DATABASE_URL points at the bundled dev.db SQLite file — ensure it lives on a persistent volume in production.');
  }

  for (const w of warnings) logger.warn(`startup config warning: ${w}`);

  if (problems.length) {
    for (const p of problems) logger.error(`startup config error: ${p}`);
    logger.error(
      'PromptArena started with an incomplete production configuration. ' +
      'Set the missing environment variables and restart.',
    );
  } else {
    logger.info('startup config check passed', {
      adminSecret: 'set',
      userSecret:  'set',
      db:          dbUrl.startsWith('file:') ? 'sqlite' : 'remote',
    });
  }
}
