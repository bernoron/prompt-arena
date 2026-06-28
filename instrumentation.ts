/**
 * Next.js instrumentation hook - runs once when the server process starts.
 *
 * Purpose: fail fast on a misconfigured production deployment, instead of
 * discovering missing or weak secrets only when the first request fails.
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
  const userSecret = process.env.USER_SECRET ?? '';
  const emailSecret = process.env.EMAIL_SECRET ?? '';
  const dbUrl = process.env.DATABASE_URL ?? '';

  if (!adminSecret) {
    problems.push('ADMIN_SECRET is not set.');
  } else if (adminSecret.length < 12) {
    warnings.push('ADMIN_SECRET is shorter than 12 characters.');
  }

  if (!userSecret) {
    problems.push('USER_SECRET is not set.');
  } else if (userSecret.length < 32) {
    warnings.push('USER_SECRET is shorter than 32 characters.');
  }

  if (!emailSecret) {
    problems.push('EMAIL_SECRET is not set.');
  } else if (emailSecret.length < 32) {
    warnings.push('EMAIL_SECRET is shorter than 32 characters.');
  }

  if (!dbUrl) {
    problems.push('DATABASE_URL is not set.');
  } else if (dbUrl.startsWith('file:') && dbUrl.includes('dev.db')) {
    warnings.push('DATABASE_URL points at the bundled dev.db SQLite file.');
  }

  for (const warning of warnings) {
    logger.warn(`startup config warning: ${warning}`);
  }

  if (problems.length) {
    for (const problem of problems) {
      logger.error(`startup config error: ${problem}`);
    }

    throw new Error(
      'PromptArena cannot start with incomplete production configuration. ' +
      'Set the missing environment variables and restart.',
    );
  }

  logger.info('startup config check passed', {
    adminSecret: 'set',
    userSecret: 'set',
    emailSecret: 'set',
    db: dbUrl.startsWith('file:') ? 'sqlite' : 'remote',
  });
}
