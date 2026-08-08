/**
 * Multi-resolution site + planner functional audit.
 *
 * Viewports include 1980×1080 (owner request) plus phone/tablet/desktop tiers.
 * Evidence: results/site/viewport-matrix-audit/ (JSON only — report in agent-reports/).
 *
 * Raised standards vs 2026-07-13 baseline (06-UI-BENCHMARK.md):
 *   - UI-SHELL-02: desktop canvas area ≥ 65% at widths ≥ 1280
 *   - UI-MOB-02: phone canvas height ≥ 60% viewport (was 40% gate)
 *   - UI-MOB-03: zero undersized primary controls on phone (was residual OPEN)
 *   - Every marketing route: no horizontal overflow, h1, zero console errors
 */
import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  PLANNER_FABRIC_STAGE,
  clickOnCanvas,
  expectObjectCountAtLeast,
  getObjectCount,
  selectPlannerTool,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";
import { assertMarketingStructure, prepareSiteUiCapture } from "./site-ui-helpers";

test.describe.configure({ timeout: 600_000 });

const EVIDENCE_ROOT = path.join(
  process.cwd(),
  "..",
  "results",
  "site",
  "viewport-matrix-audit",
);

/** Owner-requested ultra-wide tier plus standard matrix. */
const VIEWPORTS = [
  { id: "1980x1080", width: 1980, height: 1080, tier: "ultra" as const },
  { id: "1920x1080", width: 1920, height: 1080, tier: "desktop" as const },
  { id: "1440x900", width: 1440, height: 900, tier: "desktop" as const },
  { id: "1280x800", width: 1280, height: 800, tier: "desktop" as const },
  { id: "1024x768", width: 1024, height: 768, tier: "tablet" as const },
  { id: "768x1024", width: 768, height: 1024, tier: "tablet" as const },
  { id: "390x844", width: 390, height: 844, tier: "phone" as const },
] as const;

const MIN_DESKTOP_CANVAS_AREA_RATIO = 0.65;
const MIN_PHONE_CANVAS_HEIGHT_RATIO = 0.6;
const MAX_PHONE_TOP_CHROME_PX = 160;
const MIN_TAP_PX = 44;

const CONSOLE_IGNORE = [
  /favicon\.ico/i,
  /webpack-hmr/i,
  /hmr/i,
  /webpack-hot-update/i,
  /Download the React DevTools/i,
  /Failed to load resource.*favicon/i,
  /A tree hydrated but some attributes of the server rendered HTML didn't match/i,
  /React has detected a change in the order of Hooks/i,
  /Should have a queue/i,
  /ChunkLoadError: Failed to load chunk/i,
  /Failed to load chunk \/_next\/static\/chunks\//i,
];

const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());

type SiteRoute = {
  id: string;
  path: string;
  heading?: RegExp;
  marketing?: boolean;
  requiresDb?: boolean;
  setup?: (page: Page) => Promise<void>;
};

const SITE_ROUTES: SiteRoute[] = [
  { id: "home", path: "/", heading: /Spaces that work/i },
  { id: "products", path: "/products", heading: /Built to\s*Perform/i, marketing: true, requiresDb: true },
  { id: "planner-landing", path: "/planner", heading: /.+/ },
  { id: "about", path: "/about", marketing: true },
  { id: "contact", path: "/contact", marketing: true },
  { id: "solutions", path: "/solutions", marketing: true },
  { id: "quote-cart", path: "/quote-cart", heading: /Quote cart/i, marketing: true },
  { id: "career", path: "/career", marketing: true },
  { id: "planning", path: "/planning", heading: /Planning Service/i, marketing: true },
  { id: "showrooms", path: "/showrooms", marketing: true },
  { id: "compare", path: "/compare", heading: /Compare selected workspace options/i, marketing: true },
  {
    id: "seating-category",
    path: "/products/seating",
    marketing: true,
    requiresDb: true,
  },
  {
    id: "choose-product",
    path: "/choose-product",
    marketing: true,
  },
];

function isBenignConsoleError(text: string): boolean {
  return (
    CONSOLE_IGNORE.some((re) => re.test(text)) ||
    /Failed to load resource: the server responded with a status of 401 \(Unauthorized\)/i.test(text) ||
    (/Failed to load resource: the server responded with a status of 404 \(Not Found\)/i.test(text) &&
      /_next\/static\/chunks\//i.test(text))
  );
}

function attachMonitors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedResponses: { url: string; status: number }[] = [];

  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (isBenignConsoleError(text)) return;
    consoleErrors.push(text);
  };

  page.on("console", onConsole);
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  page.on("response", (response) => {
    const url = response.url();
    if (!url.includes("localhost") && !url.startsWith("http://127.0.0.1")) return;
    const status = response.status();
    if (status >= 400 && !url.includes("/api/customer-queries")) {
      failedResponses.push({ url, status });
    }
  });

  return {
    consoleErrors,
    pageErrors,
    failedResponses,
    detach: () => page.off("console", onConsole),
  };
}

async function assertNoPageOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function measurePlannerMetrics(page: Page, viewport: (typeof VIEWPORTS)[number]) {
  const topbar = page.locator('[data-testid="planner-topbar"]').first();
  const mobileCanvas = page.locator('[data-testid="planner-mobile-canvas"]').first();
  const fabric = page.locator(PLANNER_FABRIC_STAGE).first();

  const topBox = await topbar.boundingBox();
  const mobileBox =
    (await mobileCanvas.isVisible().catch(() => false))
      ? await mobileCanvas.boundingBox()
      : null;
  const fabricBox =
    mobileBox ?? ((await fabric.isVisible().catch(() => false)) ? await fabric.boundingBox() : null);

  const canvasArea = fabricBox ? fabricBox.width * fabricBox.height : 0;
  const viewportArea = viewport.width * viewport.height;
  const canvasAreaRatio = viewportArea > 0 ? canvasArea / viewportArea : 0;
  const canvasHeightRatio =
    fabricBox && viewport.height > 0 ? fabricBox.height / viewport.height : 0;

  const view2d = page.getByTestId("planner-view-mode").getByRole("radio", { name: "2D" });
  let view2dSize: { width: number; height: number } | null = null;
  if (await view2d.isVisible().catch(() => false)) {
    const box = await view2d.boundingBox();
    if (box) view2dSize = { width: box.width, height: box.height };
  }

  return {
    topChromePx: topBox?.height ?? 0,
    canvasHeightPx: fabricBox?.height ?? 0,
    canvasAreaRatio: Math.round(canvasAreaRatio * 1000) / 1000,
    canvasHeightRatio: Math.round(canvasHeightRatio * 1000) / 1000,
    view2dSize,
    mobileShell: await page.getByTestId("planner-mobile-shell").isVisible().catch(() => false),
  };
}

type AuditRow = {
  viewport: string;
  route: string;
  kind: "site" | "planner-functional";
  ok: boolean;
  issues: string[];
  metrics?: Record<string, unknown>;
};

const reportRows: AuditRow[] = [];

function recordRow(row: AuditRow): void {
  reportRows.push(row);
}

test.describe("Viewport matrix — marketing routes", () => {
  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCE_ROOT, { recursive: true });
  });

  for (const viewport of VIEWPORTS) {
    for (const route of SITE_ROUTES) {
      if (route.requiresDb && !hasSupabaseEnv) continue;

      test(`${viewport.id} — ${route.id}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const monitors = attachMonitors(page);
        const issues: string[] = [];

        try {
          await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 90_000 });
          if (route.marketing) {
            await prepareSiteUiCapture(page);
            await assertMarketingStructure(page);
          }
          await page.getByRole("heading", { level: 1 }).first().waitFor({ state: "visible", timeout: 30_000 });
          if (route.heading) {
            await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(route.heading);
          }
          await assertNoPageOverflow(page);
          if (route.setup) await route.setup(page);

          expect(monitors.pageErrors, `${route.id} page errors`).toEqual([]);
          expect(monitors.consoleErrors, `${route.id} console errors`).toEqual([]);
          expect(monitors.failedResponses, `${route.id} failed requests`).toEqual([]);

          const shotDir = path.join(EVIDENCE_ROOT, viewport.id, "site");
          fs.mkdirSync(shotDir, { recursive: true });
          await page.screenshot({
            path: path.join(shotDir, `${route.id}.png`),
            fullPage: false,
          });

          recordRow({
            viewport: viewport.id,
            route: route.id,
            kind: "site",
            ok: true,
            issues: [],
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          issues.push(message);
          recordRow({
            viewport: viewport.id,
            route: route.id,
            kind: "site",
            ok: false,
            issues,
          });
          throw error;
        } finally {
          monitors.detach();
        }
      });
    }
  }
});

test.describe("Viewport matrix — planner functional journey", () => {
  const plannerViewports = VIEWPORTS.filter(
    (v) => v.tier === "ultra" || v.tier === "desktop" || v.tier === "phone",
  );

  for (const viewport of plannerViewports) {
    test(`${viewport.id} — guest place furniture + raised shell gates`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const monitors = attachMonitors(page);
      const issues: string[] = [];

      try {
        await enterGuestPlannerWorkspace(page, { projectName: `Viewport audit ${viewport.id}` });
        await waitForPlannerCanvas(page, { timeoutMs: 60_000 });

        if (viewport.tier === "phone") {
          await expect(page.getByTestId("planner-mobile-shell")).toBeVisible({ timeout: 30_000 });
        } else {
          await expect(page.getByTestId("planner-topbar")).toBeVisible();
        }

        const before = await getObjectCount(page);
        await selectPlannerTool(page, "Furniture");
        await page
          .getByRole("region", { name: "Catalog browser" })
          .getByRole("button", { name: /Add .* to canvas/i })
          .first()
          .click();
        await clickOnCanvas(page, 0.45, 0.42);
        await expectObjectCountAtLeast(page, before + 1);

        const metrics = await measurePlannerMetrics(page, viewport);

        if (viewport.tier === "phone") {
          if (metrics.topChromePx > MAX_PHONE_TOP_CHROME_PX) {
            issues.push(
              `Top chrome ${metrics.topChromePx}px > ${MAX_PHONE_TOP_CHROME_PX}px (UI-MOB-01)`,
            );
          }
          if (metrics.canvasHeightRatio < MIN_PHONE_CANVAS_HEIGHT_RATIO) {
            issues.push(
              `Canvas height ratio ${metrics.canvasHeightRatio} < ${MIN_PHONE_CANVAS_HEIGHT_RATIO} (UI-MOB-02)`,
            );
          }
          if (
            metrics.view2dSize &&
            (metrics.view2dSize.width < MIN_TAP_PX || metrics.view2dSize.height < MIN_TAP_PX)
          ) {
            issues.push(
              `2D view control ${metrics.view2dSize.width}×${metrics.view2dSize.height} < ${MIN_TAP_PX}px (UI-MOB-03)`,
            );
          }
        }

        if (viewport.width >= 1280 && !metrics.mobileShell) {
          if (metrics.canvasAreaRatio < MIN_DESKTOP_CANVAS_AREA_RATIO) {
            issues.push(
              `Canvas area ratio ${metrics.canvasAreaRatio} < ${MIN_DESKTOP_CANVAS_AREA_RATIO} (UI-SHELL-02)`,
            );
          }
        }

        expect(issues, `Planner shell gates @ ${viewport.id}`).toEqual([]);

        expect(monitors.pageErrors).toEqual([]);
        expect(monitors.consoleErrors).toEqual([]);
        expect(monitors.failedResponses).toEqual([]);

        const shotDir = path.join(EVIDENCE_ROOT, viewport.id, "planner");
        fs.mkdirSync(shotDir, { recursive: true });
        await page.screenshot({ path: path.join(shotDir, "functional-place.png"), fullPage: false });

        recordRow({
          viewport: viewport.id,
          route: "planner-guest-place",
          kind: "planner-functional",
          ok: true,
          issues: [],
          metrics,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        issues.push(message);
        recordRow({
          viewport: viewport.id,
          route: "planner-guest-place",
          kind: "planner-functional",
          ok: false,
          issues,
        });
        throw error;
      } finally {
        monitors.detach();
      }
    });
  }

  test.afterAll(() => {
    const summary = {
      viewports: VIEWPORTS.map((v) => v.id),
      siteRoutes: SITE_ROUTES.map((r) => r.id),
      standards: {
        UI_SHELL_02_minCanvasAreaRatio: MIN_DESKTOP_CANVAS_AREA_RATIO,
        UI_MOB_02_minCanvasHeightRatio: MIN_PHONE_CANVAS_HEIGHT_RATIO,
        UI_MOB_01_maxTopChromePx: MAX_PHONE_TOP_CHROME_PX,
        UI_MOB_03_minTapPx: MIN_TAP_PX,
      },
      totalChecks: reportRows.length,
      failures: reportRows.filter((r) => !r.ok).length,
      completedAt: new Date().toISOString(),
      results: reportRows,
    };
    fs.writeFileSync(
      path.join(EVIDENCE_ROOT, "audit-summary.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
      "utf8",
    );
  });
});
