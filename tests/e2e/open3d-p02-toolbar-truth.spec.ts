/**
 * P02 browser proof — Prefs grid/snap toggles change canvas + persist across reload.
 * Evidence: results/planner/phase-02/browser/
 */
import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import {
  clearPlannerStorageInPage,
  enterGuestPlannerWorkspace,
  resumeGuestPlannerAfterReload,
} from "./guestProjectSetup";
import {
  PLANNER_FABRIC_STAGE,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ mode: "serial", timeout: 180_000 });

const REPO_ROOT = process.cwd();
const EVIDENCE_DESKTOP = path.join(
  REPO_ROOT,
  "results",
  "planner",
  "phase-02",
  "browser",
  "desktop",
);
const EVIDENCE_MOBILE = path.join(
  REPO_ROOT,
  "results",
  "planner",
  "phase-02",
  "browser",
  "mobile-375x812",
);

const PROJECT_NAME = "P02 toolbar truth";

async function openPrefsMenu(page: Page) {
  await page.getByRole("button", { name: "Prefs — open preferences menu" }).click();
}

async function toggleGridOff(page: Page) {
  const desktopGrid = page.getByRole("button", { name: /Disable grid/i });
  if (await desktopGrid.isVisible()) {
    await desktopGrid.click();
    return;
  }
  await openPrefsMenu(page);
  await page.getByRole("menuitem", { name: /Disable Grid/i }).click();
}

async function toggleSnapOff(page: Page) {
  const desktopSnap = page.getByRole("button", { name: /Disable snap/i });
  if (await desktopSnap.isVisible()) {
    await desktopSnap.click();
    return;
  }
  await openPrefsMenu(page);
  await page.getByRole("menuitem", { name: /Disable Snap/i }).click();
}

async function readWorkspacePrefs(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem("planner-workspace-preferences");
    return raw ? (JSON.parse(raw) as { gridEnabled?: boolean; snapEnabled?: boolean }) : null;
  });
}

test.describe("P02 toolbar truth", () => {
  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCE_DESKTOP, { recursive: true });
    fs.mkdirSync(EVIDENCE_MOBILE, { recursive: true });
  });

  test("grid and snap toggles update canvas and persist across reload", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // One-shot clear — no init script so reload keeps localStorage prefs.
    await page.goto("/ooplanner/?plannerDevTools=1", {
      waitUntil: "domcontentloaded",
    });
    await clearPlannerStorageInPage(page);
    await page.reload({ waitUntil: "domcontentloaded" });

    await enterGuestPlannerWorkspace(page, {
      projectName: PROJECT_NAME,
      navigate: false,
      preservePlannerState: true,
    });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    const stage = page.locator(PLANNER_FABRIC_STAGE);
    await expect(stage).toHaveAttribute("data-grid-enabled", "true");
    await expect(stage).toHaveAttribute("data-snap-enabled", "true");
    await expect(page.getByTestId("planner-grid-overlay")).toBeVisible();

    await toggleGridOff(page);
    await expect(stage).toHaveAttribute("data-grid-enabled", "false");
    await expect(page.getByTestId("planner-grid-overlay")).toHaveCount(0);

    await toggleSnapOff(page);
    await expect(stage).toHaveAttribute("data-snap-enabled", "false");
    await expect(page.getByText("Snap: Off")).toBeVisible();

    const prefsBeforeReload = await readWorkspacePrefs(page);
    expect(prefsBeforeReload?.gridEnabled).toBe(false);
    expect(prefsBeforeReload?.snapEnabled).toBe(false);

    await page.reload({ waitUntil: "domcontentloaded" });
    await resumeGuestPlannerAfterReload(page, PROJECT_NAME);

    await expect(stage).toHaveAttribute("data-grid-enabled", "false");
    await expect(stage).toHaveAttribute("data-snap-enabled", "false");
    await expect(page.getByTestId("planner-grid-overlay")).toHaveCount(0);
    await expect(page.getByText("Snap: Off")).toBeVisible();

    const prefsAfterReload = await readWorkspacePrefs(page);
    expect(prefsAfterReload?.gridEnabled).toBe(false);
    expect(prefsAfterReload?.snapEnabled).toBe(false);

    await page.screenshot({
      path: path.join(EVIDENCE_DESKTOP, "grid-snap-off-after-reload.png"),
      fullPage: false,
    });
  });

  test("deferred tools live in Coming soon group, not Drawing tools", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await enterGuestPlannerWorkspace(page, { projectName: `${PROJECT_NAME} rail` });
    await waitForPlannerCanvas(page);

    await expect(
      page.getByTestId("canvas-tool-group-drawing-tools"),
    ).toBeVisible();
    await expect(
      page.getByTestId("canvas-tool-group-coming-soon"),
    ).toBeVisible();
    await expect(page.getByTestId("canvas-tool-room")).toHaveAttribute(
      "data-deferred",
      "true",
    );
    await expect(page.getByTestId("canvas-tool-dimension")).toHaveAttribute(
      "data-deferred",
      "true",
    );

    await page.screenshot({
      path: path.join(EVIDENCE_DESKTOP, "deferred-tools-coming-soon.png"),
      fullPage: false,
    });
  });

  test("mobile 375x812 — grid toggle and status visible", async ({ page }) => {
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

    await toggleGridOff(page);
    await expect(page.locator(PLANNER_FABRIC_STAGE)).toHaveAttribute(
      "data-grid-enabled",
      "false",
    );

    await page.screenshot({
      path: path.join(EVIDENCE_MOBILE, "grid-off-375x812.png"),
      fullPage: false,
    });
  });
});