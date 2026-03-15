import { test, expect } from '@playwright/test';

test.describe('Layout Separation: User has Navigation, Admin has Sidebar only', () => {

  // ── User pages ────────────────────────────────────────────────────────────
  for (const route of ['/dashboard', '/library', '/leaderboard', '/submit']) {
    test(`${route} shows main navigation bar`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      // Main sticky header should be present
      await expect(page.locator('header').first()).toBeVisible({ timeout: 15000 });
      // Nav links visible
      await expect(page.getByRole('link', { name: 'Bibliothek' }).first()).toBeVisible();
      // Admin sidebar nav links should NOT be present on user pages
      const adminSidebarLink = page.getByRole('link', { name: 'Nutzer' });
      await expect(adminSidebarLink).not.toBeVisible();
    });
  }

  // ── Admin login page ──────────────────────────────────────────────────────
  test('/admin/login has no navigation and no sidebar', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('domcontentloaded');
    // No user nav
    await expect(page.getByRole('link', { name: 'Bibliothek' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Rangliste' })).not.toBeVisible();
    // No admin sidebar navigation links (sidebar only appears when authenticated in panel)
    await expect(page.getByRole('link', { name: 'Nutzer' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Übersicht' })).not.toBeVisible();
    // Login form is visible
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  // ── Admin panel (unauthenticated → redirects) ─────────────────────────────
  test('/admin redirects to /admin/login when unauthenticated', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 });
  });
});
