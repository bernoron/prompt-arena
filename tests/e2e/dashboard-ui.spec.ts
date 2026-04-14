import { test, expect, type Page } from "@playwright/test";

async function goToDashboard(page: Page) {
  await page.goto("/dashboard");
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("text=Dashboard").first()).toBeVisible({ timeout: 10000 });
}

async function selectFirstUser(page: Page) {
  await page.evaluate(() => localStorage.setItem("promptarena_user_id", "1"));
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("text=Dashboard").first()).toBeVisible({ timeout: 10000 });
}

test.describe("Dashboard – Hero & Static Content", () => {
  test.beforeEach(async ({ page }) => { await goToDashboard(page); });

  test("hero section shows Hallo", async ({ page }) => {
    await expect(page.locator("h1").filter({ hasText: /Hallo/ })).toBeVisible();
  });

  test("Prompt einreichen button links to /submit", async ({ page }) => {
    const btn = page.locator("a:has-text(\"Prompt einreichen\")").first();
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute("href", "/submit");
  });

  test("Bibliothek button links to /library", async ({ page }) => {
    const btn = page.locator("a:has-text(\"Bibliothek\")").first();
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute("href", "/library");
  });
});

test.describe("Dashboard – Stat Cards (logged-in user)", () => {
  test.beforeEach(async ({ page }) => {
    await goToDashboard(page);
    await selectFirstUser(page);
  });

  test("shows all four stat cards", async ({ page }) => {
    await expect(page.locator("text=Dein Rang")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=Punkte")).toBeVisible();
    await expect(page.locator("text=Meine Prompts genutzt")).toBeVisible();
    await expect(page.locator("text=Erhaltene Bewertungen")).toBeVisible();
  });

  test("XP card shows level badge and progress bar", async ({ page }) => {
    await expect(page.locator("text=Prompt-").first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator("div.bg-slate-100.rounded-full").first()).toBeVisible();
  });

  test("mini leaderboard shows Top Rangliste", async ({ page }) => {
    await expect(page.locator("text=Top Rangliste")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=Pts").first()).toBeVisible();
  });
});

test.describe("Dashboard – Trending Prompts", () => {
  test.beforeEach(async ({ page }) => { await goToDashboard(page); });

  test("Trending Prompts section is visible", async ({ page }) => {
    await expect(page.locator("text=Trending Prompts")).toBeVisible({ timeout: 8000 });
  });

  test("switching to Neueste tab updates the list", async ({ page }) => {
    await expect(page.locator("text=Trending Prompts")).toBeVisible({ timeout: 8000 });
    const newTab = page.locator("button:has-text(\"Neueste\")").first();
    await newTab.click();
    await expect(newTab).toHaveClass(/bg-white/);
    const hotTab = page.locator("button:has-text(\"Meistgenutzt\")").first();
    await hotTab.click();
    await expect(hotTab).toHaveClass(/bg-white/);
  });

  test("Ansehen link deep-links to library modal", async ({ page }) => {
    await expect(page.locator("text=Trending Prompts")).toBeVisible({ timeout: 8000 });
    const ansehen = page.locator("a:has-text(\"Ansehen\") ").first();
    if (!(await ansehen.isVisible())) test.skip();
    const href = await ansehen.getAttribute("href");
    expect(href).toMatch(/\/library\?prompt=\d+/);
    await ansehen.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/library/);
    await expect(page.locator("div.fixed.inset-0.z-50")).toBeVisible({ timeout: 10000 });
  });

  test("Alle Prompts link navigates to library", async ({ page }) => {
    await expect(page.locator("text=Trending Prompts")).toBeVisible({ timeout: 8000 });
    await page.locator("a:has-text(\"Alle Prompts in der Bibliothek\")").click();
    await expect(page).toHaveURL(/\/library/);
  });
});

test.describe("Dashboard – Challenge Section", () => {
  test.beforeEach(async ({ page }) => { await goToDashboard(page); });

  test("challenge section renders (active or empty state)", async ({ page }) => {
    const active   = page.locator("text=Weekly Challenge");
    const empty    = page.locator("text=Aktuell keine aktive Challenge");
    const skeleton = page.locator(".animate-pulse").first();
    await page.waitForTimeout(1000);
    const ok = await active.isVisible() || await empty.isVisible() || await skeleton.isVisible();
    expect(ok).toBe(true);
  });
});
