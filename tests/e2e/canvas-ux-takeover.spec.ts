/**
 * Focused canvas UX checks: Grid/Snap controls + grid overlay + panel chrome.
 * Evidence: results/planner/canvas-ux-fix/
 */
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";

const EVIDENCE = path.join(
  process.cwd(),
  "..",
  "results",
  "planner",
  "canvas-ux-fix",
);

test.describe.configure({ mode: "serial", timeout: 180_000 });

test("canvas Grid/Snap and dock chrome at desktop width", async ({ page }) => {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  await enterGuestPlannerWorkspace(page, { projectName: "Canvas UX takeover" });

  const topBar = page.getByTestId("planner-topbar");
  await expect(topBar).toBeVisible();

  const gridBtn = page.getByRole("button", { name: /Enable grid|Disable grid/i });
  const snapBtn = page.getByRole("button", { name: /Enable snap|Disable snap/i });
  await expect(gridBtn).toBeVisible();
  await expect(snapBtn).toBeVisible();

  // Ensure grid is on, then verify overlay paints.
  if ((await gridBtn.getAttribute("aria-pressed")) !== "true") {
    await gridBtn.click();
  }
  await expect(page.getByTestId("canvas-stage")).toHaveAttribute(
    "data-grid-enabled",
    "true",
  );
  await expect(page.getByTestId("planner-grid-overlay")).toBeVisible();

  await page.screenshot({
    path: path.join(EVIDENCE, "1280x800-grid-on.png"),
    fullPage: false,
  });

  // Toggle grid off — overlay should leave.
  await gridBtn.click();
  await expect(page.getByTestId("canvas-stage")).toHaveAttribute(
    "data-grid-enabled",
    "false",
  );
  await expect(page.getByTestId("planner-grid-overlay")).toHaveCount(0);

  await gridBtn.click(); // restore on for remaining checks

  // Inventory panel chrome (dockable strip)
  await expect(page.getByTestId("panel-grip-left")).toBeVisible();
  await expect(page.getByRole("button", { name: "Undock panel" })).toBeVisible();

  await page.screenshot({
    path: path.join(EVIDENCE, "1280x800-inventory-dock-chrome.png"),
    fullPage: false,
  });

  // Layers panel — open and ensure no duplicate Layers heading inside content
  await page.getByRole("button", { name: /Toggle layers panel/i }).click();
  await expect(page.getByTestId("panel-grip-bottom")).toBeVisible();
  const layersHeadings = page.getByRole("heading", { name: /^Layers$/i });
  // contentOnly chrome uses a span label, not h2 — zero headings is OK;
  // at most one if something still renders a header.
  await expect(layersHeadings).toHaveCount(0);

  await page.screenshot({
    path: path.join(EVIDENCE, "1280x800-layers-open.png"),
    fullPage: false,
  });

  fs.writeFileSync(
    path.join(EVIDENCE, "takeover-summary.json"),
    `${JSON.stringify(
      {
        ok: true,
        gridSnapDesktopButtons: true,
        gridOverlayToggles: true,
        dockChrome: true,
        layersDuplicateHeading: false,
        at: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
});

test("Grid/Snap hide on mobile; Prefs still has them", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await enterGuestPlannerWorkspace(page, { projectName: "Canvas UX mobile" });

  await expect(
    page.getByRole("button", { name: /Enable grid|Disable grid/i }),
  ).toBeHidden();
  await expect(
    page.getByRole("button", { name: /Enable snap|Disable snap/i }),
  ).toBeHidden();

  await page.getByRole("button", { name: /Prefs — open preferences menu/i }).click();
  await expect(page.getByRole("menuitem", { name: /Grid/i })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /Snap/i })).toBeVisible();

  await page.screenshot({
    path: path.join(EVIDENCE, "375x812-prefs-grid-snap.png"),
    fullPage: false,
  });
});
