/**
 * P01 browser proof — published SVG symbol survives rotate, scale (width), save, hard reload.
 * Evidence: results/planner/phase-01-svg-persist/browser/
 */
import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import {
  clearPlannerStorageInPage,
  enterGuestPlannerWorkspace,
  getGuestPlannerStorageProjectId,
} from "./guestProjectSetup";
import {
  clickAtPoint,
  dismissMobilePlannerPanels,
  ensurePlannerCanvasOnScreen,
  firstFurnitureCenter,
  getFurnitureCount,
  placeArmedCatalogOnCanvas,
  PLANNER_PAINT_CANVAS,
  PLANNER_PRIMARY_CANVAS,
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
  "phase-01-svg-persist",
  "browser",
  "desktop",
);
const EVIDENCE_MOBILE = path.join(
  REPO_ROOT,
  "results",
  "planner",
  "phase-01-svg-persist",
  "browser",
  "mobile-375x812",
);

const PROJECT_NAME = "P01 SVG persist";
const TARGET_ROTATION = 45;
const TARGET_WIDTH_MM = 900;

type FurnitureSnapshot = {
  id: string;
  rotation: number;
  width: number;
  previewImageUrl?: string;
};

async function countSvgPaintedFurniture(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = (
      window as unknown as { __plannerFabricView?: { getObjects?: () => unknown[] } }
    ).__plannerFabricView;
    if (!canvas?.getObjects) return 0;
    return canvas.getObjects().filter((obj) => {
      const mode = (obj as { planPaintMode?: string }).planPaintMode;
      return mode === "svg";
    }).length;
  });
}

async function readSvgFurnitureFromIdb(page: Page): Promise<FurnitureSnapshot | null> {
  const projectId = getGuestPlannerStorageProjectId(page);
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

      const parsed = JSON.parse(snapshot) as {
        project?: {
          floors?: Array<{
            furniture?: Array<{
              id: string;
              rotation?: number;
              width?: number;
              previewImageUrl?: string;
            }>;
          }>;
        };
        floors?: Array<{
          furniture?: Array<{
            id: string;
            rotation?: number;
            width?: number;
            previewImageUrl?: string;
          }>;
        }>;
      };

      const project = parsed.project ?? parsed;
      const items =
        project.floors?.flatMap((f) => f.furniture ?? []) ?? [];
      const svgItem =
        items.find((f) => (f.previewImageUrl ?? "").includes("/svg-catalog/")) ??
        items[items.length - 1];
      if (!svgItem?.id) return null;
      return {
        id: svgItem.id,
        rotation: svgItem.rotation ?? 0,
        width: svgItem.width ?? 0,
        previewImageUrl: svgItem.previewImageUrl,
      };
    } finally {
      db.close();
    }
  }, projectId);
}

async function waitForSavedLocally(page: Page): Promise<void> {
  await expect(page.locator('[data-testid="open3d-save-status"]')).toHaveAttribute(
    "data-status",
    "saved",
    { timeout: 30_000 },
  );
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
    const selected = await libraryTab.getAttribute("aria-selected");
    if (selected !== "true") {
      await libraryTab.click();
    }
  }

  await expect(search).toBeVisible({ timeout: 15_000 });
}

async function placeChaiseSvg(page: Page): Promise<void> {
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
  await expect(placeCta.first()).toBeVisible({ timeout: 10_000 });
  await placeCta.first().evaluate((el: HTMLElement) => {
    el.click();
  });
  const placeTool = page
    .getByRole("toolbar", { name: "Canvas tools" })
    .getByRole("radio", { name: /^Place/ });
  await expect(placeTool).toBeChecked({ timeout: 8_000 });

  await dismissMobilePlannerPanels(page);
  await placeArmedCatalogOnCanvas(page, {
    beforeCount: before,
    furnitureTimeoutMs: 40_000,
  });

  await expect
    .poll(async () => countSvgPaintedFurniture(page), { timeout: 15_000 })
    .toBeGreaterThan(0);
}

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
            planPaintMode?: unknown;
          }>;
          setActiveObject?: (o: unknown) => void;
          requestRenderAll?: () => void;
          fire?: (name: string, payload: unknown) => void;
        };
      }
    ).__plannerFabricView;
    if (!w?.getObjects || !w.setActiveObject) return;
    const target =
      w.getObjects().find((o) => {
        const type =
          (typeof o.get === "function" ? o.get("plannerEntityType") : null) ??
          o.plannerEntityType;
        const mode =
          (typeof o.get === "function" ? o.get("planPaintMode") : null) ??
          o.planPaintMode;
        return type === "furniture" && mode === "svg";
      }) ??
      w.getObjects().find((o) => {
        const type =
          (typeof o.get === "function" ? o.get("plannerEntityType") : null) ??
          o.plannerEntityType;
        return type === "furniture";
      });
    if (!target) return;
    w.setActiveObject(target);
    w.fire?.("selection:created", { selected: [target], target });
    w.requestRenderAll?.();
  });
}

async function isFurnitureSelection(page: Page): Promise<boolean> {
  const body = await page.locator("body").innerText();
  if (/Furniture selected|\d+\s+furniture\s+selected/i.test(body)) {
    return true;
  }
  const furnitureType = propertiesPanel(page).getByText(/^Furniture$/, { exact: true });
  return (await furnitureType.count()) > 0;
}

async function selectPlacedFurniture(page: Page): Promise<void> {
  await selectPlannerTool(page, "Select");
  await page.keyboard.press("Escape");
  await ensurePropertiesPanelOpen(page);
  await ensurePlannerCanvasOnScreen(page);

  const furniturePoint = await firstFurnitureCenter(page);
  if (furniturePoint) {
    await clickAtPoint(page, furniturePoint);
  }

  if (!(await isFurnitureSelection(page))) {
    await armFabricFurnitureSelection(page);
  }

  if (!(await isFurnitureSelection(page)) && furniturePoint) {
    await clickAtPoint(page, furniturePoint);
    await armFabricFurnitureSelection(page);
  }

  await expect
    .poll(async () => isFurnitureSelection(page), { timeout: 20_000 })
    .toBe(true);
  await ensurePropertiesPanelOpen(page);
  await expect(
    propertiesPanel(page).getByRole("heading", { name: /No [Ss]election/i }),
  ).toHaveCount(0, { timeout: 10_000 });
  await expect(propertiesPanel(page).getByText(/^Furniture$/)).toBeVisible({
    timeout: 10_000,
  });
}

test.describe("P01 SVG symbol persist (desktop)", () => {
  test("rotate + scale width, save, reload keeps SVG paint mode", async ({ page }) => {
    fs.mkdirSync(EVIDENCE_DESKTOP, { recursive: true });

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
    await placeChaiseSvg(page);

    await page.screenshot({
      path: path.join(EVIDENCE_DESKTOP, "01-chaise-placed.png"),
      fullPage: false,
    });

    await selectPlacedFurniture(page);
    const inspector = propertiesPanel(page);

    const width = inspector.getByRole("textbox", { name: /^Width$/i });
    await expect(width).toBeVisible({ timeout: 10_000 });
    await width.click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type("90");
    await page.keyboard.press("Tab");

    await expect
      .poll(async () => (await readSvgFurnitureFromIdb(page))?.width, {
        timeout: 15_000,
      })
      .toBe(TARGET_WIDTH_MM);

    await page.evaluate((degrees) => {
      const w = (
        window as unknown as {
          __plannerFabricView?: {
            getObjects?: () => Array<{
              get?: (k: string) => unknown;
              plannerEntityType?: unknown;
              planPaintMode?: unknown;
              angle?: number;
              set?: (key: string, value: unknown) => void;
              setCoords?: () => void;
            }>;
            fire?: (name: string, payload: unknown) => void;
            requestRenderAll?: () => void;
          };
        }
      ).__plannerFabricView;
      if (!w?.getObjects || !w.fire) return;
      const target = w.getObjects().find((o) => {
        const type =
          (typeof o.get === "function" ? o.get("plannerEntityType") : null) ??
          o.plannerEntityType;
        const mode =
          (typeof o.get === "function" ? o.get("planPaintMode") : null) ??
          o.planPaintMode;
        return type === "furniture" && mode === "svg";
      });
      if (!target) return;
      if (typeof target.set === "function") {
        target.set("angle", degrees);
      } else {
        target.angle = degrees;
      }
      target.setCoords?.();
      w.fire("object:modified", { target });
      w.requestRenderAll?.();
    }, TARGET_ROTATION);

    await expect
      .poll(async () => (await readSvgFurnitureFromIdb(page))?.rotation, {
        timeout: 15_000,
      })
      .toBe(TARGET_ROTATION);

    await page.screenshot({
      path: path.join(EVIDENCE_DESKTOP, "02-rotated-scaled.png"),
      fullPage: false,
    });
    await page.locator(PLANNER_PAINT_CANVAS).screenshot({
      path: path.join(EVIDENCE_DESKTOP, "03-canvas-rotated-scaled.png"),
    });

    await page.getByRole("button", { name: /Save draft|Save/i }).first().click();
    await expect
      .poll(async () => (await readSvgFurnitureFromIdb(page))?.rotation, {
        timeout: 45_000,
      })
      .toBe(TARGET_ROTATION);
    await waitForSavedLocally(page);

    const beforeReload = await readSvgFurnitureFromIdb(page);
    expect(beforeReload).not.toBeNull();
    expect(beforeReload?.previewImageUrl).toMatch(/\/svg-catalog\/.+\.svg/i);

    const svgReload = page.waitForResponse(
      (r) =>
        r.url().includes("/svg-catalog/") &&
        r.url().toLowerCase().includes(".svg") &&
        r.ok(),
      { timeout: 45_000 },
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-testid="topbar"]')).toBeVisible({ timeout: 25_000 });
    await waitForPlannerCanvas(page);
    await svgReload.catch(() => null);

    await expect
      .poll(async () => getFurnitureCount(page), { timeout: 25_000 })
      .toBeGreaterThan(0);

    await expect
      .poll(async () => readSvgFurnitureFromIdb(page), { timeout: 25_000 })
      .toMatchObject({
        id: beforeReload?.id,
        rotation: TARGET_ROTATION,
        width: TARGET_WIDTH_MM,
        previewImageUrl: beforeReload?.previewImageUrl,
      });

    // SVG bitmap may repaint async after reload (svgPlanSymbolCache); document URL is SoT.
    await expect
      .poll(async () => countSvgPaintedFurniture(page), { timeout: 60_000 })
      .toBeGreaterThan(0);

    await page.screenshot({
      path: path.join(EVIDENCE_DESKTOP, "04-after-reload.png"),
      fullPage: false,
    });
    await page.locator(PLANNER_PRIMARY_CANVAS).screenshot({
      path: path.join(EVIDENCE_DESKTOP, "05-canvas-after-reload.png"),
    });

    fs.writeFileSync(
      path.join(EVIDENCE_DESKTOP, "run.json"),
      `${JSON.stringify(
        {
          phase: "P01",
          gate: "svg-symbol-persist",
          status: "pass",
          targetRotation: TARGET_ROTATION,
          targetWidthMm: TARGET_WIDTH_MM,
          furnitureId: beforeReload?.id,
          previewImageUrl: beforeReload?.previewImageUrl,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
  });
});

test.describe("P01 SVG symbol persist (375×812)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("chaise SVG paints on mobile viewport", async ({ page }) => {
    fs.mkdirSync(EVIDENCE_MOBILE, { recursive: true });

    await page.goto("/ooplanner/?plannerDevTools=1", {
      waitUntil: "domcontentloaded",
    });
    await clearPlannerStorageInPage(page);

    await enterGuestPlannerWorkspace(page, {
      projectName: "P01 mobile SVG",
      navigate: false,
      preservePlannerState: true,
    });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });
    await placeChaiseSvg(page);

    await expect(page.locator(PLANNER_PRIMARY_CANVAS)).toBeVisible();
    await expect
      .poll(async () => countSvgPaintedFurniture(page), { timeout: 15_000 })
      .toBeGreaterThan(0);

    await page.screenshot({
      path: path.join(EVIDENCE_MOBILE, "01-mobile-chaise-placed.png"),
      fullPage: false,
    });
    await page.locator(PLANNER_PAINT_CANVAS).screenshot({
      path: path.join(EVIDENCE_MOBILE, "02-mobile-canvas.png"),
    });
  });
});
