/**
 * Password reset token helpers (CR-003, @spec AC-01-015).
 *
 * Security model:
 *   - The raw token is a 32-byte random hex string, delivered ONLY via the
 *     emailed link. It is never stored.
 *   - The database stores only sha256(rawToken) (`tokenHash`), so a DB read
 *     never yields a usable reset credential.
 *   - Tokens expire after RESET_TOKEN_TTL_MS and are single-use (usedAt).
 */

import { randomBytes, createHash } from 'crypto';

/** How long a reset link stays valid. 1 hour — see BAC-01-015. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Generate a fresh raw token (goes in the email) — cryptographically random. */
export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

/** Deterministic hash stored in the DB. Same input → same hash for lookup. */
export function hashResetToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/** Expiry timestamp for a token created now. */
export function resetTokenExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + RESET_TOKEN_TTL_MS);
}

/**
 * True in local dev, CI and the local E2E (pre-push) run — never in a real
 * production deployment. Used to expose the reset URL to automated tests
 * (which run with NODE_ENV=production but with CI/E2E_TESTING set), while
 * keeping the production response strictly neutral. Mirrors the same guard
 * lib/rate-limit.ts uses to disable itself.
 */
export function isTestOrDevEnv(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.CI === 'true' ||
    process.env.E2E_TESTING === 'true'
  );
}
