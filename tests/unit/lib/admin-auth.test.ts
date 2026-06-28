import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAdminSession, isAdminAuthorised } from '../../../lib/admin-auth';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('admin session cookies', () => {
  it('accepts a freshly signed admin session token', async () => {
    vi.stubEnv('ADMIN_SECRET', 'a-strong-admin-secret');

    const token = await createAdminSession();

    await expect(isAdminAuthorised(token)).resolves.toBe(true);
  });

  it('rejects tampered admin session tokens', async () => {
    vi.stubEnv('ADMIN_SECRET', 'a-strong-admin-secret');

    const token = await createAdminSession();
    const tampered = token.replace(/.$/, (char) => (char === '0' ? '1' : '0'));

    await expect(isAdminAuthorised(tampered)).resolves.toBe(false);
  });

  it('rejects expired admin session tokens', async () => {
    vi.stubEnv('ADMIN_SECRET', 'a-strong-admin-secret');
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
    const token = await createAdminSession();

    vi.setSystemTime(new Date('2026-06-09T00:00:01.000Z'));

    await expect(isAdminAuthorised(token)).resolves.toBe(false);
  });
});
