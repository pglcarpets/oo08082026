/**
 * Coordinator 2 — mesh/symbol live verify after stroke floor.
 * Evidence: results/planner/benchmark-quality/mesh-symbol/
 *
 * 1) Place cabinet-v0 → 2D zoom screenshot (multi-prim strokes readable)
 * 2) Place workstation (4 seats) → 3D multi-part mesh screenshot
 * 3) Soft assert: zoomed cabinet outer fill is not a pure solid blob
 *    (diversity sample — not pixel-perfect snapshot / not overfit)
 */
import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  placeCatalogOnCanvas,
  placeSeatsFromConfigurator,
  switchPlannerViewMode,
  waitForPlannerCanvas,
  PLANNER_PAINT_CANVAS,
  PLANNER_PRIMARY_CANVAS,
} from "./plannerCanvasHelpers";

test.describe.configure({ mode: "serial", timeout: 180_000 });

const EVIDENCE = path.join(
  process.cwd(),
  "..",
  "results",
  "planner",
  "benchmark-quality",
  "mesh-symbol",
);

async function furnitureCount(page: Page): Promise<number> {
  const body = await page.locator("body").innerText();
  const match = body.match(/(\d+)\s+furniture/i);
  return match ? Number.parseInt(match[1], 10) : -1;
}

async function zoomPercent(page: Page): Promise<number | null> {
  const body = await page.locator("body").innerText();
  const m = body.match(/Zoom\s+(\d+)\s*%/i);
  return m ? Number.parseInt(m[1], 10) : null;
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
    // Real settle between wheel steps — avoid stacking without paint
    await page
      .locator(PLANNER_PRIMARY_CANVAS)
      .evaluate(() => undefined)
      .catch(() => undefined);
  }
  await expect(canvas).toBeVisible({ timeout: 5_000 });
}

/**
 * Soft visual probe: sample a center region of the primary 2D canvas.
 * Pure solid fill ≈ very few quantized colors + low channel stddev.
 * Multi-prim / stroke-readable symbols show more diversity.
 * Thresholds are intentionally loose (not pixel-golden).
 */
async function sampleCanvasFillDiversity(page: Page): Promise<{
  sampleCount: number;
  uniqueQuantized: number;
  channelStdDev: number;
  notPureSolid: boolean;
}> {
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
    // Center 40% box — furniture place target lives near mid after zoom-at-point
    const x0 = Math.floor(w * 0.3);
    const y0 = Math.floor(h * 0.3);
    const rw = Math.max(4, Math.floor(w * 0.4));
    const rh = Math.max(4, Math.floor(h * 0.4));
    const img = ctx.getImageData(x0, y0, rw, rh);
    const data = img.data;
    const step = 8; // every 2nd pixel in x/y (stride 8 bytes * not — use pixel stride)
    const pixelStride = 4 * 2; // every other pixel
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
      if (a < 16) continue; // skip near-transparent
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      // Quantize to 16 levels per channel — ignores anti-alias micro-noise
      const qr = r >> 4;
      const qg = g >> 4;
      const qb = b >> 4;
      quantized.add(`${qr},${qg},${qb}`);
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

  // Loose bar: pure solid navy blob ≈ 1–2 quantized buckets + stddev ~0–5.
  // Multi-prim with strokes / lighter carcass typically ≥ 4 buckets or stddev ≥ 12.
  const notPureSolid =
    stats.sampleCount > 20 &&
    (stats.uniqueQuantized >= 4 || stats.channelStdDev >= 12);

  return { ...stats, notPureSolid };
}

test.describe("Mesh/symbol live verify (stroke floor)", () => {
  test("cabinet-v0 2D multi-prim + workstation 3D multi-part", async ({ page }) => {
    fs.mkdirSync(EVIDENCE, { recursive: true });

    await enterGuestPlannerWorkspace(page, {
      projectName: "Mesh-symbol live verify",
    });
    await waitForPlannerCanvas(page);

    // Ensure 2D using the shared label-safe helper.
    await switchPlannerViewMode(page, "2d");
    await waitForPlannerCanvas(page);

    const before = await furnitureCount(page);
    expect(before).toBeGreaterThanOrEqual(0);

    // --- 1) Place cabinet-v0 ---
    const search = page.getByLabel("Search catalog elements");
    await expect(search).toBeVisible({ timeout: 15_000 });
    await search.fill("cabinet");
    await expect
      .poll(
        async () =>
          page
            .getByRole("region", { name: "Catalog browser" })
            .getByRole("button", { name: /Add Modular Cabinet to canvas/i })
            .count(),
        { timeout: 12_000 },
      )
      .toBeGreaterThan(0);

    const catalog = page.getByRole("region", { name: "Catalog browser" });
    const cabinetAdd = catalog.getByRole("button", {
      name: /Add Modular Cabinet to canvas/i,
    });
    await expect(cabinetAdd).toBeVisible({ timeout: 12_000 });
    await placeCatalogOnCanvas(page, 0.48, 0.42, /Add Modular Cabinet to canvas/i);

    await expect
      .poll(async () => furnitureCount(page), { timeout: 25_000 })
      .toBe(before + 1);

    const afterCabinet = await furnitureCount(page);
    const bodyAfterCabinet = await page.locator("body").innerText();
    const cabinetIdCue =
      /cabinet-v0/i.test(bodyAfterCabinet) ||
      /Modular Cabinet/i.test(bodyAfterCabinet) ||
      /Placed Modular Cabinet/i.test(bodyAfterCabinet);

    await page.screenshot({
      path: path.join(EVIDENCE, "01-cabinet-v0-2d-placed.png"),
      fullPage: false,
    });

    // Zoom toward place point (0.48, 0.42) — keep cabinet in frame (not 2000% off-screen)
    await zoomCanvasInAt(page, 0.48, 0.42, 6);
    let zoom = await zoomPercent(page);

    await page.screenshot({
      path: path.join(EVIDENCE, "02-cabinet-v0-2d-zoom-multiprim.png"),
      fullPage: false,
    });

    // Second step: more zoom still anchored on cabinet
    await zoomCanvasInAt(page, 0.48, 0.42, 4);
    zoom = await zoomPercent(page);

    // Canvas-only crop via element screenshot when possible
    const canvas2d = page.locator(PLANNER_PAINT_CANVAS);
    if (await canvas2d.isVisible().catch(() => false)) {
      await canvas2d.screenshot({
        path: path.join(EVIDENCE, "03-cabinet-v0-2d-canvas-zoom.png"),
      });
    }

    await page.screenshot({
      path: path.join(EVIDENCE, "02b-cabinet-v0-2d-zoom-close.png"),
      fullPage: false,
    });

    // Soft visual bar: outer fill not pure solid (loose diversity probe).
    // Capture while zoomed on cabinet; failures here are soft (see expect.soft below).
    let fillDiversity: Awaited<ReturnType<typeof sampleCanvasFillDiversity>> = {
      sampleCount: 0,
      uniqueQuantized: 0,
      channelStdDev: 0,
      notPureSolid: false,
    };
    try {
      fillDiversity = await sampleCanvasFillDiversity(page);
    } catch (err) {
      // Canvas may be webgl-backed / not readable — record and continue journey.
      fillDiversity = {
        sampleCount: 0,
        uniqueQuantized: 0,
        channelStdDev: 0,
        notPureSolid: false,
      };
      fs.writeFileSync(
        path.join(EVIDENCE, "fill-diversity-error.txt"),
        String(err),
        "utf8",
      );
    }

    // --- 2) Place workstation (batch 4 seats — proven path) ---
    // Reset zoom/view for clearer placement
    const zoomFit = page.getByRole("button", { name: /Zoom to fit/i });
    if (await zoomFit.isVisible().catch(() => false)) {
      await zoomFit.click();
      await waitForPlannerCanvas(page);
    }

    // Hard journey: furniture still present after zoom-fit (real wait, not sleep).
    await expect
      .poll(async () => furnitureCount(page), { timeout: 15_000 })
      .toBe(afterCabinet);

    const beforeWs = await furnitureCount(page);
    await placeSeatsFromConfigurator(page, 4);
    await expect
      .poll(async () => furnitureCount(page), { timeout: 25_000 })
      .toBe(beforeWs + 4);

    await page.screenshot({
      path: path.join(EVIDENCE, "04-workstation-2d-after-place.png"),
      fullPage: false,
    });

    // 3D multi-part mesh
    await switchPlannerViewMode(page, "3d");
    const radio3d = page.getByRole("radio", { name: "3D", exact: true });
    await expect(radio3d).toBeChecked({ timeout: 10_000 });
    await expect(page.getByTestId("planner-3d-canvas")).toBeVisible({
      timeout: 20_000,
    });
    const orbit = page.locator(
      '[data-testid="three-viewer-container"][data-orbit-enabled="true"]',
    );
    try {
      await expect(orbit.first()).toBeVisible({ timeout: 12_000 });
    } catch {
      await expect(page.getByTestId("planner-3d-canvas")).toBeVisible();
    }

    await page.screenshot({
      path: path.join(EVIDENCE, "05-workstation-3d-multipart.png"),
      fullPage: false,
    });

    const canvas3d = page.getByTestId("planner-3d-canvas");
    if (await canvas3d.isVisible().catch(() => false)) {
      await canvas3d.screenshot({
        path: path.join(EVIDENCE, "06-workstation-3d-canvas.png"),
      });
    }

    const furnitureFinal = await furnitureCount(page);
    const run = {
      ok: true,
      at: new Date().toISOString(),
      url: page.url(),
      furnitureBefore: before,
      furnitureAfterCabinet: afterCabinet,
      furnitureFinal,
      cabinetIdCue,
      zoomPercentAfterZoom: zoom,
      fillDiversity,
      shots: [
        "01-cabinet-v0-2d-placed.png",
        "02-cabinet-v0-2d-zoom-multiprim.png",
        "02b-cabinet-v0-2d-zoom-close.png",
        "03-cabinet-v0-2d-canvas-zoom.png",
        "04-workstation-2d-after-place.png",
        "05-workstation-3d-multipart.png",
        "06-workstation-3d-canvas.png",
      ],
      notes:
        "Live place cabinet-v0 + zoom 2D; soft fill diversity; place workstation batch; 3D multi-part mesh.",
    };

    fs.writeFileSync(
      path.join(EVIDENCE, "run.json"),
      JSON.stringify(run, null, 2),
      "utf8",
    );

    // Hard facts for gate — placement deltas
    expect(afterCabinet).toBe(before + 1);
    expect(furnitureFinal).toBe(beforeWs + 4);
    expect(cabinetIdCue).toBe(true);

    // Soft assert: fill not pure solid (continues after fail; fails test at end).
    // Loose thresholds — journey + screenshots remain primary evidence.
    expect
      .soft(
        fillDiversity.notPureSolid,
        `cabinet 2D outer fill looks pure solid (uniqueQuantized=${fillDiversity.uniqueQuantized}, stdDev=${fillDiversity.channelStdDev.toFixed(1)}, samples=${fillDiversity.sampleCount}). Multi-prim readable bar wants diversity ≥4 quantized colors or channelStdDev ≥12.`,
      )
      .toBe(true);
  });
});
