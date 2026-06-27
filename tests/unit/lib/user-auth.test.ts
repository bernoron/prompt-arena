import { describe, it, expect, afterEach } from 'vitest';
import { signUserId, verifyUserCookie, resolveUserId } from '../../../lib/user-auth';

const originalUserSecret = process.env.USER_SECRET;

afterEach(() => {
  process.env.USER_SECRET = originalUserSecret;
});

describe('user session cookies', () => {
  it('verifies a signed user id when USER_SECRET is configured', async () => {
    process.env.USER_SECRET = 'a-test-secret-with-at-least-32-chars';

    const cookie = await signUserId(42);

    await expect(verifyUserCookie(cookie)).resolves.toBe(42);
  });

  it('rejects tampered cookie signatures', async () => {
    process.env.USER_SECRET = 'a-test-secret-with-at-least-32-chars';

    const cookie = await signUserId(42);
    const tampered = cookie.replace(/.$/, (char) => (char === '0' ? '1' : '0'));

    await expect(verifyUserCookie(tampered)).resolves.toBeNull();
  });

  it('rejects cookies when USER_SECRET is missing', async () => {
    process.env.USER_SECRET = '';

    await expect(verifyUserCookie('42.signature')).resolves.toBeNull();
  });
});

describe('resolveUserId', () => {
  it('requires the cookie user to match the body user when auth is enabled', async () => {
    process.env.USER_SECRET = 'a-test-secret-with-at-least-32-chars';
    const cookie = await signUserId(42);

    await expect(resolveUserId(cookie, 42)).resolves.toBe(42);
    await expect(resolveUserId(cookie, 7)).resolves.toEqual({
      error: 'Forbidden - userId does not match your session',
      status: 403,
    });
  });

  it('falls back to the body user in dev mode without USER_SECRET', async () => {
    process.env.USER_SECRET = '';

    await expect(resolveUserId(undefined, 7)).resolves.toBe(7);
  });
});
