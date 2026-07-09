// @spec AC-01-011, AC-01-012, AC-01-016, AC-01-017
import { test, expect, type APIRequestContext } from '@playwright/test';

const TEST_PASSWORD = 'Test1234!';

async function registerUser(request: APIRequestContext) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const name   = `Acct User ${suffix}`;
  const email  = `acct-${suffix}@test.example`;

  const regRes = await request.post('/api/auth/register', {
    data: { name, email, password: TEST_PASSWORD },
  });
  expect(regRes.status()).toBe(201);
  const { userId } = await regRes.json() as { userId: number };
  return { id: userId, name, email };
}

function cookieFrom(setCookie: string): string {
  return setCookie.split(',').map((c) => c.split(';')[0].trim()).join('; ');
}

async function login(request: APIRequestContext, email: string, password: string) {
  const res = await request.post('/api/auth/login', { data: { email, password } });
  return res;
}

test.describe('CR-002 account deletion', () => {
  test('happy path: delete own account, then cannot log in again', async ({ request }) => {
    const { email } = await registerUser(request);

    const loginRes = await login(request, email, TEST_PASSWORD);
    expect(loginRes.status()).toBe(200);
    const cookie = cookieFrom(loginRes.headers()['set-cookie']);

    const delRes = await request.delete('/api/account', {
      headers: { Cookie: cookie },
      data: { password: TEST_PASSWORD },
    });
    expect(delRes.status()).toBe(200);

    // Old credentials no longer work (email freed, account anonymised).
    const relogin = await login(request, email, TEST_PASSWORD);
    expect(relogin.status()).toBe(401);
  });

  test('wrong password is rejected (401), account survives', async ({ request }) => {
    const { email } = await registerUser(request);
    const cookie = cookieFrom((await login(request, email, TEST_PASSWORD)).headers()['set-cookie']);

    const delRes = await request.delete('/api/account', {
      headers: { Cookie: cookie },
      data: { password: 'WrongPassword!' },
    });
    expect(delRes.status()).toBe(401);

    // Still able to log in — account was not deleted.
    expect((await login(request, email, TEST_PASSWORD)).status()).toBe(200);
  });

  test('unauthenticated deletion is rejected', async ({ request }) => {
    const res = await request.delete('/api/account', { data: { password: TEST_PASSWORD } });
    expect(res.status()).toBe(401);
  });
});

test.describe('CR-003 password reset', () => {
  test('happy path: request → reset → login with new password', async ({ request }) => {
    const { email } = await registerUser(request);

    const reqRes = await request.post('/api/auth/password-reset/request', { data: { email } });
    expect(reqRes.status()).toBe(200);
    const { devResetUrl } = await reqRes.json() as { devResetUrl?: string };
    expect(devResetUrl).toBeTruthy();

    const token = new URL(devResetUrl!).searchParams.get('token');
    expect(token).toBeTruthy();

    const newPassword = 'BrandNew5678!';
    const confirmRes = await request.post('/api/auth/password-reset/confirm', {
      data: { token, password: newPassword },
    });
    expect(confirmRes.status()).toBe(200);

    // New password works, old one does not.
    expect((await login(request, email, newPassword)).status()).toBe(200);
    expect((await login(request, email, TEST_PASSWORD)).status()).toBe(401);
  });

  test('token is single-use', async ({ request }) => {
    const { email } = await registerUser(request);
    const reqRes = await request.post('/api/auth/password-reset/request', { data: { email } });
    const { devResetUrl } = await reqRes.json() as { devResetUrl?: string };
    const token = new URL(devResetUrl!).searchParams.get('token');

    const first = await request.post('/api/auth/password-reset/confirm', {
      data: { token, password: 'FirstPass123!' },
    });
    expect(first.status()).toBe(200);

    const second = await request.post('/api/auth/password-reset/confirm', {
      data: { token, password: 'SecondPass123!' },
    });
    expect(second.status()).toBe(400);
  });

  test('unknown email returns neutral response without a reset URL', async ({ request }) => {
    const res = await request.post('/api/auth/password-reset/request', {
      data: { email: `nobody-${Date.now()}@test.example` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json() as { message?: string; devResetUrl?: string };
    expect(body.message).toBeTruthy();
    expect(body.devResetUrl).toBeUndefined();
  });

  test('invalid token is rejected', async ({ request }) => {
    const res = await request.post('/api/auth/password-reset/confirm', {
      data: { token: 'deadbeef'.repeat(8), password: 'Whatever123!' },
    });
    expect(res.status()).toBe(400);
  });
});
