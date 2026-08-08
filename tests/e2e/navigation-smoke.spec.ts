import { expect, test } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";

test("planner landing opens the planner canvas", async ({ page }) => {
  await page.goto("/planner", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Plan your office/i);
  await page.locator("#planner-hero").getByRole("link", { name: /Start free/i }).click();
  await page.waitForURL(/\/planner\/guest\/?/, { timeout: 30_000, waitUntil: "domcontentloaded" });
  await enterGuestPlannerWorkspace(page, { navigate: false });
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 30_000 });
});