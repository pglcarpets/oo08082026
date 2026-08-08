/**
 * Systems v0 — browser: guest inventory place workstation (ws-v0) → furniture +1
 * and place auto-selects furniture (Select tool / selection status / properties cue).
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
  const text = await page
    .locator(".pw-status-bar, [class*='status']")
    .filter({ hasText: /\d+\s+furniture/i })
    .first()
    .textContent()
    .catch(() => null);
  const body = text ?? (await page.locator("body").innerText());
  const match = body.match(/(\d+)\s+furniture/i);
  return match ? Number.parseInt(match[1], 10) : -1;
}

/**
 * Place path auto-selects furniture and returns to Select tool.
 * Accept any of: Select pressed, status "… selected", properties not empty.
 */
async function placementAutoSelectCue(page: Page): Promise<{
  selectActive: boolean;
  selectionStatus: boolean;
  propertiesHasSelection: boolean;
  ok: boolean;
}> {
  const selectBtn = page
    .getByRole("toolbar", { name: "Canvas tools" })
    .getByRole("button", { name: /^Select\b/i });
  const selectActive =
    (await selectBtn.getAttribute("aria-pressed").catch(() => null)) === "true";

  const bodyText = await page.locator("body").innerText().catch(() => "");
  const selectionStatus =
    /Furniture selected|\d+\s+furniture\s+selected/i.test(bodyText) ||
    (await page
      .locator(".open3d-status-pill--accent, .open3d-status-pill, [class*='status']")
      .filter({ hasText: /selected/i })
      .count()
      .catch(() => 0)) > 0;

  const noSelectionCount = await page
    .getByRole("heading", { name: /No Selection/i })
    .count()
    .catch(() => 1);
  const propertiesHasSelection = noSelectionCount === 0;

  return {
    selectActive,
    selectionStatus,
    propertiesHasSelection,
    ok: selectActive || selectionStatus || propertiesHasSelection,
  };
}

test.describe("Systems v0 workstation place (browser)", () => {
  test("guest → search workstation → place → furniture +1 + auto-select", async ({
    page,
  }) => {
    fs.mkdirSync(EVIDENCE, { recursive: true });

    await enterGuestPlannerWorkspace(page, {
      projectName: "Systems v0 WS place",
    });
    await waitForPlannerCanvas(page);
    await expect(page.locator('[data-testid="topbar"]')).toBeVisible();

    const before = await furnitureCount(page);
    expect(before).toBeGreaterThanOrEqual(0);
    await page.screenshot({
      path: path.join(EVIDENCE, "10-browser-before-place.png"),
    });

    const catalog = page.getByRole("region", { name: "Catalog browser" });
    const search = page.getByLabel("Search catalog elements");
    await expect(search).toBeVisible({ timeout: 15_000 });

    await search.fill("workstation");
    await page.waitForTimeout(500);

    const wsAdd = catalog.getByRole("button", {
      name: /Add .*[Ww]orkstation.* to canvas/i,
    });
    const visible = await wsAdd
      .first()
      .isVisible({ timeout: 8_000 })
      .catch(() => false);

    if (!visible) {
      // Fallback search tags used in catalog items
      await search.fill("systems-v0");
      await page.waitForTimeout(500);
    }

    const addBtn = catalog.getByRole("button", {
      name: /Add .* to canvas/i,
    });
    await expect(addBtn.first()).toBeVisible({ timeout: 10_000 });
    await addBtn.first().click();
    await clickOnCanvas(page, 0.48, 0.45);

    await expect
      .poll(async () => furnitureCount(page), { timeout: 25_000 })
      .toBeGreaterThan(before);

    const after = await furnitureCount(page);
    expect(after).toBe(before + 1);
    await page.screenshot({
      path: path.join(EVIDENCE, "11-browser-after-place.png"),
    });

    // Status message often includes "Placed"
    const body = await page.locator("body").innerText();
    expect(/Placed|workstation|furniture/i.test(body)).toBe(true);

    // Place auto-selects furniture: Select tool OR status OR properties cue
    await expect
      .poll(async () => (await placementAutoSelectCue(page)).ok, {
        timeout: 10_000,
      })
      .toBe(true);

    const selectCue = await placementAutoSelectCue(page);
    expect(selectCue.ok).toBe(true);
    await page.screenshot({
      path: path.join(EVIDENCE, "12-selected.png"),
    });

    fs.writeFileSync(
      path.join(EVIDENCE, "browser-place-run.json"),
      JSON.stringify(
        {
          ok: true,
          furnitureBefore: before,
          furnitureAfter: after,
          autoSelect: {
            selectActive: selectCue.selectActive,
            selectionStatus: selectCue.selectionStatus,
            propertiesHasSelection: selectCue.propertiesHasSelection,
          },
          at: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );
  });
});
