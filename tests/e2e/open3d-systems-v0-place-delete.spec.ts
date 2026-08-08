/**
 * Systems v0 — place workstation → auto-select → Delete → furniture back.
 * Evidence: results/planner/world-standard-wave/07-systems-v0/
 */
import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  clickOnCanvas,
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

test.describe("Systems v0 place + delete", () => {
  test("place workstation, Delete removes selected furniture", async ({
    page,
  }) => {
    fs.mkdirSync(EVIDENCE, { recursive: true });

    await enterGuestPlannerWorkspace(page, {
      projectName: "Systems v0 place-delete",
    });
    await waitForPlannerCanvas(page);

    const before = await furnitureCount(page);
    expect(before).toBeGreaterThanOrEqual(0);

    const catalog = page.getByRole("region", { name: "Catalog browser" });
    const search = page.getByLabel("Search catalog elements");
    await expect(search).toBeVisible({ timeout: 15_000 });
    await search.fill("workstation");
    await page.waitForTimeout(400);

    await catalog
      .getByRole("button", { name: /Add .* to canvas/i })
      .first()
      .click();
    await clickOnCanvas(page, 0.5, 0.45);

    await expect
      .poll(async () => furnitureCount(page), { timeout: 25_000 })
      .toBe(before + 1);

    // Auto-select should arm select tool; properties show workstation group
    await expect
      .poll(async () => {
        const text = await page.locator("body").innerText();
        return /Workstation \(systems v0\)|Furniture selected|Linear|L-shape/i.test(
          text,
        );
      }, { timeout: 10_000 })
      .toBe(true);

    await page.screenshot({
      path: path.join(EVIDENCE, "20-place-selected.png"),
    });

    await page.keyboard.press("Delete");
    await expect
      .poll(async () => furnitureCount(page), { timeout: 15_000 })
      .toBe(before);

    await page.screenshot({
      path: path.join(EVIDENCE, "21-after-delete.png"),
    });

    fs.writeFileSync(
      path.join(EVIDENCE, "place-delete-run.json"),
      JSON.stringify(
        {
          ok: true,
          furnitureBefore: before,
          furnitureAfterDelete: before,
          at: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );
  });
});
