import { test, expect } from "@playwright/test";

test.describe("Admin Panel — US5", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login page is accessible at /auth/login", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("input[type='email']")).toBeVisible({ timeout: 5_000 });
  });

  test("unauthenticated access to /admin redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
  });

  test("unauthenticated /api/admin/courses returns 401", async ({ request }) => {
    const res = await request.get("/api/admin/courses");
    expect(res.status()).toBe(401);
  });

  test("unauthenticated /api/admin/leads returns 401", async ({ request }) => {
    const res = await request.get("/api/admin/leads");
    expect(res.status()).toBe(401);
  });

  test("unauthenticated /api/admin/settings returns 401", async ({ request }) => {
    const res = await request.get("/api/admin/settings");
    expect(res.status()).toBe(401);
  });
});
