import { expect, test } from "@playwright/test";
test("direct nav check", async ({ page }) => {
  await page.goto("/ooplanner/?plannerDevTools=1", { waitUntil: "domcontentloaded", timeout: 60000 });
  await expect(page.locator('[data-testid="canvas-stage"]')).toBeVisible({ timeout: 30000 });
});
