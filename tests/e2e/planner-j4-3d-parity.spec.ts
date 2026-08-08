import { expect, test } from "@playwright/test";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  getObjectCount,
  placeArmedCatalogOnCanvas,
  PLANNER_PRIMARY_CANVAS,
  switchPlannerViewMode,
  waitForPlannerCanvas,
  waitForPlannerCatalogReady,
} from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 90_000 });

test.describe("J4 — 2D↔3D parity", () => {
  test("Switch to 3D view and verify 3D canvas renders", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    await switchPlannerViewMode(page, "3d");

    await expect(page.getByTestId("planner-3d-canvas")).toBeVisible({
      timeout: 25_000,
    });
  });

  test("Split view shows 2D and 3D side-by-side", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    await page.getByRole("button", { name: "Split" }).click();

    const split = page.locator(".pw-split-view");
    await expect(split).toBeVisible({ timeout: 10_000 });

    await expect(page.locator(PLANNER_PRIMARY_CANVAS)).toBeVisible();
    await expect(
      page.locator(".pw-split-pane--3d canvas, [data-testid='planner-3d-canvas']").first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("Furniture placement visible in both 2D and 3D", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    await page.getByRole("button", { name: "Split" }).click();
    await expect(page.locator(".pw-split-view")).toBeVisible({ timeout: 10_000 });

    await waitForPlannerCatalogReady(page);
    const catalogSearch = page.getByLabel(
      /Search inventory by name or SKU|Search catalog elements/i,
    );
    await catalogSearch.fill("desk");

    const addBtn = page.getByRole("button", { name: /Add .* to canvas/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 15_000 });
    const before = await getObjectCount(page);
    await addBtn.click();
    await placeArmedCatalogOnCanvas(page, { beforeCount: before });

    await expect
      .poll(async () => getObjectCount(page), { timeout: 20_000 })
      .toBeGreaterThan(before);

    await expect(page.locator(PLANNER_PRIMARY_CANVAS)).toBeVisible();
    await expect(
      page.locator(".pw-split-pane--3d canvas, [data-testid='planner-3d-canvas']").first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("3D view orbit control works", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    await switchPlannerViewMode(page, "3d");

    const canvas3d = page.getByTestId("planner-3d-canvas");
    await expect(canvas3d).toBeVisible({ timeout: 25_000 });
    const box = await canvas3d.boundingBox();
    if (!box) throw new Error("3D canvas not visible");

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down({ button: "middle" });
    await page.mouse.move(centerX + 50, centerY + 50);
    await page.mouse.up({ button: "middle" });

    await expect(canvas3d).toBeVisible();
  });
});
