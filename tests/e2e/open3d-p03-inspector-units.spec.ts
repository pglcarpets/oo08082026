/**
 * P03 browser proof — inspector width edit, labelled undo, ft-in display, locked reject.
 * Evidence: results/planner/phase-03/browser/
 */
import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import {
  clearPlannerStorageInPage,
  enterGuestPlannerWorkspace,
} from "./guestProjectSetup";
import {
  clickAtPoint,
  clickOnCanvas,
  firstFurnitureCenter,
  getFurnitureCount,
  selectPlannerTool,
  waitForPlannerCanvas,
  waitForPlannerCatalogReady,
} from "./plannerCanvasHelpers";

test.describe.configure({ mode: "serial", timeout: 180_000 });

const REPO_ROOT = process.cwd();
const EVIDENCE_DESKTOP = path.join(
  REPO_ROOT,
  "results",
  "planner",
  "phase-03",
  "browser",
  "desktop",
);

const PROJECT_NAME = "P03 inspector units";
const TARGET_WIDTH_MM = 1400;
const ORIGINAL_WIDTH_MM = 800;

function propertiesPanel(page: Page) {
  return page.getByRole("region", { name: "Properties panel" });
}

async function ensurePropertiesPanelOpen(page: Page): Promise<void> {
  const panel = propertiesPanel(page);
  if (await panel.isVisible().catch(() => false)) {
    return;
  }
  const toggle = page.getByRole("button", { name: /Toggle properties panel/i });
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click();
  }
  await expect(panel).toBeVisible({ timeout: 15_000 });
}

async function armFabricFurnitureSelection(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = (
      window as unknown as {
        __plannerFabricView?: {
          getObjects?: () => Array<{
            get?: (k: string) => unknown;
            plannerEntityType?: unknown;
          }>;
          setActiveObject?: (o: unknown) => void;
          requestRenderAll?: () => void;
          fire?: (name: string, payload: unknown) => void;
        };
      }
    ).__plannerFabricView;
    if (!w?.getObjects) return;
    const target = w.getObjects().find((o) => {
      const type =
        (typeof o.get === "function" ? o.get("plannerEntityType") : null) ??
        o.plannerEntityType;
      return type === "furniture";
    });
    if (!target) return;
    w.setActiveObject?.(target);
    w.fire?.("selection:created", { selected: [target], target });
    w.requestRenderAll?.();
  });
}

async function isFurnitureSelection(page: Page): Promise<boolean> {
  const furnitureType = propertiesPanel(page).getByText(/^Furniture$/, { exact: true });
  return (await furnitureType.count()) > 0;
}

async function selectFirstFurniture(page: Page): Promise<void> {
  await selectPlannerTool(page, "Select");
  await ensurePropertiesPanelOpen(page);
  const center = await firstFurnitureCenter(page);
  if (!center) throw new Error("No furniture on canvas");
  await clickAtPoint(page, center);
  if (!(await isFurnitureSelection(page))) {
    await armFabricFurnitureSelection(page);
  }
  await expect
    .poll(async () => isFurnitureSelection(page), { timeout: 20_000 })
    .toBe(true);
}

async function readFurnitureWidthMm(page: Page): Promise<number | null> {
  return page.evaluate(async (projectId) => {
    const openDb = () =>
      new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("planner-workspace-db");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error("indexedDB.open failed"));
      });

    const db = await openDb();
    try {
      const snapshot = await new Promise<string | null>((resolve, reject) => {
        const tx = db.transaction("projects", "readonly");
        const getReq = tx.objectStore("projects").get(projectId);
        getReq.onsuccess = () => {
          const row = getReq.result as { snapshot?: string } | undefined;
          resolve(row?.snapshot ?? null);
        };
        getReq.onerror = () => reject(getReq.error ?? new Error("projects.get failed"));
      });
      if (!snapshot?.trim()) return null;
      const parsed = JSON.parse(snapshot) as Record<string, unknown>;
      const project =
        (parsed.project as Record<string, unknown> | undefined) ?? parsed;
      const floors = project.floors as
        | Array<{ furniture?: Array<{ width?: number }> }>
        | undefined;
      const item = floors?.flatMap((f) => f.furniture ?? [])[0];
      return typeof item?.width === "number" ? item.width : null;
    } finally {
      db.close();
    }
  }, "planner-guest-local");
}

async function ensureCatalogSearchVisible(page: Page): Promise<void> {
  const search = page.getByLabel("Search catalog elements");
  if (await search.isVisible().catch(() => false)) {
    return;
  }
  const inventoryToggle = page.getByRole("button", {
    name: /Toggle inventory panel/i,
  });
  if (await inventoryToggle.isVisible().catch(() => false)) {
    await inventoryToggle.click();
  }
  const libraryTab = page
    .getByRole("tablist", { name: "Left panel" })
    .getByRole("tab", { name: /^Library$/i });
  if (await libraryTab.isVisible().catch(() => false)) {
    if ((await libraryTab.getAttribute("aria-selected")) !== "true") {
      await libraryTab.click();
    }
  }
  await expect(search).toBeVisible({ timeout: 15_000 });
}

async function placeChaise(page: Page): Promise<void> {
  await ensureCatalogSearchVisible(page);
  await waitForPlannerCatalogReady(page);
  const search = page.getByLabel("Search catalog elements");
  await expect(search).toBeVisible({ timeout: 15_000 });
  const clearSearch = page.getByRole("button", { name: "Clear search" });
  if (await clearSearch.isVisible().catch(() => false)) {
    await clearSearch.click();
  }
  await search.fill("");
  await search.fill("chaise");
  const catalog = page.getByRole("region", { name: "Catalog browser" });
  await expect(catalog.getByText("Chaise Lounge")).toBeVisible({
    timeout: 45_000,
  });
  const placeCta = catalog.getByRole("button", {
    name: /Place — Add Chaise Lounge|Add Chaise Lounge to canvas|Add .*[Cc]haise/i,
  });
  await expect
    .poll(async () => placeCta.count(), { timeout: 45_000 })
    .toBeGreaterThan(0);

  const before = await getFurnitureCount(page);
  await placeCta.first().evaluate((el: HTMLElement) => {
    el.click();
  });
  await clickOnCanvas(page, 0.52, 0.48);
  await expect
    .poll(async () => getFurnitureCount(page), { timeout: 25_000 })
    .toBe(before + 1);
}

async function openDisplayUnitMenu(page: Page) {
  await page.getByRole("button", { name: /Display unit:/i }).click();
}

test.describe("P03 inspector + units", () => {
  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCE_DESKTOP, { recursive: true });
  });

  test("width edit updates canvas, undo label restores mm authority", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

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
    await waitForPlannerCanvas(page);

    await placeChaise(page);
    await selectFirstFurniture(page);

    const width = propertiesPanel(page).getByRole("textbox", { name: /^Width$/i });
    await expect(width).toBeVisible({ timeout: 10_000 });
    await width.click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type("140");
    await page.keyboard.press("Tab");

    await expect
      .poll(async () => readFurnitureWidthMm(page), { timeout: 15_000 })
      .toBe(TARGET_WIDTH_MM);

    const undoButton = page.getByRole("button", { name: /Undo:/i });
    await expect(undoButton).toBeEnabled();
    await expect(undoButton).toHaveAttribute(
      "aria-label",
      `Undo: Change furniture width to ${TARGET_WIDTH_MM} mm`,
    );

    await undoButton.click();

    await expect
      .poll(async () => readFurnitureWidthMm(page), { timeout: 15_000 })
      .toBe(ORIGINAL_WIDTH_MM);

    await selectFirstFurniture(page);
    const widthAfterUndo = propertiesPanel(page).getByRole("textbox", {
      name: /^Width$/i,
    });
    await expect(widthAfterUndo).toHaveValue("80");

    await page.screenshot({
      path: path.join(EVIDENCE_DESKTOP, "width-undo-restored.png"),
      fullPage: false,
    });
  });

  test("ft-in display converts label while stored mm stays canonical", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

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
    await waitForPlannerCanvas(page);
    await placeChaise(page);
    await selectFirstFurniture(page);

    const width = propertiesPanel(page).getByRole("textbox", { name: /^Width$/i });
    await expect(width).toHaveValue("80");

    await openDisplayUnitMenu(page);
    const unitMenu = page.getByRole("menu");
    await expect(unitMenu).toBeVisible({ timeout: 10_000 });
    await expect(unitMenu.getByText("ft-in", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await unitMenu.getByText("ft-in", { exact: true }).click();

    await expect(width).toHaveValue(`2' 7.5"`);

    await openDisplayUnitMenu(page);
    await expect(unitMenu).toBeVisible({ timeout: 5_000 });
    await unitMenu.getByText("cm", { exact: true }).click();
    await expect(width).toHaveValue("80");

    await page.screenshot({
      path: path.join(EVIDENCE_DESKTOP, "ft-in-display.png"),
      fullPage: false,
    });
  });

  test("empty and locked inspector states are honest", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

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

    await expect(
      propertiesPanel(page).getByRole("heading", { name: /No selection/i }),
    ).toBeVisible();

    await placeChaise(page);
    await ensurePropertiesPanelOpen(page);
    await selectFirstFurniture(page);

    const lockBtn = propertiesPanel(page).getByRole("button", {
      name: /^(Lock|Unlock) element$/,
    });
    await expect(lockBtn).toBeVisible({ timeout: 10_000 });
    await lockBtn.click();
    await expect(page.getByRole("button", { name: /Undo: Lock furniture/i })).toBeEnabled({
      timeout: 10_000,
    });

    const panel = propertiesPanel(page);
    await expect
      .poll(
        async () => {
          if (await panel.locator('[data-locked="true"]').isVisible().catch(() => false)) {
            return true;
          }
          if (
            await panel
              .getByRole("heading", { name: /No selection/i })
              .isVisible()
              .catch(() => false)
          ) {
            await selectFirstFurniture(page);
          }
          return false;
        },
        { timeout: 20_000 },
      )
      .toBe(true);
    const unlockBtn = panel.getByRole("button", {
      name: "Unlock element",
      exact: true,
    });
    await expect(unlockBtn).toBeVisible({ timeout: 10_000 });
    await expect(unlockBtn).toHaveAttribute("aria-pressed", "true");

    const width = panel.getByRole("textbox", { name: /^Width$/i });
    await expect(width).toBeDisabled();
    await expect(width).toHaveAttribute("readonly", "");
    await expect(width).toHaveValue("80");

    await page.screenshot({
      path: path.join(EVIDENCE_DESKTOP, "locked-reject.png"),
      fullPage: false,
    });
  });
});