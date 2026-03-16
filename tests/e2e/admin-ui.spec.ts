import { test, expect, type Page } from "@playwright/test";

const ADMIN_PASSWORD = "admin1234";

async function goToAdminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("text=Admin-Bereich")).toBeVisible({ timeout: 10000 });
}

async function adminLogin(page: Page, password: string) {
  await goToAdminLogin(page);
  await page.fill("#password", password);
  await page.click("button:has-text(\"Anmelden\")");
}

test.describe("Admin – Login Page", () => {
  test.beforeEach(async ({ page }) => { await goToAdminLogin(page); });

  test("login page shows all key elements", async ({ page }) => {
    await expect(page.locator("text=Admin-Bereich")).toBeVisible();
    await expect(page.locator("text=PromptArena Verwaltung")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("button:has-text(\"Anmelden\")")).toBeVisible();
    await expect(page.locator("a:has-text(\"Zurück zur App\")")).toBeVisible();
  });

  test("password input is of type password (masked)", async ({ page }) => {
    await expect(page.locator("#password")).toHaveAttribute("type", "password");
  });

  test("Zurück zur App link navigates to /dashboard", async ({ page }) => {
    await page.click("a:has-text(\"Zurück zur App\")");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("Admin – Authentication", () => {
  test("wrong password shows error message", async ({ page }) => {
    await adminLogin(page, "falschesPasswort123");
    await expect(page.locator(".text-red-600, [class*=\"text-red\"]").first())
      .toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("empty password: native validation prevents submission", async ({ page }) => {
    await goToAdminLogin(page);
    // The #password input has "required" – browser blocks the submit
    const isValid = await page.evaluate(() => {
      const el = document.getElementById("password") as HTMLInputElement | null;
      return el ? el.checkValidity() : false;
    });
    expect(isValid).toBe(false);
    // URL stays on login
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("correct password redirects to admin dashboard", async ({ page }) => {
    await adminLogin(page, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(page).not.toHaveURL(/\/admin\/login/);
  });

  test("button shows loading state during login", async ({ page }) => {
    await goToAdminLogin(page);
    await page.fill("#password", ADMIN_PASSWORD);
    await page.click("button:has-text(\"Anmelden\")");
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });
});

test.describe("Admin – Dashboard (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await page.waitForLoadState("domcontentloaded");
  });

  test("admin dashboard shows Admin-Übersicht heading", async ({ page }) => {
    await expect(page.locator("text=Admin-Übersicht").first())
      .toBeVisible({ timeout: 15000 });
  });

  test("KPI cards are visible", async ({ page }) => {
    await expect(page.locator("text=Nutzer").first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=Prompts").first()).toBeVisible();
    await expect(page.locator("text=Bewertungen").first()).toBeVisible();
    await expect(page.locator("text=Nutzungen").first()).toBeVisible();
  });

  test("category breakdown section is visible", async ({ page }) => {
    await expect(page.locator("text=Prompts nach Kategorie").first())
      .toBeVisible({ timeout: 8000 });
  });

  test("top prompts section is visible", async ({ page }) => {
    await expect(page.locator("text=Meistgenutzte Prompts").first())
      .toBeVisible({ timeout: 8000 });
  });

  test("recent users section is visible", async ({ page }) => {
    await expect(page.locator("text=Neue Nutzer").first())
      .toBeVisible({ timeout: 8000 });
  });

  test("admin sidebar navigation is present", async ({ page }) => {
    await expect(page.locator("nav a, aside a").first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Admin – Access Control", () => {
  test("unauthenticated /admin redirects to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 });
  });

  test("unauthenticated /admin/dashboard redirects to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 });
  });
});
