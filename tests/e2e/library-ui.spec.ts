import { test, expect, type Page } from "@playwright/test";

async function goToLibrary(page: Page) {
  await page.goto("/library");
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("input[placeholder*=\"durchsuchen\"]")).toBeVisible({ timeout: 10000 });
}

async function waitForCards(page: Page) {
  await expect(page.locator("button.text-left").first()).toBeVisible({ timeout: 10000 });
}

async function selectFirstUser(page: Page) {
  await page.evaluate(() => localStorage.setItem("promptarena_user_id", "1"));
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.locator("input[placeholder*=\"durchsuchen\"]").waitFor({ timeout: 10000 });
}

test.describe("Library â Search & Filter", () => {
  test.beforeEach(async ({ page }) => { await goToLibrary(page); });

  test("search input accepts text", async ({ page }) => {
    const input = page.locator("input[placeholder*=\"durchsuchen\"]");
    await input.fill("Email");
    await expect(input).toHaveValue("Email");
  });

  test("search debounce filters list", async ({ page }) => {
    await waitForCards(page);
    const before = await page.locator("button.text-left").count();
    const input  = page.locator("input[placeholder*=\"durchsuchen\"]");
    await input.fill("xyzxyzxyz_keinTreffer");
    await page.waitForTimeout(400);
    const empty = page.locator("text=Keine Prompts gefunden");
    const after = await page.locator("button.text-left").count();
    expect(await empty.isVisible() || after < before).toBe(true);
    await input.clear();
    await page.waitForTimeout(400);
    await waitForCards(page);
  });

  test("category buttons toggle active state", async ({ page }) => {
    const btn = page.locator("button:has-text(\"Writing\")").first();
    await btn.click();
    await expect(btn).toHaveClass(/text-white/);
    await page.locator("button:has-text(\"Alle\")").first().click();
  });

  test("sort controls highlight selected option", async ({ page }) => {
    const btn = page.locator("button:has-text(\"Meistgenutzt\")").first();
    await btn.click();
    await expect(btn).toHaveClass(/bg-emerald-600/);
    await page.locator("button:has-text(\"Neueste\")").first().click();
  });

  test("prompt count label is shown", async ({ page }) => {
    await waitForCards(page);
    // "\d" in a JS string is just "d" – use double-backslash to get a real digit class
    await expect(page.locator("text=/\\d+ Prompt/")).toBeVisible();
  });
});

test.describe("Library â Prompt Modal", () => {
  test.beforeEach(async ({ page }) => {
    await goToLibrary(page);
    await waitForCards(page);
  });

  test("clicking a card opens the modal", async ({ page }) => {
    await page.locator("button.text-left").first().click();
    await expect(page.locator("div.fixed.inset-0.z-50")).toBeVisible();
  });

  test("modal shows content and close button", async ({ page }) => {
    await page.locator("button.text-left").first().click();
    const modal = page.locator("div.fixed.inset-0.z-50");
    await expect(modal).toBeVisible();
    await expect(modal.locator("pre")).toBeVisible();
    await expect(modal.locator("button").filter({ hasText: "×" })).toBeVisible();
  });

  test("modal closes with × button", async ({ page }) => {
    await page.locator("button.text-left").first().click();
    const modal = page.locator("div.fixed.inset-0.z-50");
    await expect(modal).toBeVisible();
    await modal.locator("button").filter({ hasText: "×" }).click();
    await expect(modal).not.toBeVisible();
  });

  test("modal closes with Escape key", async ({ page }) => {
    await page.locator("button.text-left").first().click();
    const modal = page.locator("div.fixed.inset-0.z-50");
    await expect(modal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });

  test("modal closes by clicking the backdrop", async ({ page }) => {
    await page.locator("button.text-left").first().click();
    const modal = page.locator("div.fixed.inset-0.z-50");
    await expect(modal).toBeVisible();
    await modal.click({ position: { x: 10, y: 10 } });
    await expect(modal).not.toBeVisible();
  });

  test("copy button shows confirmation feedback", async ({ page }) => {
    await page.locator("button.text-left").first().click();
    const modal   = page.locator("div.fixed.inset-0.z-50");
    const copyBtn = modal.locator("button:has-text(\"Kopieren\")");
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(modal.locator("button:has-text(\"Kopiert!\")")).toBeVisible();
    await expect(modal.locator("button:has-text(\"Kopieren\")")).toBeVisible({ timeout: 4000 });
  });

  test("'Ich hab's genutzt' button disables after click", async ({ page }) => {
    await page.locator("button.text-left").first().click();
    const modal   = page.locator("div.fixed.inset-0.z-50");
    const usedBtn = modal.locator("button:has-text(\"Ich hab\")");
    await expect(usedBtn).toBeVisible();
    await usedBtn.click();
    await expect(modal.locator("button:has-text(\"Danke\")")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Library â Vote Stars", () => {
  test("vote stars appear when a user is selected", async ({ page }) => {
    await goToLibrary(page);
    await selectFirstUser(page);
    await waitForCards(page);
    await page.locator("button.text-left").first().click();
    const modal = page.locator("div.fixed.inset-0.z-50");
    await expect(modal.locator("text=Bewerten:")).toBeVisible({ timeout: 5000 });
    await expect(modal.locator("button:has-text(\"★\")").first()).toBeVisible();
  });

  test("clicking a star registers the vote optimistically", async ({ page }) => {
    await goToLibrary(page);
    await selectFirstUser(page);
    await waitForCards(page);
    await page.locator("button.text-left").first().click();
    const modal   = page.locator("div.fixed.inset-0.z-50");
    const starBtn = modal.locator("button:has-text(\"★\")").nth(2);
    await starBtn.click();
    await expect(modal.locator("text=+3 Pts")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Library â Deep Link", () => {
  test("?prompt=<id> auto-opens the matching modal", async ({ page }) => {
    const res     = await page.request.get("/api/prompts");
    const prompts = await res.json();
    if (!Array.isArray(prompts) || prompts.length === 0) test.skip();
    const id = prompts[0].id;
    await page.goto("/library?prompt=" + id);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("div.fixed.inset-0.z-50")).toBeVisible({ timeout: 10000 });
    await expect(page).not.toHaveURL(/prompt=/);
  });
});
