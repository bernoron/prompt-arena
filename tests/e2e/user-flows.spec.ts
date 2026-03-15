import { test, expect } from '@playwright/test';

test.describe('User Flows', () => {
  test('root / redirects to /dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('dashboard loads with rank and points', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Dein Rang').first()).toBeVisible();
    await expect(page.locator('text=Punkte').first()).toBeVisible();
  });

  test('library loads and shows prompts', async ({ page }) => {
    await page.goto('/library');
    await page.waitForLoadState('domcontentloaded');
    // Search field visible
    await expect(page.locator('input[placeholder*="durchsuchen"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('leaderboard loads rankings', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Pts').first()).toBeVisible({ timeout: 10000 });
  });

  test('navigation between pages works', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    await page.click('text=Bibliothek');
    await expect(page).toHaveURL(/\/library/, { timeout: 10000 });

    await page.click('text=Rangliste');
    await expect(page).toHaveURL(/\/leaderboard/, { timeout: 10000 });

    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('/api/health is reachable', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
