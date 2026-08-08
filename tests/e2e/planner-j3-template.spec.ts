import { expect, test } from "@playwright/test";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import { waitForPlannerCanvas, getObjectCount } from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 60_000 });

test.describe("J3 — Template workflow", () => {
  test("Empty canvas shows template button", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    await expect(page.getByRole("button", { name: /Use template/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("Template picker opens and closes", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    const templateBtn = page.getByRole("button", { name: /Use template/i });
    await templateBtn.click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });

  test("Template application adds objects to canvas", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    const before = await getObjectCount(page);

    const templateBtn = page.getByRole("button", { name: /Use template/i });
    await templateBtn.click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const applyBtn = modal.getByRole("button", { name: /Apply|Use this/i }).first();
    await applyBtn.click({ timeout: 15_000 });

    await expect
      .poll(async () => getObjectCount(page), { timeout: 20_000 })
      .toBeGreaterThan(before);
  });
});
