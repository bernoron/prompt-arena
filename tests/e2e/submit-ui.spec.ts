import { test, expect, type Page } from "@playwright/test";

async function goToSubmit(page: Page) {
  await page.goto("/submit");
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("h1:has-text(\"Prompt einreichen\")")).toBeVisible({ timeout: 10000 });
}

async function setUser(page: Page) {
  await page.evaluate(() => localStorage.setItem("promptarena_user_id", "1"));
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("h1:has-text(\"Prompt einreichen\")")).toBeVisible({ timeout: 10000 });
}

test.describe("Submit Form – No User Selected", () => {
  test.beforeEach(async ({ page }) => { await goToSubmit(page); });

  test("page heading is always visible", async ({ page }) => {
    await expect(page.locator("h1:has-text(\"Prompt einreichen\")")).toBeVisible();
  });
});

test.describe("Submit Form – Interaction", () => {
  test.beforeEach(async ({ page }) => {
    await goToSubmit(page);
    await setUser(page);
  });

  test("page heading is visible", async ({ page }) => {
    await expect(page.locator("h1:has-text(\"Prompt einreichen\")")).toBeVisible();
  });

  test("category buttons are clickable and highlight", async ({ page }) => {
    const btn = page.locator("button:has-text(\"Writing\")").first();
    await btn.click();
    await expect(btn).not.toHaveClass(/opacity-40/);
  });

  test("difficulty buttons toggle correctly", async ({ page }) => {
    const einstiegBtn = page.locator("button:has-text(\"Einstieg\")").first();
    const advancedBtn = page.locator("button:has-text(\"Fortgeschritten\")").first();
    await einstiegBtn.click();
    await expect(einstiegBtn).not.toHaveClass(/opacity-40/);
    await advancedBtn.click();
    await expect(advancedBtn).not.toHaveClass(/opacity-40/);
  });

  test("title input accepts text", async ({ page }) => {
    const input = page.locator("input[placeholder*=\"z.B.\"]").first();
    await input.fill("Mein Test Prompt");
    await expect(input).toHaveValue("Mein Test Prompt");
  });

  test("German prompt textarea accepts text", async ({ page }) => {
    const ta = page.locator("textarea").first();
    await ta.fill("Das ist ein Testprompt auf Deutsch.");
    await expect(ta).toHaveValue("Das ist ein Testprompt auf Deutsch.");
  });

  test("live preview updates when title is typed", async ({ page }) => {
    const input = page.locator("input[placeholder*=\"z.B.\"]").first();
    await input.fill("Vorschau-Titel Test");
    await expect(page.locator("text=Vorschau-Titel Test").first()).toBeVisible({ timeout: 3000 });
  });

  test("validation badges appear when submitting empty form", async ({ page }) => {
    const submitBtn = page.locator("button:has-text(\"Prompt einreichen\")").last();
    await submitBtn.click();
    const errors = page.locator("text=/✗ .+ fehlt/");
    await expect(errors.first()).toBeVisible({ timeout: 3000 });
  });

  test("successful submission redirects to library with toast", async ({ page }) => {
    await page.locator("button:has-text(\"Email\")").first().click();
    await page.locator("button:has-text(\"Einstieg\")").first().click();
    await page.locator("input[placeholder*=\"z.B.\"]").first()
      .fill("E2E-Test: Auto-Submit Prompt");
    await page.locator("textarea").first()
      .fill("Das ist ein automatisch erstellter Testprompt fuer E2E-Tests. Bitte ignorieren.");

    const submitBtn = page.locator("button:has-text(\"Prompt einreichen\")").last();
    await submitBtn.click();

    await expect(page).toHaveURL(/\/library/, { timeout: 10000 });
    await expect(page.locator("text=Prompt eingereicht")).toBeVisible({ timeout: 8000 });
  });
});
