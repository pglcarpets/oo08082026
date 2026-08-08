import { expect, test, type Page } from "@playwright/test";
import {
  enterGuestPlannerWorkspace,
  resumeGuestPlannerAfterReload,
} from "./guestProjectSetup";
import {
  dragOnCanvas,
  getObjectCount,
  selectPlannerTool,
  switchPlannerViewMode,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 60_000 });

async function seedWall(page: Page): Promise<number> {
  await selectPlannerTool(page, "Wall");
  await dragOnCanvas(page, { rx: 0.25, ry: 0.4 }, { rx: 0.75, ry: 0.6 });
  const count = await getObjectCount(page);
  expect(count).toBeGreaterThan(0);
  return count;
}

test.describe("J6 — Guest document restore", () => {
  test("Guest workspace can be revisited with same object count", async ({
    page,
    context,
  }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.25, ry: 0.4 }, { rx: 0.75, ry: 0.6 });

    const after = await getObjectCount(page);
    expect(after).toBeGreaterThan(before);

    const url = page.url();

    const newPage = await context.newPage();
    await newPage.goto(url, { waitUntil: "domcontentloaded" });
    await waitForPlannerCanvas(newPage);

    const restored = await getObjectCount(newPage);
    expect(restored).toBe(after);

    await newPage.close();
  });

  test("Canvas not blank after view mode round-trip", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    const seeded = await seedWall(page);

    await switchPlannerViewMode(page, "3d");
    await expect(page.getByTestId("planner-3d-canvas")).toBeVisible({
      timeout: 20_000,
    });
    await switchPlannerViewMode(page, "2d");
    await waitForPlannerCanvas(page);

    await expect
      .poll(async () => getObjectCount(page), { timeout: 15_000 })
      .toBe(seeded);
  });

  test("Object count persists across view mode changes", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    const initial = await seedWall(page);

    const split = page.getByRole("button", { name: "Split" });
    if (await split.isVisible().catch(() => false)) {
      await split.click();
      await expect(page.locator(".pw-split-view")).toBeVisible({ timeout: 10_000 });
    }

    await expect
      .poll(async () => getObjectCount(page), { timeout: 10_000 })
      .toBe(initial);

    await switchPlannerViewMode(page, "3d");
    await expect(page.getByTestId("planner-3d-canvas")).toBeVisible({
      timeout: 20_000,
    });
    await switchPlannerViewMode(page, "2d");
    await waitForPlannerCanvas(page);

    await expect
      .poll(async () => getObjectCount(page), { timeout: 15_000 })
      .toBe(initial);
  });

  test("Hard reload preserves guest draft object count", async ({ page }) => {
    await enterGuestPlannerWorkspace(page, {
      projectName: "J6 restore",
      reloadSafe: true,
    });
    await waitForPlannerCanvas(page);
    const seeded = await seedWall(page);

    await page.reload({ waitUntil: "domcontentloaded" });
    await resumeGuestPlannerAfterReload(page, "J6 restore");

    await expect
      .poll(async () => getObjectCount(page), { timeout: 30_000 })
      .toBe(seeded);
  });
});
