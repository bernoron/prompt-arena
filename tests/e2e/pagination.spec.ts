import { test, expect } from '@playwright/test';

test.describe('Pagination', () => {
  test('GET /api/prompts returns paginated response structure', async ({ request }) => {
    const response = await request.get('/api/prompts?take=5');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('nextCursor');
    expect(data).toHaveProperty('hasNextPage');
    expect(Array.isArray(data.items)).toBe(true);
  });

  test('pagination cursor parameter returns different items', async ({ request }) => {
    // Fetch first page
    const res1 = await request.get('/api/prompts?take=3');
    const page1 = await res1.json();

    expect(page1.items.length).toBeLessThanOrEqual(3);

    if (page1.hasNextPage && page1.nextCursor) {
      // Fetch second page using cursor
      const res2 = await request.get(`/api/prompts?take=3&cursor=${page1.nextCursor}`);
      const page2 = await res2.json();

      expect(page2.items.length).toBeGreaterThan(0);

      // Ensure no overlap between pages
      const page1Ids = new Set(page1.items.map((p: any) => p.id));
      const page2Ids = page2.items.map((p: any) => p.id);
      page2Ids.forEach((id: number) => {
        expect(page1Ids.has(id)).toBe(false);
      });
    }
  });

  test('library page loads and displays prompts', async ({ page }) => {
    await page.goto('/library');
    await page.waitForLoadState('domcontentloaded');

    // Check that prompt cards are rendered (look for first one)
    const promptCard = page.locator('[class*="rounded-2xl"][class*="border"]').first();
    await expect(promptCard).toBeVisible({ timeout: 10000 });
  });

  test('search API returns valid response structure', async ({ request }) => {
    const response = await request.get('/api/prompts?search=test&take=100');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.items)).toBe(true);
    // Items should be capped at 50 even if take=100
    expect(data.items.length).toBeLessThanOrEqual(50);
  });
});
