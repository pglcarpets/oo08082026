/**
 * P05 Seat B — browser eyes: modular cabinet multiprim + S7 chaise multipath.
 * Evidence: results/planner/world-standard-wave/05-symbols-svg/browser/
 *
 * Hard bar: PNG must show front line / handle / inner structure — not empty cream tile.
 * Overall PASS only when both eyes agree (cabinet multiprim + S7 chaise).
 */
import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  placeCatalogOnCanvas,
  PLANNER_PAINT_CANVAS,
  PLANNER_PRIMARY_CANVAS,
  switchPlannerViewMode,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ mode: "serial", timeout: 180_000 });

const EVIDENCE = path.join(
  process.cwd(),
  "..",
  "results",
  "planner",
  "world-standard-wave",
  "05-symbols-svg",
  "browser",
);

async function furnitureCount(page: Page): Promise<number> {
  const body = await page.locator("body").innerText();
  const match = body.match(/(\d+)\s+furniture/i);
  return match ? Number.parseInt(match[1], 10) : -1;
}

/** Zoom toward a canvas-relative point so furniture stays in frame. */
async function zoomCanvasInAt(
  page: Page,
  relX: number,
  relY: number,
  steps = 8,
): Promise<void> {
  const canvas = page.locator(PLANNER_PRIMARY_CANVAS);
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas box missing");
  const cx = box.x + box.width * relX;
  const cy = box.y + box.height * relY;
  await page.mouse.move(cx, cy);
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, -120);
    await page
      .locator(PLANNER_PRIMARY_CANVAS)
      .evaluate(() => undefined)
      .catch(() => undefined);
  }
  await expect(canvas).toBeVisible({ timeout: 5_000 });
}

/**
 * Soft probe: multi-prim cabinet / multipath SVG → more color diversity than solid cream blob.
 */
async function sampleCanvasFillDiversity(page: Page): Promise<{
  sampleCount: number;
  uniqueQuantized: number;
  channelStdDev: number;
  notPureSolid: boolean;
}> {
  // Paint lives on lower-canvas; upper is the event layer (often empty getImageData).
  const canvas = page.locator(PLANNER_PAINT_CANVAS);
  await expect(canvas).toBeVisible({ timeout: 10_000 });

  const stats = await canvas.evaluate((el) => {
    const c = el as HTMLCanvasElement;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return { sampleCount: 0, uniqueQuantized: 0, channelStdDev: 0 };
    }
    const w = c.width;
    const h = c.height;
    if (w < 8 || h < 8) {
      return { sampleCount: 0, uniqueQuantized: 0, channelStdDev: 0 };
    }
    const x0 = Math.floor(w * 0.25);
    const y0 = Math.floor(h * 0.25);
    const rw = Math.max(4, Math.floor(w * 0.5));
    const rh = Math.max(4, Math.floor(h * 0.5));
    const img = ctx.getImageData(x0, y0, rw, rh);
    const data = img.data;
    const pixelStride = 4 * 2;
    const step = 8;
    const quantized = new Set<string>();
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let n = 0;
    const rs: number[] = [];
    const gs: number[] = [];
    const bs: number[] = [];

    for (let i = 0; i + 3 < data.length; i += pixelStride * step) {
      const a = data[i + 3] ?? 0;
      if (a < 16) continue;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      quantized.add(`${r >> 4},${g >> 4},${b >> 4}`);
      sumR += r;
      sumG += g;
      sumB += b;
      rs.push(r);
      gs.push(g);
      bs.push(b);
      n += 1;
    }

    if (n === 0) {
      return { sampleCount: 0, uniqueQuantized: 0, channelStdDev: 0 };
    }

    const meanR = sumR / n;
    const meanG = sumG / n;
    const meanB = sumB / n;
    let varSum = 0;
    for (let i = 0; i < n; i++) {
      const dr = (rs[i] ?? 0) - meanR;
      const dg = (gs[i] ?? 0) - meanG;
      const db = (bs[i] ?? 0) - meanB;
      varSum += dr * dr + dg * dg + db * db;
    }
    const channelStdDev = Math.sqrt(varSum / (n * 3));
    return {
      sampleCount: n,
      uniqueQuantized: quantized.size,
      channelStdDev,
    };
  });

  const notPureSolid =
    stats.sampleCount > 20 &&
    (stats.uniqueQuantized >= 4 || stats.channelStdDev >= 12);

  return { ...stats, notPureSolid };
}

test.describe("P05 scratch: cabinet multiprim + S7 chaise eyes", () => {
  test("place Modular Cabinet only → zoom → multiprim canvas shot; then chaise S7", async ({
    page,
  }) => {
    fs.mkdirSync(EVIDENCE, { recursive: true });

    await enterGuestPlannerWorkspace(page, {
      projectName: "P05 scratch multiprim",
    });
    await waitForPlannerCanvas(page);
    await switchPlannerViewMode(page, "2d");
    await waitForPlannerCanvas(page);

    const before = await furnitureCount(page);
    expect(before).toBeGreaterThanOrEqual(0);

    // --- Cabinet only (Block2D multiprim) ---
    const search = page.getByLabel("Search catalog elements");
    await expect(search).toBeVisible({ timeout: 15_000 });
    await search.fill("cabinet");
    const catalog = page.getByRole("region", { name: "Catalog browser" });
    await expect
      .poll(
        async () =>
          catalog.getByRole("button", { name: /Add Modular Cabinet to canvas/i }).count(),
        { timeout: 12_000 },
      )
      .toBeGreaterThan(0);

    const placeRx = 0.48;
    const placeRy = 0.42;
    await placeCatalogOnCanvas(page, placeRx, placeRy, /Add Modular Cabinet to canvas/i);
    await expect
      .poll(async () => furnitureCount(page), { timeout: 25_000 })
      .toBe(before + 1);

    // Zoom in so multiprim detail is eye-readable on PNG
    await zoomCanvasInAt(page, placeRx, placeRy, 8);
    await page.waitForTimeout(300);
    await zoomCanvasInAt(page, placeRx, placeRy, 4);
    await page.waitForTimeout(400);

    const canvas = page.locator(PLANNER_PAINT_CANVAS);
    await expect(canvas).toBeVisible({ timeout: 10_000 });
    await canvas.screenshot({
      path: path.join(EVIDENCE, "p05-scratch-cabinet-canvas.png"),
    });

    const cabinetDiversity = await sampleCanvasFillDiversity(page);
    // Soft gate only — eyes on PNG are the hard bar for multiprim.
    expect(cabinetDiversity.sampleCount).toBeGreaterThan(20);

    // --- Chaise S7 multipath (separate place; zoom fit first for clear frame) ---
    const zoomFit = page.getByRole("button", { name: /Zoom to fit/i });
    if (await zoomFit.isVisible().catch(() => false)) {
      await zoomFit.click();
      await page.waitForTimeout(300);
    }

    await search.fill("chaise");
    await expect
      .poll(
        async () => {
          const imgs = catalog.locator('img[src*="/svg-catalog/"]');
          return imgs.count();
        },
        { timeout: 20_000 },
      )
      .toBeGreaterThan(0);

    const mid = await furnitureCount(page);
    const svgPaintResponse = page.waitForResponse(
      (r) =>
        r.url().includes("/svg-catalog/") &&
        r.url().toLowerCase().includes(".svg") &&
        r.ok(),
      { timeout: 20_000 },
    );

    const chaiseAdd = catalog.getByRole("button", {
      name: /Add .*[Cc]haise.* to canvas|Add Chaise Lounge to canvas/i,
    });
    if ((await chaiseAdd.count()) > 0) {
      await placeCatalogOnCanvas(page, 0.58, 0.52, /Add .*[Cc]haise|Add Chaise Lounge/i);
    } else {
      await placeCatalogOnCanvas(page, 0.58, 0.52, /Add .* to canvas/i);
    }

    await expect
      .poll(async () => furnitureCount(page), { timeout: 25_000 })
      .toBeGreaterThan(mid);

    await Promise.race([
      svgPaintResponse.catch(() => null),
      page.waitForTimeout(1500),
    ]);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    await page.waitForTimeout(400);

    // Zoom toward chaise placement for eye-readable multipath
    await zoomCanvasInAt(page, 0.58, 0.52, 6);
    await page.waitForTimeout(300);

    await canvas.screenshot({
      path: path.join(EVIDENCE, "p05-scratch-s7-chaise.png"),
    });

    const chaiseDiversity = await sampleCanvasFillDiversity(page);
    expect(chaiseDiversity.sampleCount).toBeGreaterThan(20);
    expect(chaiseDiversity.notPureSolid).toBe(true);

    fs.writeFileSync(
      path.join(EVIDENCE, "p05-scratch-run.json"),
      `${JSON.stringify(
        {
          phase: "P05",
          gate: "scratch-cabinet-multiprim-s7-chaise",
          entry: "/ooplanner/",
          date: new Date().toISOString(),
          furnitureBefore: before,
          furnitureAfter: await furnitureCount(page),
          cabinetDiversity,
          chaiseDiversity,
          evidence: [
            "p05-scratch-cabinet-canvas.png",
            "p05-scratch-s7-chaise.png",
          ],
          note: "Eyes on PNG are hard bar; diversity is soft only. See P05-SCRATCH-STATUS.md",
        },
        null,
        2,
      )}\n`,
    );
  });
});
