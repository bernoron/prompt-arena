import { test, expect } from '@playwright/test';

test.describe('API Smoke Tests', () => {
  test('GET /api/users returns populated array', async ({ request }) => {
    const res = await request.get('/api/users');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('id');
    expect(body[0]).toHaveProperty('name');
    expect(body[0]).toHaveProperty('totalPoints');
  });

  test('GET /api/prompts returns array', async ({ request }) => {
    const res = await request.get('/api/prompts');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/challenges returns array', async ({ request }) => {
    const res = await request.get('/api/challenges');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('admin API returns 401 without cookie', async ({ request }) => {
    const res = await request.get('/api/admin/stats');
    expect(res.status()).toBe(401);
  });

  test('POST /api/users validates empty name', async ({ request }) => {
    const res = await request.post('/api/users', {
      data: { name: '', department: 'IT' },
    });
    expect(res.status()).toBe(400);
  });
});
