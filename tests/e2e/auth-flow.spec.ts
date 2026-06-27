import { test, expect } from '@playwright/test';

// TODO: These tests need proper cookie context handling with Playwright request fixtures
// Temporarily skipping until we can properly test HttpOnly secure cookies in dev environment
test.describe.skip('Authentication Flow', () => {
  test('session cookie is set after user selection', async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for UserPicker component to render and auto-login
    await page.waitForSelector('[class*="rounded-xl"][class*="gap-2"]', { timeout: 10000 });

    // Session should exist after auto-login on first load
    const user = await page.evaluate(() =>
      fetch('/api/auth/me').then(r => r.json())
    );

    expect(user.user).toBeTruthy();
    expect(user.user.id).toBeGreaterThan(0);
    expect(user.user.name).toBeTruthy();
  });

  test('GET /api/auth/me returns current user from cookie', async ({ page }) => {
    await page.goto('/library');
    // Wait for UserPicker component to render and auto-login
    await page.waitForSelector('[class*="rounded-xl"][class*="gap-2"]', { timeout: 10000 });

    const response = await page.evaluate(() =>
      fetch('/api/auth/me').then(r => r.json())
    );

    expect(response.user).toBeTruthy();
    expect(response.user).toHaveProperty('id');
    expect(response.user).toHaveProperty('name');
    expect(response.user).toHaveProperty('totalPoints');
  });

  test('voting with mismatched userId returns 403', async ({ page }) => {
    await page.goto('/library');
    // Wait for UserPicker component to render and auto-login
    await page.waitForSelector('[class*="rounded-xl"][class*="gap-2"]', { timeout: 10000 });

    // Get current user and try to vote with wrong ID
    const response = await page.evaluate(async () => {
      const meResp = await fetch('/api/auth/me');
      const meData = await meResp.json();
      const currentUserId = meData.user?.id || 1;

      const voteResp = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId: 1,
          userId: currentUserId + 100,  // Wrong user
          value: 5,
        }),
      });

      return { status: voteResp.status };
    });

    // Should be rejected
    expect(response.status).toBe(403);
  });
});
