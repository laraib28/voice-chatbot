import { test, expect } from "@playwright/test";

test.describe("Text Chat — US1", () => {
  test("visitor can send a message and receive a response", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("textarea[aria-label='Message input']");

    await page.fill("textarea[aria-label='Message input']", "What courses do you offer?");
    await page.click("button[aria-label='Send message']");

    // Response should appear within 15 seconds
    await expect(page.locator("[role='log']")).toContainText(/course|programme|learning/i, {
      timeout: 15_000,
    });
  });

  test("voice button is hidden when microphone unavailable", async ({ page }) => {
    await page.goto("/");
    // Deny microphone permission
    await page.context().grantPermissions([]);
    await page.reload();
    // Voice button should not be visible
    await expect(page.locator("button[aria-label*='voice']")).not.toBeVisible({ timeout: 3_000 });
  });
});
