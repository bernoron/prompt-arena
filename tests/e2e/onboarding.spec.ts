import { test, expect, type Page } from '@playwright/test';

const TEST_PASSWORD = 'Spec1234!';

// TEMP DIAGNOSTIC — surfaces browser console/page errors in the CI job log
// to find out why clicks inside the onboarding modal have no effect in CI
// but reproduce fine locally against an identical production build.
test.beforeEach(({ page }) => {
  page.on('console', (msg) => console.log(`[browser:${msg.type()}]`, msg.text()));
  page.on('pageerror', (err) => console.log('[pageerror]', err.stack ?? err.message));
  page.on('requestfinished', (req) => {
    if (req.url().includes('/api/onboarding')) console.log('[diag] request finished:', req.method(), req.url());
  });
  page.on('requestfailed', (req) => {
    if (req.url().includes('/api/onboarding')) console.log('[diag] request FAILED:', req.method(), req.url(), req.failure()?.errorText);
  });
});

/**
 * Registers a fresh user through the real API (using the page's own request
 * context, so the session cookie lands in the browser context's cookie jar)
 * and returns to the caller with the browser already authenticated.
 */
async function registerFreshUser(page: Page) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const name  = `Onboarding User ${suffix}`;
  const email = `onboarding-${suffix}@test.example`;

  const res = await page.request.post('/api/auth/register', {
    data: { name, email, password: TEST_PASSWORD },
  });
  expect(res.status()).toBe(201);
}

test.describe('BAC-14 onboarding funnel', () => {
  test('happy path: step through all cards, finish via CTA, does not reappear', async ({ page }) => {
    await registerFreshUser(page);
    await page.goto('/dashboard');

    // Modal is up front for a brand-new account.
    await expect(page.getByText('Willkommen bei PromptArena!')).toBeVisible();

    // Click "Weiter" until the last step swaps it for the CTA links.
    while (await page.getByRole('button', { name: 'Weiter' }).isVisible()) {
      await page.getByRole('button', { name: 'Weiter' }).click();
    }

    const libraryCta = page.getByRole('link', { name: 'Zur Prompt-Bibliothek' });
    await expect(libraryCta).toBeVisible();
    await libraryCta.click();

    await expect(page).toHaveURL(/\/library/);
    await expect(page.getByText('Willkommen bei PromptArena!')).toHaveCount(0);

    // Reload the dashboard — the funnel must not come back automatically.
    await page.goto('/dashboard');
    await expect(page.getByText('Willkommen bei PromptArena!')).toHaveCount(0);
  });

  test('skip: dismissing on the first card hides it for good', async ({ page }) => {
    await registerFreshUser(page);
    await page.goto('/dashboard');

    await expect(page.getByText('Willkommen bei PromptArena!')).toBeVisible();
    await page.getByRole('button', { name: 'Überspringen' }).click();

    // TEMP DIAGNOSTIC
    await page.waitForTimeout(500);
    const skipButtonCount = await page.getByRole('button', { name: 'Überspringen' }).count();
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    console.log('[diag] skip button count after click:', skipButtonCount);
    console.log('[diag] body text snippet:', JSON.stringify(bodyText));

    await expect(page.getByText('Willkommen bei PromptArena!')).toHaveCount(0);

    await page.goto('/dashboard');
    await expect(page.getByText('Willkommen bei PromptArena!')).toHaveCount(0);
  });

  test('re-open: ?tour=1 re-opens the funnel even after it was completed', async ({ page }) => {
    await registerFreshUser(page);
    await page.goto('/dashboard');

    await page.getByRole('button', { name: 'Überspringen' }).click();
    await expect(page.getByText('Willkommen bei PromptArena!')).toHaveCount(0);

    await page.goto('/dashboard?tour=1');
    await expect(page.getByText('Willkommen bei PromptArena!')).toBeVisible();
  });
});
