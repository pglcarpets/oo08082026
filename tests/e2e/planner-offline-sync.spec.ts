import { expect, test } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";

test.describe("planner offline sync shell", () => {
  test.beforeEach(async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
  });

  test("shows offline banner and data-offline when network is offline", async ({ page, context }) => {
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));

    const shell = page.locator(".pw-shell");
    await expect(shell).toHaveAttribute("data-offline", "true");
    await expect(shell.getByText(/Offline Mode/i)).toBeVisible();
    await expect(shell.getByText(/IndexedDB/i)).toBeVisible();
  });

  test("clears offline banner when network is restored", async ({ page, context }) => {
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await expect(page.locator(".pw-shell")).toHaveAttribute("data-offline", "true");

    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect(page.locator(".pw-shell")).not.toHaveAttribute("data-offline", "true");
  });
});
