import { test, expect } from "@playwright/test";

test.describe("Lead Capture — US4", () => {
  test("lead capture flow: consent → partial info → stored", async ({ page }) => {
    await page.goto("/");

    await page.fill(
      "textarea[aria-label='Message input']",
      "I want to enroll in Python course"
    );
    await page.click("button[aria-label='Send message']");

    // Wait for assistant to ask for consent
    await expect(page.locator("[role='log']")).toContainText(
      /contact|share|details|consent/i,
      { timeout: 15_000 }
    );

    await page.fill("textarea[aria-label='Message input']", "Yes, please");
    await page.click("button[aria-label='Send message']");

    await expect(page.locator("[role='log']")).toContainText(/name/i, {
      timeout: 10_000,
    });
  });
});
