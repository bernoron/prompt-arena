// @spec AC-12-001, AC-12-002
import { describe, it, expect, afterEach, vi } from 'vitest';
import { encryptEmail, decryptEmail, hashEmail } from '../../../lib/email-crypto';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('encryptEmail / decryptEmail', () => {
  it('round-trips an email address', () => {
    const email = 'user@example.com';
    expect(decryptEmail(encryptEmail(email))).toBe(email);
  });

  it('produces different ciphertext on each call (random IV)', () => {
    const email = 'same@example.com';
    const ct1 = encryptEmail(email);
    const ct2 = encryptEmail(email);
    expect(ct1).not.toBe(ct2);
  });

  it('decrypts correctly with explicit EMAIL_SECRET', () => {
    vi.stubEnv('EMAIL_SECRET', 'my-test-secret-32-chars-long-xyz!');
    const email = 'test@domain.ch';
    expect(decryptEmail(encryptEmail(email))).toBe(email);
  });

  it('detects tampered ciphertext (GCM auth tag failure)', () => {
    const ct = encryptEmail('original@example.com');
    const parts = ct.split(':');
    // Flip one bit in the ciphertext hex
    const flipped = parts[1].slice(0, -2) + (parts[1].endsWith('ff') ? '00' : 'ff');
    const tampered = [parts[0], flipped, parts[2]].join(':');
    expect(() => decryptEmail(tampered)).toThrow();
  });

  it('fails to decrypt with a different EMAIL_SECRET', () => {
    vi.stubEnv('EMAIL_SECRET', 'secret-A-32-chars-long-xxxxxxxxxx');
    const ct = encryptEmail('secure@example.com');
    vi.stubEnv('EMAIL_SECRET', 'secret-B-32-chars-long-xxxxxxxxxx');
    expect(() => decryptEmail(ct)).toThrow();
  });
});

describe('hashEmail', () => {
  it('is deterministic for the same input', () => {
    const h1 = hashEmail('user@example.com');
    const h2 = hashEmail('user@example.com');
    expect(h1).toBe(h2);
  });

  it('normalises to lowercase before hashing', () => {
    expect(hashEmail('User@Example.COM')).toBe(hashEmail('user@example.com'));
  });

  it('trims whitespace before hashing', () => {
    expect(hashEmail('  user@example.com  ')).toBe(hashEmail('user@example.com'));
  });

  it('produces different hashes for different emails', () => {
    expect(hashEmail('a@example.com')).not.toBe(hashEmail('b@example.com'));
  });

  it('produces different hashes with different EMAIL_SECRET', () => {
    vi.stubEnv('EMAIL_SECRET', 'key-one-32-chars-long-xxxxxxxxxxx');
    const h1 = hashEmail('user@example.com');
    vi.stubEnv('EMAIL_SECRET', 'key-two-32-chars-long-xxxxxxxxxxx');
    const h2 = hashEmail('user@example.com');
    expect(h1).not.toBe(h2);
  });
});
