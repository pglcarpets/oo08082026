/**
 * Verifies fitToView centers floor content in the Fabric stage viewport.
 * Evidence: results/planner/canvas-center/
 */
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  PLANNER_FABRIC_STAGE,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

const EVIDENCE_ROOT = path.join(
  process.cwd(),
  "..",
  "results",
  "planner",
  "canvas-center",
);

/** Max distance (px) between content center and stage center after fit. */
const CENTER_TOLERANCE_PX = 40;

type FabricObjectHandle = {
  get?: (key: string) => unknown;
  plannerEntityType?: unknown;
  left?: number;
  top?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
  getCenterPoint?: () => { x: number; y: number };
  getBoundingRect?: () => { left: number; top: number; width: number; height: number };
};

type CanvasCenterMetrics = {
  measuredAt: string;
  viewport: { width: number; height: number };
  stage: {
    clientWidth: number;
    clientHeight: number;
    bbox: { x: number; y: number; width: number; height: number };
  };
  content: {
    objectCount: number;
    bounds: { minX: number; minY: number; maxX: number; maxY: number } | null;
    center: { x: number; y: number } | null;
  };
  stageCenter: { x: number; y: number };
  delta: { x: number; y: number; distance: number } | null;
  tolerancePx: number;
  pass: boolean;
};

test.describe.configure({ timeout: 120_000 });

test("fitToView centers plan content in stage viewport", async ({ page }) => {
  fs.mkdirSync(EVIDENCE_ROOT, { recursive: true });

  await page.setViewportSize({ width: 1280, height: 800 });
  await enterGuestPlannerWorkspace(page, { projectName: "Canvas center fit" });
  await waitForPlannerCanvas(page);

  const coach = page.getByRole("dialog", { name: /Welcome to Workspace Planner|Onboarding/i });
  if (await coach.isVisible().catch(() => false)) {
    const skip = page.getByRole("button", { name: /Skip|Close|Dismiss/i });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await expect(coach).toBeHidden({ timeout: 5_000 }).catch(() => undefined);
  }

  const zoomFit = page.getByRole("button", { name: "Zoom to fit" });
  if (await zoomFit.isVisible().catch(() => false)) {
    await zoomFit.click();
    await page.waitForTimeout(300);
  }

  const metrics = await page.evaluate((stageSel) => {
    const stage = document.querySelector(stageSel) as HTMLElement | null;
    const fabric = (
      window as unknown as {
        __plannerFabricView?: {
          getObjects?: () => FabricObjectHandle[];
        };
      }
    ).__plannerFabricView;

    if (!stage) {
      return {
        error: "stage missing",
      } as const;
    }

    const readEntityType = (obj: FabricObjectHandle): string | null => {
      if (typeof obj.get === "function") {
        const viaGet = obj.get("plannerEntityType");
        if (typeof viaGet === "string") return viaGet;
      }
      return typeof obj.plannerEntityType === "string" ? obj.plannerEntityType : null;
    };

    const bbox = stage.getBoundingClientRect();
    const stageCenter = {
      x: stage.clientWidth / 2,
      y: stage.clientHeight / 2,
    };

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let objectCount = 0;

    const objs = fabric?.getObjects?.() ?? [];
    for (const obj of objs) {
      const type = readEntityType(obj);
      if (
        type !== "wall" &&
        type !== "furniture" &&
        type !== "door" &&
        type !== "window"
      ) {
        continue;
      }
      objectCount += 1;

      if (type === "wall" && typeof obj.x1 === "number" && typeof obj.x2 === "number") {
        minX = Math.min(minX, obj.x1, obj.x2);
        minY = Math.min(minY, obj.y1 ?? 0, obj.y2 ?? 0);
        maxX = Math.max(maxX, obj.x1, obj.x2);
        maxY = Math.max(maxY, obj.y1 ?? 0, obj.y2 ?? 0);
        continue;
      }

      const rect =
        typeof obj.getBoundingRect === "function"
          ? obj.getBoundingRect()
          : null;
      if (rect) {
        minX = Math.min(minX, rect.left);
        minY = Math.min(minY, rect.top);
        maxX = Math.max(maxX, rect.left + rect.width);
        maxY = Math.max(maxY, rect.top + rect.height);
        continue;
      }

      const center =
        typeof obj.getCenterPoint === "function"
          ? obj.getCenterPoint()
          : { x: obj.left ?? 0, y: obj.top ?? 0 };
      minX = Math.min(minX, center.x);
      minY = Math.min(minY, center.y);
      maxX = Math.max(maxX, center.x);
      maxY = Math.max(maxY, center.y);
    }

    const hasBounds =
      Number.isFinite(minX) &&
      Number.isFinite(minY) &&
      Number.isFinite(maxX) &&
      Number.isFinite(maxY);
    const contentCenter = hasBounds
      ? { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
      : null;

    const delta = contentCenter
      ? {
          x: contentCenter.x - stageCenter.x,
          y: contentCenter.y - stageCenter.y,
          distance: Math.hypot(
            contentCenter.x - stageCenter.x,
            contentCenter.y - stageCenter.y,
          ),
        }
      : null;

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      stage: {
        clientWidth: stage.clientWidth,
        clientHeight: stage.clientHeight,
        bbox: { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height },
      },
      content: {
        objectCount,
        bounds: hasBounds ? { minX, minY, maxX, maxY } : null,
        center: contentCenter,
      },
      stageCenter,
      delta,
    };
  }, PLANNER_FABRIC_STAGE);

  if ("error" in metrics) {
    throw new Error(`Canvas center measurement failed: ${metrics.error}`);
  }

  const report: CanvasCenterMetrics = {
    measuredAt: new Date().toISOString(),
    viewport: metrics.viewport,
    stage: metrics.stage,
    content: metrics.content,
    stageCenter: metrics.stageCenter,
    delta: metrics.delta,
    tolerancePx: CENTER_TOLERANCE_PX,
    pass:
      metrics.delta !== null &&
      metrics.delta.distance <= CENTER_TOLERANCE_PX,
  };

  fs.writeFileSync(
    path.join(EVIDENCE_ROOT, "canvas-center-metrics.json"),
    JSON.stringify(report, null, 2),
  );

  await page.locator(PLANNER_FABRIC_STAGE).screenshot({
    path: path.join(EVIDENCE_ROOT, "canvas-center.png"),
  });

  expect(
    metrics.content.objectCount,
    "expected walls or furniture on template guest floor",
  ).toBeGreaterThan(0);
  expect(metrics.delta, "content bounds center should be measurable").not.toBeNull();
  expect(
    metrics.delta!.distance,
    `content center should be within ${CENTER_TOLERANCE_PX}px of stage center (delta=${metrics.delta!.distance.toFixed(1)}px)`,
  ).toBeLessThanOrEqual(CENTER_TOLERANCE_PX);
});
