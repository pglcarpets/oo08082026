/**
 * W4 browser — place seats → 3D orbit ON → 2D same **furniture ids** (not count-only).
 * Evidence: results/planner/world-standard-wave/04-orbit-continuity/
 *
 * Pose mm/rotation document authority remains unit-proven (`poseContinuityW4`).
 * Browser: id set stable across 2D↔3D remount + data-orbit-enabled + no crash on drag.
 */
import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  getFurnitureCount,
  placeSeatsFromConfigurator,
  PLANNER_FABRIC_STAGE,
  switchPlannerViewMode,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ mode: "serial", timeout: 120_000 });

const EVIDENCE = path.join(
  process.cwd(),
  "..",
  "results",
  "planner",
  "world-standard-wave",
  "04-orbit-continuity",
);

async function fabricFurnitureIds(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const w = (
      window as unknown as {
        __plannerFabricView?: {
          getObjects?: () => Array<{
            get?: (key: string) => unknown;
            plannerEntityType?: unknown;
            entityId?: unknown;
          }>;
        };
      }
    ).__plannerFabricView;
    if (!w?.getObjects) return [];
    const ids: string[] = [];
    for (const o of w.getObjects()) {
      const type =
        (typeof o.get === "function" ? o.get("plannerEntityType") : null) ??
        o.plannerEntityType;
      if (type !== "furniture") continue;
      const id =
        (typeof o.get === "function" ? o.get("entityId") : null) ?? o.entityId;
      if (typeof id === "string" && id.length > 0) ids.push(id);
    }
    return ids;
  });
}

function sorted(ids: string[]): string[] {
  return [...ids].sort();
}

test.describe("W4 orbit + 2D↔3D continuity (browser)", () => {
  test("place furniture → 3D orbit → 2D same furniture ids", async ({ page }) => {
    fs.mkdirSync(EVIDENCE, { recursive: true });

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await enterGuestPlannerWorkspace(page, { projectName: "W4 continuity" });
    await waitForPlannerCanvas(page);
    await expect(page.locator(PLANNER_FABRIC_STAGE)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-testid="topbar"]')).toBeVisible();

    const before = await getFurnitureCount(page);
    expect(before).toBeGreaterThanOrEqual(0);

    await placeSeatsFromConfigurator(page, 4);

    await expect
      .poll(async () => getFurnitureCount(page), { timeout: 25_000 })
      .toBe(before + 4);
    const afterPlace = await getFurnitureCount(page);
    expect(afterPlace).toBe(before + 4);

    const idsAfterPlace = await fabricFurnitureIds(page);
    expect(idsAfterPlace.length).toBe(afterPlace);
    expect(new Set(idsAfterPlace).size).toBe(idsAfterPlace.length);

    await page.screenshot({ path: path.join(EVIDENCE, "01-2d-after-place.png") });

    await switchPlannerViewMode(page, "3d");
    await expect(page.getByTestId("planner-3d-canvas")).toBeVisible({
      timeout: 20_000,
    });

    const orbit = page.locator(
      '[data-testid="three-viewer-container"][data-orbit-enabled="true"]',
    );
    await expect(orbit.first()).toBeVisible({ timeout: 15_000 });

    const box = await orbit.first().boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + 40, cy + 10, { steps: 5 });
      await page.mouse.up();
    }
    await expect(page.getByTestId("planner-3d-canvas")).toBeVisible();

    await page.screenshot({ path: path.join(EVIDENCE, "02-3d-orbit-on.png") });

    await switchPlannerViewMode(page, "2d");
    await waitForPlannerCanvas(page);
    await expect(page.locator(PLANNER_FABRIC_STAGE)).toBeVisible({
      timeout: 15_000,
    });

    await expect
      .poll(async () => getFurnitureCount(page), { timeout: 15_000 })
      .toBe(afterPlace);

    await expect
      .poll(async () => {
        const ids = await fabricFurnitureIds(page);
        return (
          ids.length === idsAfterPlace.length &&
          sorted(ids).join("|") === sorted(idsAfterPlace).join("|")
        );
      }, { timeout: 15_000 })
      .toBe(true);

    await switchPlannerViewMode(page, "3d");
    await expect(page.getByTestId("planner-3d-canvas")).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.locator(
        '[data-testid="three-viewer-container"][data-orbit-enabled="true"]',
      ),
    ).toBeVisible({ timeout: 15_000 });

    await switchPlannerViewMode(page, "2d");
    await waitForPlannerCanvas(page);
    await expect
      .poll(async () => getFurnitureCount(page), { timeout: 15_000 })
      .toBe(afterPlace);
    const idsFinal = await fabricFurnitureIds(page);
    expect(sorted(idsFinal)).toEqual(sorted(idsAfterPlace));

    await page.screenshot({ path: path.join(EVIDENCE, "03-2d-restored.png") });

    const hardAppErrors = consoleErrors.filter(
      (t) =>
        !t.includes("Download the React DevTools") &&
        !t.includes("favicon") &&
        !/net::ERR_/i.test(t),
    );

    fs.writeFileSync(
      path.join(EVIDENCE, "browser-run.json"),
      JSON.stringify(
        {
          phase: "P04",
          gate: "W4",
          status: "browser-green",
          furnitureBefore: before,
          furnitureAfterPlace: afterPlace,
          idsAfterPlace: sorted(idsAfterPlace),
          idsAfterToggle: sorted(idsFinal),
          idSetStable: true,
          orbitEnabled: true,
          placePath: "placeSeatsFromConfigurator Place 4 seats",
          browserProves: [
            "furniture-id-set-stable-2d-3d-2d",
            "furniture-count-status-bar",
            "data-orbit-enabled=true",
            "optional-left-drag-no-crash",
          ],
          browserDoesNotProve: [
            "three-mesh-userData.entityId-in-browser",
            "mm-position-live-assert",
            "document-rotation-degrees-live-assert",
          ],
          unitProves: [
            "poseContinuityW4 document↔scene nodes mm+rotation",
            "orbitControlsDefault enableControls",
            "workspaceOrbitWiring getPlannerViewerControlProps",
          ],
          consoleErrorCount: hardAppErrors.length,
          screenshots: [
            "01-2d-after-place.png",
            "02-3d-orbit-on.png",
            "03-2d-restored.png",
          ],
        },
        null,
        2,
      ),
      "utf8",
    );
  });
});
