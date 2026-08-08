/**
 * Systems v0 — Place N seats (2/4/10) from configurator panel.
 * Evidence: results/planner/world-standard-wave/07-systems-v0/40-batch-*.png
 */
import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  placeSeatsFromConfigurator,
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

test.describe("Systems v0 batch place", () => {
  test("Place 4 seats from configurator → furniture +4", async ({ page }) => {
    fs.mkdirSync(EVIDENCE, { recursive: true });

    await enterGuestPlannerWorkspace(page, {
      projectName: "Systems batch place",
    });
    await waitForPlannerCanvas(page);

    const before = await furnitureCount(page);
    expect(before).toBeGreaterThanOrEqual(0);

    await page.screenshot({
      path: path.join(EVIDENCE, "40-batch-ui.png"),
    });

    await placeSeatsFromConfigurator(page, 4);

    await expect
      .poll(async () => furnitureCount(page), { timeout: 25_000 })
      .toBe(before + 4);

    await page.screenshot({
      path: path.join(EVIDENCE, "40-batch-after-4.png"),
    });

    // Place 2 more (offset origin should not fail)
    await placeSeatsFromConfigurator(page, 2);
    await expect
      .poll(async () => furnitureCount(page), { timeout: 25_000 })
      .toBe(before + 6);

    await page.screenshot({
      path: path.join(EVIDENCE, "40-batch-after-6.png"),
    });

    fs.writeFileSync(
      path.join(EVIDENCE, "batch-place-run.json"),
      JSON.stringify(
        {
          ok: true,
          furnitureBefore: before,
          furnitureAfter: before + 6,
          shots: [
            "40-batch-ui.png",
            "40-batch-after-4.png",
            "40-batch-after-6.png",
          ],
          at: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );
  });
});
