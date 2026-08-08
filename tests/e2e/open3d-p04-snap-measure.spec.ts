/**
 * P04 browser proof — snap-on grid, snap-off freehand, endpoint close.
 * Dimension tool (M) verification deferred until UI P01 promotes it.
 * Evidence: results/planner/phase-04/browser/
 */
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import {
  clearPlannerStorageInPage,
  enterGuestPlannerWorkspace,
} from "./guestProjectSetup";
import {
  drawWallByTwoClicks,
  getWallCount,
  hasFreehandEndpoint,
  PLANNER_GRID_MM,
  readLiveWalls,
  setPlannerSnapEnabled,
  waitForPlannerCanvas,
  wallEndpointsOnGrid,
  PLANNER_FABRIC_STAGE,
} from "./plannerCanvasHelpers";

test.describe.configure({ mode: "serial", timeout: 180_000 });

const REPO_ROOT = process.cwd();
const EVIDENCE_DESKTOP = path.join(
  REPO_ROOT,
  "results",
  "planner",
  "phase-04",
  "browser",
  "desktop",
);

const PROJECT_NAME = "P04 snap measure";

function pointsEqual(
  a: { x: number; y: number },
  b: { x: number; y: number },
  toleranceMm = 2,
): boolean {
  return (
    Math.hypot(a.x - b.x, a.y - b.y) <= toleranceMm
  );
}

test.describe("P04 snap and measure", () => {
  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCE_DESKTOP, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/ooplanner/?plannerDevTools=1", {
      waitUntil: "domcontentloaded",
    });
    await clearPlannerStorageInPage(page);
    await enterGuestPlannerWorkspace(page, {
      projectName: PROJECT_NAME,
      navigate: false,
      preservePlannerState: true,
    });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });
    await expect(page.locator(PLANNER_FABRIC_STAGE)).toHaveAttribute(
      "data-snap-enabled",
      "true",
    );
  });

  test("snap on — committed wall endpoints land on grid", async ({ page }) => {
    const wallsBefore = await getWallCount(page);
    await drawWallByTwoClicks(
      page,
      { rx: 0.22, ry: 0.42 },
      { rx: 0.78, ry: 0.42 },
    );
    await expect
      .poll(async () => getWallCount(page), { timeout: 10_000 })
      .toBe(wallsBefore + 1);

    const walls = await readLiveWalls(page);
    expect(walls.length).toBeGreaterThanOrEqual(wallsBefore + 1);
    const added = walls.at(-1);
    expect(added).toBeDefined();
    expect(wallEndpointsOnGrid([added!], PLANNER_GRID_MM)).toBe(true);

    await page.screenshot({
      path: path.join(EVIDENCE_DESKTOP, "snap-on-grid-wall.png"),
      fullPage: false,
    });
  });

  test("snap off — wall endpoints stay freehand", async ({ page }) => {
    await setPlannerSnapEnabled(page, false);
    await expect(page.getByText("Snap: Off")).toBeVisible();

    const wallsBefore = await getWallCount(page);
    await drawWallByTwoClicks(
      page,
      { rx: 0.19, ry: 0.37 },
      { rx: 0.71, ry: 0.53 },
    );
    await expect
      .poll(async () => getWallCount(page), { timeout: 10_000 })
      .toBe(wallsBefore + 1);

    const walls = await readLiveWalls(page);
    const added = walls.at(-1);
    expect(added).toBeDefined();
    expect(hasFreehandEndpoint([added!], PLANNER_GRID_MM)).toBe(true);

    await page.screenshot({
      path: path.join(EVIDENCE_DESKTOP, "snap-off-freehand-wall.png"),
      fullPage: false,
    });
  });

  test("endpoint snap — second wall start meets first wall end", async ({
    page,
  }) => {
    const wallsBefore = await getWallCount(page);
    await drawWallByTwoClicks(
      page,
      { rx: 0.2, ry: 0.6 },
      { rx: 0.8, ry: 0.6 },
    );
    await expect
      .poll(async () => getWallCount(page), { timeout: 10_000 })
      .toBe(wallsBefore + 1);

    const afterFirst = await readLiveWalls(page);
    const first = afterFirst.at(-1);
    expect(first).toBeDefined();

    await drawWallByTwoClicks(
      page,
      { rx: 0.8, ry: 0.6 },
      { rx: 0.8, ry: 0.25 },
    );
    await expect
      .poll(async () => getWallCount(page), { timeout: 10_000 })
      .toBe(wallsBefore + 2);

    const afterSecond = await readLiveWalls(page);
    const second = afterSecond.at(-1);
    expect(second).toBeDefined();
    expect(pointsEqual(second!.start, first!.end, 5)).toBe(true);

    await page.screenshot({
      path: path.join(EVIDENCE_DESKTOP, "endpoint-snap-close.png"),
      fullPage: false,
    });
  });

  test("dimension tool (M) is live on the rail", async ({ page }) => {
    const dimension = page.getByTestId("canvas-tool-dimension");
    await expect(dimension).toHaveAttribute("data-tier", "live");
    await expect(dimension).not.toHaveAttribute("data-deferred", "true");
    await page.locator(PLANNER_FABRIC_STAGE).click({ position: { x: 200, y: 200 } });
    await page.keyboard.press("m");
    await expect(page.getByText("Dimension · M · 2D")).toBeVisible();
    await expect(dimension).toHaveAttribute("data-tier", "live");
  });
});