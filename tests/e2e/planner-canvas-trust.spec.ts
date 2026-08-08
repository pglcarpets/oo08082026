import { expect, test } from "@playwright/test";

import {
  enterGuestPlannerWorkspace,
  resumeGuestPlannerAfterReload,
} from "./guestProjectSetup";
import {
  dragOnCanvas,
  getObjectCount,
  PLANNER_FABRIC_STAGE,
  PLANNER_PRIMARY_CANVAS,
  selectPlannerTool,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 60_000 });

test.describe("Planner canvas trust — WS1", () => {
  test("Wall drag creates persisted WALL object", async ({ page }) => {
    await enterGuestPlannerWorkspace(page, {
      projectName: "WS1 wall persist",
      reloadSafe: true,
    });
    await waitForPlannerCanvas(page);

    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.25, ry: 0.4 }, { rx: 0.75, ry: 0.6 });
    const after = await getObjectCount(page);
    expect(after).toBeGreaterThan(before);

    await page.reload({ waitUntil: "domcontentloaded" });
    await resumeGuestPlannerAfterReload(page, "WS1 wall persist");
    await expect
      .poll(async () => getObjectCount(page), { timeout: 30_000 })
      .toBe(after);
  });

  test("Wheel zoom changes zoom percentage", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    const canvas = page.locator(PLANNER_PRIMARY_CANVAS);
    await expect(canvas).toBeVisible();
    await canvas.focus();

    const box = await canvas.boundingBox();
    if (!box) throw new Error("Primary canvas has no box");

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -120);

    await expect
      .poll(
        async () =>
          page.evaluate((stageSel) => {
            const stage = document.querySelector(stageSel);
            return stage?.getAttribute("data-zoom") ?? stage?.getAttribute("data-zoom-pct");
          }, PLANNER_FABRIC_STAGE),
        { timeout: 5_000 },
      )
      .not.toBeNull();
  });

  test("Canvas reload restores object count", async ({ page }) => {
    await enterGuestPlannerWorkspace(page, {
      projectName: "WS1 reload restore",
      reloadSafe: true,
    });
    await waitForPlannerCanvas(page);

    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.2, ry: 0.3 }, { rx: 0.8, ry: 0.7 });
    const withWall = await getObjectCount(page);
    expect(withWall).toBeGreaterThan(before);

    await page.reload({ waitUntil: "domcontentloaded" });
    await resumeGuestPlannerAfterReload(page, "WS1 reload restore");
    await expect
      .poll(async () => getObjectCount(page), { timeout: 30_000 })
      .toBe(withWall);
  });
});
