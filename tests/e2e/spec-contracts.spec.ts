import { test, expect, type APIRequestContext } from '@playwright/test';

const ADMIN_PASSWORD = process.env.ADMIN_SECRET ?? 'admin1234';
const TEST_PASSWORD   = 'Spec1234!';

async function createAndLoginUser(request: APIRequestContext) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const name   = `Spec User ${suffix}`;
  const email  = `spec-${suffix}@test.example`;

  const regRes = await request.post('/api/auth/register', {
    data: { name, email, password: TEST_PASSWORD },
  });
  expect(regRes.status()).toBe(201);
  const user = await regRes.json() as { userId: number; name: string; avatarColor: string };

  const loginRes = await request.post('/api/auth/login', {
    data: { email, password: TEST_PASSWORD },
  });
  expect(loginRes.status()).toBe(200);
  const cookie = cookieHeader(loginRes);

  return { id: user.userId, name: user.name, avatarColor: user.avatarColor, cookie };
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
    const user = await createAndLoginUser(request);

    expect(user.id).toBeGreaterThan(0);
    expect(user.name).toMatch(/^Spec User/);
    expect(user.avatarColor).toBeTruthy();

    const listRes = await request.get('/api/users');
    expect(listRes.status()).toBe(200);
    const users = await listRes.json() as Array<{ id: number; totalPoints: number }>;
    expect(users.some((u) => u.id === user.id)).toBe(true);

    for (let i = 1; i < users.length; i += 1) {
      expect(users[i - 1].totalPoints).toBeGreaterThanOrEqual(users[i].totalPoints);
    }

    const meRes = await request.get('/api/auth/me', { headers: { Cookie: user.cookie } });
    expect(meRes.status()).toBe(200);
    await expect(meRes.json()).resolves.toMatchObject({
      user: { id: user.id, name: user.name },
    });

    const profileRes = await request.get(`/api/users/${user.id}`);
    expect(profileRes.status()).toBe(200);
    const profile = await profileRes.json() as Record<string, unknown>;
    expect(profile).not.toHaveProperty('passwordHash');
    expect(profile).not.toHaveProperty('emailHash');
    expect(profile).not.toHaveProperty('emailEncrypted');
  });

  test('BAC-02 prompt library: prompts are paginated, searchable, categorized, and personalized', async ({ request }) => {
    const user = await createAndLoginUser(request);
    const cookie = user.cookie;

    const categoriesRes = await request.get('/api/categories');
    expect(categoriesRes.status()).toBe(200);
    const categories = await categoriesRes.json() as Array<{ slug: string; label: string }>;
    expect(categories.map((c) => c.slug)).toEqual(expect.arrayContaining(['Writing', 'Email', 'Analysis', 'Excel']));

    const listRes = await request.get('/api/prompts?take=5&userId=' + user.id, {
      headers: { Cookie: cookie },
    });
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

    const otherUser = await createAndLoginUser(request);
    const mismatchRes = await request.get('/api/prompts?take=5&userId=' + otherUser.id, {
      headers: { Cookie: cookie },
    });
    expect(mismatchRes.status()).toBe(403);
  });

  test('BAC-02-008 / AC-02-013: users can create a category on the fly, duplicates are rejected (CR-004)', async ({ request }) => {
    // Creating a category requires a signed-in session — unlike the admin
    // endpoint it does NOT require an admin session, but it does require *a*
    // user. Checked first, before this context's cookie jar picks up a
    // session from createAndLoginUser() below.
    const anonRes = await request.post('/api/categories', { data: { label: `Anon ${Date.now()}` } });
    expect(anonRes.status()).toBe(401);

    const user = await createAndLoginUser(request);
    const cookie = user.cookie;

    const label = `Custom Category ${Date.now()}`;
    const createRes = await request.post('/api/categories', {
      headers: { Cookie: cookie },
      data: { label },
    });
    expect(createRes.status()).toBe(201);
    const category = await createRes.json() as { slug: string; label: string; icon: string; color: string };
    expect(category.label).toBe(label);
    expect(category.slug).toMatch(/^[a-z0-9-]+$/);

    // Visible immediately (cache invalidated) in the list every filter/submit UI reads from.
    const listRes = await request.get('/api/categories');
    const categories = await listRes.json() as Array<{ slug: string }>;
    expect(categories.some((c) => c.slug === category.slug)).toBe(true);

    // Edge case: the same label (case-insensitive) is rejected as a duplicate slug.
    const dupRes = await request.post('/api/categories', {
      headers: { Cookie: cookie },
      data: { label: label.toUpperCase() },
    });
    expect(dupRes.status()).toBe(409);

    // A prompt submitted with the new category is filterable by it, exactly
    // like an admin-defined category.
    const title = `Category Prompt ${Date.now()}`;
    const promptRes = await request.post('/api/prompts', {
      headers: { Cookie: cookie },
      data: {
        title, titleEn: title,
        content: 'Prompt content to verify the new category end-to-end.',
        contentEn: 'Prompt content to verify the new category end-to-end.',
        category: category.slug,
        difficulty: 'Einstieg',
      },
    });
    expect(promptRes.status()).toBe(201);

    const filteredRes = await request.get(`/api/prompts?category=${category.slug}`);
    expect(filteredRes.status()).toBe(200);
    const filtered = await filteredRes.json() as { items: Array<{ title: string }> };
    expect(filtered.items.some((p) => p.title === title)).toBe(true);
  });

  test('BAC-02/03/05/06: authenticated users can submit, vote, favorite, and record usage', async ({ request }) => {
    const user = await createAndLoginUser(request);
    const cookie = user.cookie;

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
      },
    });
    expect(createRes.status()).toBe(201);
    const prompt = await createRes.json() as { id: number; title: string; authorId: number; usageCount: number };
    expect(prompt).toMatchObject({ title, authorId: user.id, usageCount: 0 });

    // AC-03-006: voting on your own prompt is rejected server-side (not just in the UI).
    const selfVoteRes = await request.post('/api/votes', {
      headers: { Cookie: cookie },
      data: { promptId: prompt.id, value: 5 },
    });
    expect(selfVoteRes.status()).toBe(403);

    // A different user can vote legitimately (200). The voter identity comes
    // solely from their session cookie — there is no userId in the body to
    // spoof, so the old "mismatched userId" 403 case is now structurally
    // impossible rather than something validation needs to catch.
    const voter = await createAndLoginUser(request);
    const voterCookie = voter.cookie;
    const voteRes = await request.post('/api/votes', {
      headers: { Cookie: voterCookie },
      data: { promptId: prompt.id, value: 5 },
    });
    expect(voteRes.status()).toBe(200);
    await expect(voteRes.json()).resolves.toMatchObject({ promptId: prompt.id, userId: voter.id, value: 5 });

    const favoriteRes = await request.post('/api/favorites', {
      headers: { Cookie: cookie },
      data: { promptId: prompt.id },
    });
    expect(favoriteRes.status()).toBe(200);
    await expect(favoriteRes.json()).resolves.toEqual({ favorited: true });

    const favoritesRes = await request.get('/api/favorites?userId=' + user.id, {
      headers: { Cookie: cookie },
    });
    expect(favoritesRes.status()).toBe(200);
    const favorites = await favoritesRes.json() as Array<{ id: number; userFavorite: boolean }>;
    expect(favorites.some((p) => p.id === prompt.id && p.userFavorite)).toBe(true);

    const usageRes = await request.post('/api/usage', {
      headers: { Cookie: cookie },
      data: { promptId: prompt.id },
    });
    expect(usageRes.status()).toBe(200);
    const usage = await usageRes.json() as { usageCount: number; alreadyRecorded: boolean };
    expect(usage.usageCount).toBeGreaterThanOrEqual(1);
    expect(usage.alreadyRecorded).toBe(false);

    const usageAgainRes = await request.post('/api/usage', {
      headers: { Cookie: cookie },
      data: { promptId: prompt.id },
    });
    expect(usageAgainRes.status()).toBe(200);
    await expect(usageAgainRes.json()).resolves.toMatchObject({
      usageCount: usage.usageCount,
      alreadyRecorded: true,
    });
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
    const user = await createAndLoginUser(request);
    const cookie = user.cookie;

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
      data: {},
    });
    expect(completeRes.status()).toBe(200);
    await expect(completeRes.json()).resolves.toMatchObject({ ok: true });

    const completeAgainRes = await request.post(`/api/learn/${moduleSlug}/${lessonSlug}/complete`, {
      headers: { Cookie: cookie },
      data: {},
    });
    expect(completeAgainRes.status()).toBe(200);
    await expect(completeAgainRes.json()).resolves.toMatchObject({
      ok: true,
      alreadyCompleted: true,
      pointsAwarded: 0,
    });
  });

  test('BAC-13 landing page: anonymous visitors see it, signed-in users are redirected to the dashboard', async ({ request }) => {
    const anonRes = await request.get('/', { maxRedirects: 0 });
    expect(anonRes.status()).toBe(200);
    const html = await anonRes.text();
    expect(html).toContain('href="/register"');
    expect(html).toContain('href="/login"');

    const user = await createAndLoginUser(request);
    const loggedInRes = await request.get('/', { headers: { Cookie: user.cookie }, maxRedirects: 0 });
    expect(loggedInRes.status()).toBe(307);
    expect(loggedInRes.headers()['location']).toBe('/dashboard');
  });

  test('BAC-13-006/007 landing page: shows the curated recent-features list to anonymous visitors', async ({ request }) => {
    const res = await request.get('/', { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain('Neuigkeiten');
    // Spot-check one curated entry (RECENT_FEATURES in lib/constants.ts) to prove this is the
    // hand-written German list, not raw CHANGELOG.md/commit-message text (CR-006).
    expect(html).toContain('Eigene Kategorien erstellen');
  });
});
