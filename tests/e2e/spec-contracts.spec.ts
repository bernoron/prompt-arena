import { test, expect, type APIRequestContext } from '@playwright/test';

const ADMIN_PASSWORD = process.env.ADMIN_SECRET ?? 'admin1234';

async function createUser(request: APIRequestContext) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const res = await request.post('/api/users', {
    data: { name: `Spec User ${suffix}`, department: 'IT' },
  });

  expect(res.status()).toBe(201);
  return await res.json() as { id: number; name: string; department: string; avatarColor: string };
}

async function loginUser(
  request: APIRequestContext,
  userId: number,
) {
  const res = await request.post('/api/auth/login', { data: { userId } });
  expect(res.status()).toBe(200);
  return cookieHeader(res);
}

async function loginAdmin(request: APIRequestContext) {
  const res = await request.post('/api/admin/login', { data: { password: ADMIN_PASSWORD } });
  expect(res.status()).toBe(200);
  return cookieHeader(res);
}

function cookieHeader(response: { headers(): Record<string, string> }) {
  const setCookie = response.headers()['set-cookie'];
  expect(setCookie).toBeTruthy();
  return setCookie
    .split(',')
    .map((cookie) => cookie.split(';')[0].trim())
    .join('; ');
}

test.describe('PromptArena spec contracts', () => {
  test('BAC-01 identity: users can register, are listed, and get a signed session', async ({ request }) => {
    const user = await createUser(request);

    expect(user.id).toBeGreaterThan(0);
    expect(user.name).toMatch(/^Spec User/);
    expect(user.department).toBe('IT');
    expect(user.avatarColor).toBeTruthy();

    const listRes = await request.get('/api/users');
    expect(listRes.status()).toBe(200);
    const users = await listRes.json() as Array<{ id: number; totalPoints: number }>;
    expect(users.some((u) => u.id === user.id)).toBe(true);

    for (let i = 1; i < users.length; i += 1) {
      expect(users[i - 1].totalPoints).toBeGreaterThanOrEqual(users[i].totalPoints);
    }

    const cookie = await loginUser(request, user.id);

    const meRes = await request.get('/api/auth/me', { headers: { Cookie: cookie } });
    expect(meRes.status()).toBe(200);
    await expect(meRes.json()).resolves.toMatchObject({
      user: { id: user.id, name: user.name },
    });
  });

  test('BAC-02 prompt library: prompts are paginated, searchable, categorized, and personalized', async ({ request }) => {
    const user = await createUser(request);
    const cookie = await loginUser(request, user.id);

    const categoriesRes = await request.get('/api/categories');
    expect(categoriesRes.status()).toBe(200);
    const categories = await categoriesRes.json() as Array<{ slug: string; label: string }>;
    expect(categories.map((c) => c.slug)).toEqual(expect.arrayContaining(['Writing', 'Email', 'Analysis', 'Excel']));

    const listRes = await request.get('/api/prompts?take=5&userId=' + user.id);
    expect(listRes.status()).toBe(200);
    const list = await listRes.json() as { items: Array<{ id: number; userVote: number | null; userFavorite?: boolean }>; hasNextPage: boolean };
    expect(Array.isArray(list.items)).toBe(true);
    expect(list.items.length).toBeGreaterThan(0);
    expect(list.items.length).toBeLessThanOrEqual(5);
    expect(list.items[0]).toHaveProperty('userVote');
    expect(list.items[0]).toHaveProperty('userFavorite');

    const searchRes = await request.get('/api/prompts?search=Prompt&take=10');
    expect(searchRes.status()).toBe(200);
    await expect(searchRes.json()).resolves.toHaveProperty('items');
  });

  test('BAC-02/03/05/06: authenticated users can submit, vote, favorite, and record usage', async ({ request }) => {
    const user = await createUser(request);
    const cookie = await loginUser(request, user.id);

    const title = `Spec Prompt ${Date.now()}`;
    const createRes = await request.post('/api/prompts', {
      headers: { Cookie: cookie },
      data: {
        title,
        titleEn: title,
        content: 'This is a spec contract prompt with enough content.',
        contentEn: 'This is a spec contract prompt with enough content.',
        category: 'Writing',
        difficulty: 'Einstieg',
        authorId: user.id,
      },
    });
    expect(createRes.status()).toBe(201);
    const prompt = await createRes.json() as { id: number; title: string; authorId: number; usageCount: number };
    expect(prompt).toMatchObject({ title, authorId: user.id, usageCount: 0 });

    // AC-03-006: voting on your own prompt is rejected server-side (not just in the UI).
    const selfVoteRes = await request.post('/api/votes', {
      headers: { Cookie: cookie },
      data: { promptId: prompt.id, userId: user.id, value: 5 },
    });
    expect(selfVoteRes.status()).toBe(403);

    // A different user can vote legitimately (200).
    const voter = await createUser(request);
    const voterCookie = await loginUser(request, voter.id);
    const voteRes = await request.post('/api/votes', {
      headers: { Cookie: voterCookie },
      data: { promptId: prompt.id, userId: voter.id, value: 5 },
    });
    expect(voteRes.status()).toBe(200);
    await expect(voteRes.json()).resolves.toMatchObject({ promptId: prompt.id, userId: voter.id, value: 5 });

    const mismatchRes = await request.post('/api/votes', {
      headers: { Cookie: cookie },
      data: { promptId: prompt.id, userId: user.id + 99999, value: 4 },
    });
    expect(mismatchRes.status()).toBe(403);

    const favoriteRes = await request.post('/api/favorites', {
      headers: { Cookie: cookie },
      data: { promptId: prompt.id, userId: user.id },
    });
    expect(favoriteRes.status()).toBe(200);
    await expect(favoriteRes.json()).resolves.toEqual({ favorited: true });

    const favoritesRes = await request.get('/api/favorites?userId=' + user.id);
    expect(favoritesRes.status()).toBe(200);
    const favorites = await favoritesRes.json() as Array<{ id: number; userFavorite: boolean }>;
    expect(favorites.some((p) => p.id === prompt.id && p.userFavorite)).toBe(true);

    const usageMismatchRes = await request.post('/api/usage', {
      headers: { Cookie: cookie },
      data: { promptId: prompt.id, userId: user.id + 99999 },
    });
    expect(usageMismatchRes.status()).toBe(403);

    const usageRes = await request.post('/api/usage', {
      headers: { Cookie: cookie },
      data: { promptId: prompt.id, userId: user.id },
    });
    expect(usageRes.status()).toBe(200);
    const usage = await usageRes.json() as { usageCount: number };
    expect(usage.usageCount).toBeGreaterThanOrEqual(1);
  });

  test('BAC-07 admin: protected endpoints reject anonymous users and accept admin login', async ({ request }) => {
    const anonymousStats = await request.get('/api/admin/stats');
    expect(anonymousStats.status()).toBe(401);

    const badLogin = await request.post('/api/admin/login', { data: { password: 'wrong-password' } });
    expect(badLogin.status()).toBe(401);

    const adminCookie = await loginAdmin(request);

    const stats = await request.get('/api/admin/stats', { headers: { Cookie: adminCookie } });
    expect(stats.status()).toBe(200);
    await expect(stats.json()).resolves.toMatchObject({
      totals: {
        users: expect.any(Number),
        prompts: expect.any(Number),
        votes: expect.any(Number),
        usages: expect.any(Number),
      },
      topPrompts: expect.any(Array),
      recentUsers: expect.any(Array),
      categoryBreakdown: expect.any(Array),
    });
  });

  test('BAC-08 learning: modules and lessons are readable and completion is idempotent', async ({ request }) => {
    const user = await createUser(request);
    const cookie = await loginUser(request, user.id);

    const modulesRes = await request.get('/api/learn');
    expect(modulesRes.status()).toBe(200);
    const modules = await modulesRes.json() as Array<{ slug: string; lessons: Array<{ slug: string }> }>;
    expect(modules.length).toBeGreaterThan(0);
    expect(modules[0].lessons.length).toBeGreaterThan(0);

    const moduleSlug = modules[0].slug;
    const lessonSlug = modules[0].lessons[0].slug;

    const lessonRes = await request.get(`/api/learn/${moduleSlug}/${lessonSlug}`);
    expect(lessonRes.status()).toBe(200);
    await expect(lessonRes.json()).resolves.toMatchObject({
      slug: lessonSlug,
      module: { slug: moduleSlug },
    });

    const completeRes = await request.post(`/api/learn/${moduleSlug}/${lessonSlug}/complete`, {
      headers: { Cookie: cookie },
      data: { userId: user.id },
    });
    expect(completeRes.status()).toBe(200);
    await expect(completeRes.json()).resolves.toMatchObject({ ok: true });

    const completeAgainRes = await request.post(`/api/learn/${moduleSlug}/${lessonSlug}/complete`, {
      headers: { Cookie: cookie },
      data: { userId: user.id },
    });
    expect(completeAgainRes.status()).toBe(200);
    await expect(completeAgainRes.json()).resolves.toMatchObject({
      ok: true,
      alreadyCompleted: true,
      pointsAwarded: 0,
    });
  });
});
