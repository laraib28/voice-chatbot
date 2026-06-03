import { test, expect } from "@playwright/test";

test.describe("Multilingual Interaction — US2", () => {
  test("English session stays in English", async ({ page }) => {
    await page.goto("/");
    await page.fill("textarea[aria-label='Message input']", "What courses are available?");
    await page.click("button[aria-label='Send message']");

    await expect(page.locator("[role='log']")).toContainText(/course|programme|learn/i, {
      timeout: 15_000,
    });
    // Language indicator should show English
    await expect(page.getByText("English")).toBeVisible({ timeout: 5_000 });
  });

  test("Roman Urdu session detected correctly", async ({ page }) => {
    await page.goto("/");
    await page.fill(
      "textarea[aria-label='Message input']",
      "Mujhe courses ke baare mein batao"
    );
    await page.click("button[aria-label='Send message']");

    await expect(page.locator("[role='log']")).not.toBeEmpty({ timeout: 15_000 });
    await expect(page.getByText("Roman Urdu")).toBeVisible({ timeout: 5_000 });
  });
});
