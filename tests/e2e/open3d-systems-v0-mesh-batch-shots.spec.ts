/**
 * Quiet magic: batch place 4 seats (2D) + workstation multi-part mesh (3D).
 * Evidence: 41-batch-4-2d.png, 42-workstation-mesh-3d.png
 */
import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  placeSeatsFromConfigurator,
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
  "07-systems-v0",
);

async function furnitureCount(page: Page): Promise<number> {
  const body = await page.locator("body").innerText();
  const match = body.match(/(\d+)\s+furniture/i);
  return match ? Number.parseInt(match[1], 10) : -1;
}

test.describe("Systems v0 mesh + batch shots", () => {
  test("Place 4 seats → 2D shot → 3D multi-part mesh shot", async ({ page }) => {
    fs.mkdirSync(EVIDENCE, { recursive: true });

    await enterGuestPlannerWorkspace(page, {
      projectName: "Systems mesh batch shots",
    });
    await waitForPlannerCanvas(page);

    const before = await furnitureCount(page);
    expect(before).toBeGreaterThanOrEqual(0);

    await placeSeatsFromConfigurator(page, 4);

    await expect
      .poll(async () => furnitureCount(page), { timeout: 25_000 })
      .toBe(before + 4);

    await page.screenshot({
      path: path.join(EVIDENCE, "41-batch-4-2d.png"),
    });

    await switchPlannerViewMode(page, "3d");
    await expect(page.getByTestId("planner-3d-canvas")).toBeVisible({
      timeout: 20_000,
    });
    // Allow multi-part mesh groups to settle in the renderer
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(EVIDENCE, "42-workstation-mesh-3d.png"),
    });

    fs.writeFileSync(
      path.join(EVIDENCE, "mesh-batch-shots-run.json"),
      JSON.stringify(
        {
          ok: true,
          furnitureBefore: before,
          furnitureAfter: before + 4,
          shots: ["41-batch-4-2d.png", "42-workstation-mesh-3d.png"],
          at: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );
  });
});
