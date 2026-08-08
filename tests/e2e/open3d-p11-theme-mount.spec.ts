/**
 * P11 browser proof — theme toggle mounted, persists across reload, no doc mutation.
 * Evidence: results/planner/phase-11/browser/
 */
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import {
  clearPlannerStorageInPage,
  enterGuestPlannerWorkspace,
  resumeGuestPlannerAfterReload,
} from "./guestProjectSetup";
import {
  getWallCount,
  readLiveWalls,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ mode: "serial", timeout: 180_000 });

const REPO_ROOT = process.cwd();
const EVIDENCE_DESKTOP = path.join(
  REPO_ROOT,
  "results",
  "planner",
  "phase-11",
  "browser",
  "desktop",
);
const EVIDENCE_MOBILE = path.join(
  REPO_ROOT,
  "results",
  "planner",
  "phase-11",
  "browser",
  "mobile-375x812",
);

const PROJECT_NAME = "P11 theme mount";

test.describe("P11 theme mount", () => {
  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCE_DESKTOP, { recursive: true });
    fs.mkdirSync(EVIDENCE_MOBILE, { recursive: true });
  });

  test("desktop — toggle dark, reload persists, document unchanged", async ({
    page,
  }) => {
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

    await expect(
      page.getByRole("radiogroup", { name: "Color theme" }),
    ).toBeVisible();

    const wallsBefore = await readLiveWalls(page);
    const wallCountBefore = await getWallCount(page);

    await page.getByRole("radio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.screenshot({
      path: path.join(EVIDENCE_DESKTOP, "workspace-dark.png"),
      fullPage: false,
    });

    const wallsAfterToggle = await readLiveWalls(page);
    expect(await getWallCount(page)).toBe(wallCountBefore);
    expect(wallsAfterToggle).toEqual(wallsBefore);

    await page.reload({ waitUntil: "domcontentloaded" });
    await resumeGuestPlannerAfterReload(page, PROJECT_NAME);
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("radio", { name: "Dark" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.getByRole("radio", { name: "Light" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await page.screenshot({
      path: path.join(EVIDENCE_DESKTOP, "workspace-light-after-reload.png"),
      fullPage: false,
    });
  });

  test("mobile 375x812 — theme toggle reachable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/ooplanner/?plannerDevTools=1", {
      waitUntil: "domcontentloaded",
    });
    await clearPlannerStorageInPage(page);
    await enterGuestPlannerWorkspace(page, {
      projectName: `${PROJECT_NAME} mobile`,
      navigate: false,
      preservePlannerState: true,
    });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    const dark = page.getByRole("radio", { name: "Dark" });
    await expect(dark).toBeVisible();
    await dark.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.screenshot({
      path: path.join(EVIDENCE_MOBILE, "theme-dark-375x812.png"),
      fullPage: false,
    });
  });
});