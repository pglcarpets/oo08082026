/**
 * Real browser proof for planner phone chrome (UI-MOB baseline).
 *
 * Viewport: 390×844 (phone). Thresholds are strict product bars — do not lower
 * them to force green without a product fix (W1/W2 chrome workers).
 *
 * Evidence: results/planner/phone-chrome/ (overwrite each run).
 *
 * Fail contract:
 *   - top chrome height > MAX_TOP_CHROME_PX (160)
 *   - canvas height < MIN_CANVAS_VIEWPORT_RATIO (60%) of viewport height
 *   - any sampled primary control under 44px (UI-MOB-03 hard gate)
 *
 * Also records undersized primary control count (< 44px on either axis).
 */
import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  PLANNER_FABRIC_STAGE,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

/** Phone chrome reference (archived benchmark: .archive/docs/architecture/06-UI-BENCHMARK.md) */
const PHONE = { width: 390, height: 844 } as const;
/** Desktop companion for hierarchy comparison (not the fail gate). */
const DESKTOP = { width: 1440, height: 900 } as const;

/**
 * Strict but achievable after compact phone TopBar lands.
 * Historical baseline wrapped header was ~289px — this bar rejects that.
 */
const MAX_TOP_CHROME_PX = 160;
/** UI-MOB-02 raised standard — phone canvas ≥ 60% viewport height. */
const MIN_CANVAS_VIEWPORT_RATIO = 0.6;
/** WCAG / UI-MOB-03 phone floor. */
const MIN_TAP_PX = 44;

const EVIDENCE_ROOT = path.join(
  process.cwd(),
  "..",
  "results",
  "planner",
  "phone-chrome",
);

type Box = { x: number; y: number; width: number; height: number };

type ControlSample = {
  id: string;
  width: number;
  height: number;
  under44: boolean;
  visible: boolean;
};

type PhoneChromeMetrics = {
  viewport: { width: number; height: number };
  topChromeHeight: number;
  topChromeSelectors: string[];
  workflowStripHeight: number | null;
  canvasHeight: number;
  canvasSelector: string;
  canvasViewportRatio: number;
  bottomChromeHeight: number | null;
  primaryControls: ControlSample[];
  undersizedPrimaryCount: number;
  thresholds: {
    maxTopChromePx: number;
    minCanvasViewportRatio: number;
    minTapPx: number;
  };
  pass: {
    topChrome: boolean;
    canvas: boolean;
  };
  measuredAt: string;
};

test.describe.configure({ timeout: 120_000 });

async function waitForPhoneShell(page: Page): Promise<void> {
  // useIsMobile starts false; wait for matchMedia-driven mobile shell.
  await expect(page.getByTestId("planner-mobile-shell")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId("planner-topbar")).toBeVisible({
    timeout: 15_000,
  });
  await waitForPlannerCanvas(page, { timeoutMs: 60_000 });
}

async function measureBox(page: Page, selector: string): Promise<Box | null> {
  const loc = page.locator(selector).first();
  if (!(await loc.isVisible().catch(() => false))) return null;
  const box = await loc.boundingBox();
  if (!box) return null;
  return {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
  };
}

/**
 * Top chrome gate uses TopBar only (`data-mobile-chrome="top"`).
 * Workflow strip above the canvas is recorded separately for evidence —
 * it is not folded into the 160px TopBar threshold.
 */
async function measureTopChrome(page: Page): Promise<{
  height: number;
  selectors: string[];
  workflowHeight: number | null;
}> {
  const topbar = await measureBox(page, '[data-testid="planner-topbar"]');
  if (!topbar) {
    throw new Error("planner-topbar not measurable");
  }

  const workflowHeight = await page.evaluate(() => {
    const shell = document.querySelector('[data-testid="planner-mobile-shell"]');
    const canvas = document.querySelector('[data-testid="planner-mobile-canvas"]');
    if (!shell || !canvas) return null;
    const canvasTop = canvas.getBoundingClientRect().top;
    let h = 0;
    for (const child of Array.from(shell.children)) {
      if (child === canvas) continue;
      if (child.getAttribute("data-testid") === "planner-mobile-bottom-chrome") continue;
      if (child.getAttribute("data-mobile-chrome") === "bottom") continue;
      const r = child.getBoundingClientRect();
      if (r.height < 1) continue;
      if (r.bottom <= canvasTop + 4) {
        h += r.height;
      }
    }
    return h > 0 ? h : null;
  });

  return {
    height: topbar.height,
    selectors: ['[data-testid="planner-topbar"]'],
    workflowHeight,
  };
}

async function measureCanvas(page: Page): Promise<{
  height: number;
  selector: string;
}> {
  const mobile = await measureBox(page, '[data-testid="planner-mobile-canvas"]');
  if (mobile && mobile.height > 0) {
    return { height: mobile.height, selector: '[data-testid="planner-mobile-canvas"]' };
  }
  const fabric = await measureBox(page, PLANNER_FABRIC_STAGE);
  if (fabric && fabric.height > 0) {
    return { height: fabric.height, selector: PLANNER_FABRIC_STAGE };
  }
  throw new Error("Canvas stage not measurable");
}

/** Primary phone controls — sample set, not every glyph in the DOM. */
const PRIMARY_CONTROL_SELECTORS: Array<{ id: string; selector: string }> = [
  { id: "save", selector: '[data-testid="planner-save-button"]' },
  { id: "toggle-inventory", selector: '[data-testid="planner-toggle-inventory"]' },
  { id: "toggle-properties", selector: '[data-testid="planner-toggle-properties"]' },
  { id: "toggle-layers", selector: '[data-testid="planner-toggle-layers"]' },
  { id: "more-actions", selector: '[data-testid="planner-more-actions"]' },
  {
    id: "view-2d",
    selector: '[data-testid="planner-view-mode"] [role="radio"]:has-text("2D")',
  },
  {
    id: "tool-select",
    selector: '[data-testid="planner-mobile-bottom-chrome"] [data-testid="canvas-tool-select"]',
  },
  {
    id: "tool-wall",
    selector: '[data-testid="planner-mobile-bottom-chrome"] [data-testid="canvas-tool-wall"]',
  },
  {
    id: "tool-furniture",
    selector: '[data-testid="planner-mobile-bottom-chrome"] [data-testid="canvas-tool-furniture"]',
  },
  {
    id: "more-actions",
    selector: '[data-testid="planner-more-actions"]',
  },
];

async function samplePrimaryControls(page: Page): Promise<ControlSample[]> {
  const samples: ControlSample[] = [];
  for (const { id, selector } of PRIMARY_CONTROL_SELECTORS) {
    const loc = page.locator(selector).first();
    const visible = await loc.isVisible().catch(() => false);
    if (!visible) {
      samples.push({
        id,
        width: 0,
        height: 0,
        under44: false,
        visible: false,
      });
      continue;
    }
    const box = await loc.boundingBox();
    if (!box) {
      samples.push({
        id,
        width: 0,
        height: 0,
        under44: false,
        visible: true,
      });
      continue;
    }
    const under44 = box.width < MIN_TAP_PX || box.height < MIN_TAP_PX;
    samples.push({
      id,
      width: Math.round(box.width * 10) / 10,
      height: Math.round(box.height * 10) / 10,
      under44,
      visible: true,
    });
  }
  return samples;
}

async function collectPhoneMetrics(page: Page): Promise<PhoneChromeMetrics> {
  const viewport = page.viewportSize() ?? { width: PHONE.width, height: PHONE.height };
  const top = await measureTopChrome(page);
  const canvas = await measureCanvas(page);
  const bottom = await measureBox(page, '[data-testid="planner-mobile-bottom-chrome"]');
  const primaryControls = await samplePrimaryControls(page);
  const undersizedPrimaryCount = primaryControls.filter(
    (c) => c.visible && c.under44,
  ).length;
  const canvasViewportRatio = canvas.height / viewport.height;

  return {
    viewport: { width: viewport.width, height: viewport.height },
    topChromeHeight: Math.round(top.height * 10) / 10,
    topChromeSelectors: top.selectors,
    workflowStripHeight:
      typeof top.workflowHeight === "number"
        ? Math.round(top.workflowHeight * 10) / 10
        : null,
    canvasHeight: Math.round(canvas.height * 10) / 10,
    canvasSelector: canvas.selector,
    canvasViewportRatio: Math.round(canvasViewportRatio * 1000) / 1000,
    bottomChromeHeight: bottom ? Math.round(bottom.height * 10) / 10 : null,
    primaryControls,
    undersizedPrimaryCount,
    thresholds: {
      maxTopChromePx: MAX_TOP_CHROME_PX,
      minCanvasViewportRatio: MIN_CANVAS_VIEWPORT_RATIO,
      minTapPx: MIN_TAP_PX,
    },
    pass: {
      topChrome: top.height <= MAX_TOP_CHROME_PX,
      canvas: canvasViewportRatio >= MIN_CANVAS_VIEWPORT_RATIO,
    },
    measuredAt: new Date().toISOString(),
  };
}

function writeEvidence(name: string, data: unknown): void {
  fs.mkdirSync(EVIDENCE_ROOT, { recursive: true });
  fs.writeFileSync(
    path.join(EVIDENCE_ROOT, name),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );
}

test.describe("Planner phone chrome composition (UI-MOB browser proof)", () => {
  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCE_ROOT, { recursive: true });
  });

  test("390×844: top chrome ≤160px, canvas ≥60% viewport, taps ≥44px", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await enterGuestPlannerWorkspace(page, {
      projectName: "E2E phone chrome",
    });
    await waitForPhoneShell(page);
    await expect(page.getByTestId("planner-mobile-bottom-chrome")).toBeVisible();
    const mobileShellMetrics = await page.getByTestId("planner-mobile-shell").evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(mobileShellMetrics.scrollWidth).toBeLessThanOrEqual(mobileShellMetrics.clientWidth);

    const selectTool = page.getByTestId("canvas-tool-select");
    const wallTool = page.getByTestId("canvas-tool-wall");
    const furnitureTool = page.getByTestId("canvas-tool-furniture");
    await expect(selectTool).toHaveAttribute("aria-pressed", "false");
    await expect(wallTool).toHaveAttribute("aria-pressed", "true");
    await wallTool.click();
    await expect(wallTool).toHaveAttribute("aria-pressed", "true");
    await selectTool.click();
    await expect(selectTool).toHaveAttribute("aria-pressed", "true");
    await expect(wallTool).toHaveAttribute("aria-pressed", "false");
    await furnitureTool.click();
    await expect(furnitureTool).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("planner-workflow-bar")).toHaveAttribute("data-current", "place");

    const moreActions = page.getByTestId("planner-more-actions");
    await expect(moreActions).toHaveAttribute("aria-expanded", "false");
    await moreActions.click();
    await expect(moreActions).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("planner-more-menu")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Enable|Disable grid/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Save plan/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(moreActions).toHaveAttribute("aria-expanded", "false");

    const inventoryToggle = page.getByTestId("planner-toggle-inventory");
    await expect(inventoryToggle).toHaveAttribute("aria-pressed", "false");
    await inventoryToggle.click();
    await expect(inventoryToggle).toHaveAttribute("aria-pressed", "true");
    await inventoryToggle.click();
    await expect(inventoryToggle).toHaveAttribute("aria-pressed", "false");

    const propertiesToggle = page.getByTestId("planner-toggle-properties");
    await expect(propertiesToggle).toHaveAttribute("aria-pressed", "false");
    await propertiesToggle.click();
    await expect(propertiesToggle).toHaveAttribute("aria-pressed", "true");
    await propertiesToggle.click();
    await expect(propertiesToggle).toHaveAttribute("aria-pressed", "false");

    // Dismiss slide-over panels so canvas metrics reflect resting composition.
    for (const name of [/Toggle inventory panel/i, /Toggle properties panel/i]) {
      const toggle = page.getByRole("button", { name });
      if (!(await toggle.isVisible().catch(() => false))) continue;
      if ((await toggle.getAttribute("aria-pressed").catch(() => null)) === "true") {
        await toggle.click();
        await expect(toggle)
          .toHaveAttribute("aria-pressed", "false", { timeout: 3_000 })
          .catch(() => undefined);
      }
    }

    const metrics = await collectPhoneMetrics(page);
    writeEvidence("phone-390x844-metrics.json", metrics);
    await page.screenshot({
      path: path.join(EVIDENCE_ROOT, "phone-390x844.png"),
      fullPage: false,
    });

    // Honest product gates — FAIL is success for this proof when chrome is still fat.
    expect(
      metrics.topChromeHeight,
      `Top chrome ${metrics.topChromeHeight}px exceeds ${MAX_TOP_CHROME_PX}px ` +
        `(selectors: ${metrics.topChromeSelectors.join(", ")}). ` +
        `Product W1/W2 must compact phone TopBar — do not lower this threshold.`,
    ).toBeLessThanOrEqual(MAX_TOP_CHROME_PX);

    expect(
      metrics.canvasViewportRatio,
      `Canvas ${metrics.canvasHeight}px is ${(metrics.canvasViewportRatio * 100).toFixed(1)}% ` +
        `of viewport (${metrics.viewport.height}px); need ≥${MIN_CANVAS_VIEWPORT_RATIO * 100}%. ` +
        `Product must reclaim canvas from chrome — do not lower this threshold.`,
    ).toBeGreaterThanOrEqual(MIN_CANVAS_VIEWPORT_RATIO);

    // UI-MOB-03 hard gate — zero undersized primary controls.
    const undersizedIds = metrics.primaryControls
      .filter((c) => c.visible && c.under44)
      .map((c) => `${c.id}(${c.width}×${c.height})`);

    expect(
      metrics.undersizedPrimaryCount,
      `UI-MOB-03: ${metrics.undersizedPrimaryCount} control(s) under ${MIN_TAP_PX}px: ${undersizedIds.join(", ")}`,
    ).toBe(0);

    const tapResidual = {
      status: "PASS" as const,
      reason: "All sampled primary controls ≥ 44px",
      controls: [] as string[],
    };

    writeEvidence("phone-390x844-tap-targets.json", {
      undersizedPrimaryCount: metrics.undersizedPrimaryCount,
      primaryControls: metrics.primaryControls,
      minTapPx: MIN_TAP_PX,
      residual: tapResidual,
    });

    writeEvidence("phone-390x844-summary.json", {
      status:
        metrics.pass.topChrome && metrics.pass.canvas && metrics.undersizedPrimaryCount === 0
          ? "PASS"
          : "FAIL",
      gates: {
        topChrome: {
          valuePx: metrics.topChromeHeight,
          maxPx: MAX_TOP_CHROME_PX,
          pass: metrics.pass.topChrome,
        },
        canvas: {
          heightPx: metrics.canvasHeight,
          viewportRatio: metrics.canvasViewportRatio,
          minRatio: MIN_CANVAS_VIEWPORT_RATIO,
          pass: metrics.pass.canvas,
        },
        tapTargets: {
          undersizedCount: metrics.undersizedPrimaryCount,
          minTapPx: MIN_TAP_PX,
          pass: metrics.undersizedPrimaryCount === 0,
        },
      },
      residual: {
        workflowStripHeightPx: metrics.workflowStripHeight,
        bottomChromeHeightPx: metrics.bottomChromeHeight,
        note:
          "Hard gates: top chrome ≤160px, canvas ≥60% viewport, all sampled primary controls ≥44px.",
      },
      measuredAt: metrics.measuredAt,
    });

    test.info().annotations.push({
      type: "ui-mob-03",
      description: tapResidual.reason,
    });
  });

  test("1440×900: records desktop chrome for comparison (non-gate)", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await enterGuestPlannerWorkspace(page, {
      projectName: "E2E desktop chrome compare",
    });
    await expect(page.getByTestId("planner-topbar")).toBeVisible({ timeout: 30_000 });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

    const topbar = await measureBox(page, '[data-testid="planner-topbar"]');
    const fabric = await measureBox(page, PLANNER_FABRIC_STAGE);
    const viewport = page.viewportSize() ?? DESKTOP;
    const record = {
      viewport,
      topbarHeight: topbar?.height ?? null,
      canvasHeight: fabric?.height ?? null,
      canvasViewportRatio:
        fabric && viewport.height > 0
          ? Math.round((fabric.height / viewport.height) * 1000) / 1000
          : null,
      mobileShellPresent: await page
        .getByTestId("planner-mobile-shell")
        .isVisible()
        .catch(() => false),
      measuredAt: new Date().toISOString(),
      note: "Desktop companion only — fail gates live on 390×844 test.",
    };
    writeEvidence("desktop-1440x900-metrics.json", record);
    await page.screenshot({
      path: path.join(EVIDENCE_ROOT, "desktop-1440x900.png"),
      fullPage: false,
    });

    expect(topbar?.height ?? 0).toBeGreaterThan(0);
    expect(fabric?.height ?? 0).toBeGreaterThan(0);
  });
});
