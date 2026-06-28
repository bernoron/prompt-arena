// @spec AC-11-003, AC-11-004, AC-11-007, AC-11-008, AC-11-011, AC-11-012, AC-11-013, AC-11-015, AC-11-016
import { test, expect, type APIRequestContext } from '@playwright/test';

const ADMIN_PASSWORD = process.env.ADMIN_SECRET ?? 'admin1234';

async function createUser(request: APIRequestContext) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const res = await request.post('/api/users', {
    data: { name: `FB User ${suffix}`, department: 'IT' },
  });
  expect(res.status()).toBe(201);
  return (await res.json()) as { id: number };
}

async function loginUser(request: APIRequestContext, userId: number) {
  const res = await request.post('/api/auth/login', { data: { userId } });
  expect(res.status()).toBe(200);
  const setCookie = res.headers()['set-cookie'];
  return setCookie.split(',').map((c: string) => c.split(';')[0].trim()).join('; ');
}

async function loginAdmin(request: APIRequestContext) {
  const res = await request.post('/api/admin/login', { data: { password: ADMIN_PASSWORD } });
  expect(res.status()).toBe(200);
  const setCookie = res.headers()['set-cookie'];
  return setCookie.split(',').map((c: string) => c.split(';')[0].trim()).join('; ');
}

test.describe('BAC-11 feedback system', () => {

  test('user can submit general feedback (happy path)', async ({ request }) => {
    const user = await createUser(request);
    const cookie = await loginUser(request, user.id);

    const res = await request.post('/api/feedback', {
      headers: { Cookie: cookie },
      data: {
        userId: user.id,
        category: 'IDEA',
        text: 'It would be great to have dark mode',
        contextPath: '/dashboard',
      },
    });
    expect(res.status()).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true });
  });

  test('feedback POST rejects missing category (validation)', async ({ request }) => {
    const user = await createUser(request);
    const cookie = await loginUser(request, user.id);

    const res = await request.post('/api/feedback', {
      headers: { Cookie: cookie },
      data: { userId: user.id, text: 'Some text without a category' },
    });
    expect(res.status()).toBe(400);
  });

  test('feedback POST rejects empty text', async ({ request }) => {
    const user = await createUser(request);
    const cookie = await loginUser(request, user.id);

    const res = await request.post('/api/feedback', {
      headers: { Cookie: cookie },
      data: { userId: user.id, category: 'BUG', text: '' },
    });
    expect(res.status()).toBe(400);
  });

  test('lesson feedback: submit thumbs-up, then update with text', async ({ request }) => {
    const user = await createUser(request);
    const cookie = await loginUser(request, user.id);

    // Fetch a valid lessonId from the API
    const learnRes = await request.get(`/api/learn?userId=${user.id}`);
    expect(learnRes.status()).toBe(200);
    const modules = await learnRes.json() as Array<{ lessons: Array<{ id: number }> }>;
    const lessonId = modules[0]?.lessons[0]?.id;
    expect(lessonId).toBeGreaterThan(0);

    // Submit helpful=true
    const postRes = await request.post('/api/feedback/lesson', {
      headers: { Cookie: cookie },
      data: { userId: user.id, lessonId, helpful: true },
    });
    expect(postRes.status()).toBe(200);
    const { id } = await postRes.json() as { ok: boolean; id: number };
    expect(id).toBeGreaterThan(0);

    // GET should return the existing feedback
    const getRes = await request.get(`/api/feedback/lesson?userId=${user.id}&lessonId=${lessonId}`);
    expect(getRes.status()).toBe(200);
    const fb = await getRes.json() as { id: number; helpful: boolean; text: string | null };
    expect(fb.helpful).toBe(true);
    expect(fb.text).toBeNull();

    // Update with text
    const putRes = await request.put(`/api/feedback/lesson/${id}`, {
      headers: { Cookie: cookie },
      data: { text: 'Very clear and useful!' },
    });
    expect(putRes.status()).toBe(200);

    // Second GET shows updated text
    const getRes2 = await request.get(`/api/feedback/lesson?userId=${user.id}&lessonId=${lessonId}`);
    const fb2 = await getRes2.json() as { helpful: boolean; text: string };
    expect(fb2.text).toBe('Very clear and useful!');
  });

  test('lesson feedback: re-voting overwrites, does not create duplicates', async ({ request }) => {
    const user = await createUser(request);
    const cookie = await loginUser(request, user.id);

    const learnRes = await request.get(`/api/learn?userId=${user.id}`);
    const modules = await learnRes.json() as Array<{ lessons: Array<{ id: number }> }>;
    const lessonId = modules[0]?.lessons[0]?.id;

    await request.post('/api/feedback/lesson', {
      headers: { Cookie: cookie },
      data: { userId: user.id, lessonId, helpful: true },
    });
    // Vote again with opposite value
    const res2 = await request.post('/api/feedback/lesson', {
      headers: { Cookie: cookie },
      data: { userId: user.id, lessonId, helpful: false },
    });
    expect(res2.status()).toBe(200);

    const getRes = await request.get(`/api/feedback/lesson?userId=${user.id}&lessonId=${lessonId}`);
    const fb = await getRes.json() as { helpful: boolean };
    expect(fb.helpful).toBe(false);
  });

  test('topic suggestion: submit and appear in admin list', async ({ request }) => {
    const user = await createUser(request);
    const cookie = await loginUser(request, user.id);
    const adminCookie = await loginAdmin(request);

    const title = `Suggestion ${Date.now()}`;
    const postRes = await request.post('/api/feedback/suggestions', {
      headers: { Cookie: cookie },
      data: { userId: user.id, title, description: 'Would be very helpful for the team' },
    });
    expect(postRes.status()).toBe(200);

    const listRes = await request.get('/api/admin/feedback/suggestions', {
      headers: { Cookie: adminCookie },
    });
    expect(listRes.status()).toBe(200);
    const suggestions = await listRes.json() as Array<{ title: string; status: string }>;
    const found = suggestions.find((s) => s.title === title);
    expect(found).toBeTruthy();
    expect(found?.status).toBe('OPEN');
  });

  test('topic suggestion: title is required (min 3 chars)', async ({ request }) => {
    const user = await createUser(request);
    const cookie = await loginUser(request, user.id);

    const res = await request.post('/api/feedback/suggestions', {
      headers: { Cookie: cookie },
      data: { userId: user.id, title: 'AB' },
    });
    expect(res.status()).toBe(400);
  });

  test('admin: feedback list shows submitted entries with context', async ({ request }) => {
    const user = await createUser(request);
    const cookie = await loginUser(request, user.id);
    const adminCookie = await loginAdmin(request);

    await request.post('/api/feedback', {
      headers: { Cookie: cookie },
      data: {
        userId: user.id,
        category: 'BUG',
        text: 'Admin visibility test entry',
        contextPath: '/library',
      },
    });

    const res = await request.get('/api/admin/feedback', {
      headers: { Cookie: adminCookie },
    });
    expect(res.status()).toBe(200);
    const list = await res.json() as Array<{ text: string; category: string; status: string }>;
    const entry = list.find((e) => e.text === 'Admin visibility test entry');
    expect(entry).toBeTruthy();
    expect(entry?.category).toBe('BUG');
    expect(entry?.status).toBe('OPEN');
  });

  test('admin: mark feedback as done', async ({ request }) => {
    const user = await createUser(request);
    const cookie = await loginUser(request, user.id);
    const adminCookie = await loginAdmin(request);

    await request.post('/api/feedback', {
      headers: { Cookie: cookie },
      data: { userId: user.id, category: 'PRAISE', text: 'Great platform!' },
    });

    const listRes = await request.get('/api/admin/feedback', { headers: { Cookie: adminCookie } });
    const list = await listRes.json() as Array<{ id: number; text: string }>;
    const entry = list.find((e) => e.text === 'Great platform!');
    expect(entry).toBeTruthy();

    const patchRes = await request.patch(`/api/admin/feedback/${entry!.id}`, {
      headers: { Cookie: adminCookie },
      data: { status: 'DONE' },
    });
    expect(patchRes.status()).toBe(200);

    const listRes2 = await request.get('/api/admin/feedback', { headers: { Cookie: adminCookie } });
    const list2 = await listRes2.json() as Array<{ id: number; status: string }>;
    const updated = list2.find((e) => e.id === entry!.id);
    expect(updated?.status).toBe('DONE');
  });

  test('admin: delete feedback entry', async ({ request }) => {
    const user = await createUser(request);
    const cookie = await loginUser(request, user.id);
    const adminCookie = await loginAdmin(request);

    await request.post('/api/feedback', {
      headers: { Cookie: cookie },
      data: { userId: user.id, category: 'IMPROVEMENT', text: 'Delete me please' },
    });

    const listRes = await request.get('/api/admin/feedback', { headers: { Cookie: adminCookie } });
    const list = await listRes.json() as Array<{ id: number; text: string }>;
    const entry = list.find((e) => e.text === 'Delete me please');
    expect(entry).toBeTruthy();

    const delRes = await request.delete(`/api/admin/feedback/${entry!.id}`, {
      headers: { Cookie: adminCookie },
    });
    expect(delRes.status()).toBe(204);

    const listRes2 = await request.get('/api/admin/feedback', { headers: { Cookie: adminCookie } });
    const list2 = await listRes2.json() as Array<{ id: number }>;
    expect(list2.find((e) => e.id === entry!.id)).toBeUndefined();
  });

  test('admin: update suggestion status', async ({ request }) => {
    const user = await createUser(request);
    const cookie = await loginUser(request, user.id);
    const adminCookie = await loginAdmin(request);

    const title = `Status Test ${Date.now()}`;
    await request.post('/api/feedback/suggestions', {
      headers: { Cookie: cookie },
      data: { userId: user.id, title },
    });

    const listRes = await request.get('/api/admin/feedback/suggestions', { headers: { Cookie: adminCookie } });
    const list = await listRes.json() as Array<{ id: number; title: string; status: string }>;
    const s = list.find((x) => x.title === title);
    expect(s).toBeTruthy();

    await request.patch(`/api/admin/feedback/suggestions/${s!.id}`, {
      headers: { Cookie: adminCookie },
      data: { status: 'PLANNED' },
    });

    const listRes2 = await request.get('/api/admin/feedback/suggestions', { headers: { Cookie: adminCookie } });
    const list2 = await listRes2.json() as Array<{ id: number; status: string }>;
    expect(list2.find((x) => x.id === s!.id)?.status).toBe('PLANNED');
  });

  test('admin feedback routes reject unauthenticated requests', async ({ request }) => {
    const res = await request.get('/api/admin/feedback');
    expect([401, 302, 307]).toContain(res.status());
  });
});
