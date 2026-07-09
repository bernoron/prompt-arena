// @spec AC-01-015
import { describe, it, expect } from 'vitest';
import {
  generateResetToken,
  hashResetToken,
  resetTokenExpiry,
  RESET_TOKEN_TTL_MS,
} from '../../../lib/reset-token';

describe('generateResetToken', () => {
  it('returns a 64-char hex string (32 random bytes)', () => {
    const t = generateResetToken();
    expect(t).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces a different token every call', () => {
    expect(generateResetToken()).not.toBe(generateResetToken());
  });
});

describe('hashResetToken', () => {
  it('is deterministic for the same input', () => {
    const t = generateResetToken();
    expect(hashResetToken(t)).toBe(hashResetToken(t));
  });

  it('differs for different tokens and never equals the raw token', () => {
    const t = generateResetToken();
    expect(hashResetToken(t)).not.toBe(t);
    expect(hashResetToken(t)).not.toBe(hashResetToken(generateResetToken()));
  });
});

describe('resetTokenExpiry', () => {
  it('is exactly TTL after the given base time', () => {
    const base = new Date('2026-07-08T12:00:00.000Z');
    expect(resetTokenExpiry(base).getTime()).toBe(base.getTime() + RESET_TOKEN_TTL_MS);
  });

  it('is in the future for a token created now', () => {
    expect(resetTokenExpiry().getTime()).toBeGreaterThan(Date.now());
  });
});
