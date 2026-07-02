import { describe, it, expect, afterEach, vi } from 'vitest';
import { signUserId, verifyUserCookie, resolveUserId } from '../../../lib/user-auth';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('user session cookies', () => {
  it('verifies a signed user id when USER_SECRET is configured', async () => {
    vi.stubEnv('USER_SECRET', 'a-test-secret-with-at-least-32-chars');

    const cookie = await signUserId(42);

    await expect(verifyUserCookie(cookie)).resolves.toBe(42);
  });

  it('rejects tampered cookie signatures', async () => {
    vi.stubEnv('USER_SECRET', 'a-test-secret-with-at-least-32-chars');

    const cookie = await signUserId(42);
    const tampered = cookie.replace(/.$/, (char) => (char === '0' ? '1' : '0'));

    await expect(verifyUserCookie(tampered)).resolves.toBeNull();
  });

  it('rejects cookies when USER_SECRET is missing', async () => {
    vi.stubEnv('USER_SECRET', '');

    await expect(verifyUserCookie('42.signature')).resolves.toBeNull();
  });

  it('rejects legacy two-part tokens without an issued-at timestamp', async () => {
    vi.stubEnv('USER_SECRET', 'a-test-secret-with-at-least-32-chars');

    await expect(verifyUserCookie('42.deadbeef')).resolves.toBeNull();
  });

  it('rejects expired tokens (older than 30 days)', async () => {
    vi.stubEnv('USER_SECRET', 'a-test-secret-with-at-least-32-chars');

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const cookie = await signUserId(42);
    vi.useRealTimers();

    await expect(verifyUserCookie(cookie)).resolves.toBeNull();
  });

  it('rejects tokens with an issued-at timestamp in the future', async () => {
    vi.stubEnv('USER_SECRET', 'a-test-secret-with-at-least-32-chars');

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 60 * 60 * 1000);
    const cookie = await signUserId(42);
    vi.useRealTimers();

    await expect(verifyUserCookie(cookie)).resolves.toBeNull();
  });
});

describe('resolveUserId', () => {
  it('requires the cookie user to match the body user when auth is enabled', async () => {
    vi.stubEnv('USER_SECRET', 'a-test-secret-with-at-least-32-chars');
    const cookie = await signUserId(42);

    await expect(resolveUserId(cookie, 42)).resolves.toBe(42);
    await expect(resolveUserId(cookie, 7)).resolves.toEqual({
      error: 'Forbidden - userId does not match your session',
      status: 403,
    });
  });

  it('falls back to the body user in dev mode without USER_SECRET', async () => {
    vi.stubEnv('USER_SECRET', '');
    vi.stubEnv('NODE_ENV', 'development');

    await expect(resolveUserId(undefined, 7)).resolves.toBe(7);
  });

  it('rejects body fallback in production without USER_SECRET', async () => {
    vi.stubEnv('USER_SECRET', '');
    vi.stubEnv('NODE_ENV', 'production');

    await expect(resolveUserId(undefined, 7)).resolves.toEqual({
      error: 'User authentication is not configured on this server',
      status: 503,
    });
  });
});
