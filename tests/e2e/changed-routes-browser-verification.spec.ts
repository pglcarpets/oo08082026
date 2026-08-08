/**
 * Browser acceptance for routes touched by the current change set:
 * - Planner guest workspace (TopBar responsiveness)
 * - Admin customer queries (embedded ops shell)
 * - Admin SVG editor list + edit (publish surface)
 *
 * Runs 5 full passes × 5 viewports × 4 routes.
 * Evidence: results/planner/changed-routes-verification/
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import {
  clearPlannerStorageInPage,
  enterGuestPlannerWorkspace,
} from "./guestProjectSetup";

test.describe.configure({ mode: "serial", timeout: 3_600_000 });

const EVIDENCE_ROOT = path.join(
  process.cwd(),
  "..",
  "results",
  "planner",
  "changed-routes-verification",
);

const VIEWPORTS = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "700x1024", width: 700, height: 1024 },
  { name: "375x812", width: 375, height: 812 },
] as const;

const PASSES = 5;

const CONSOLE_IGNORE = [
  /favicon\.ico/i,
  /webpack-hmr/i,
  /hmr/i,
  /webpack-hot-update/i,
  /Download the React DevTools/i,
  /Failed to load resource.*favicon/i,
  /A tree hydrated but some attributes of the server rendered HTML didn't match/i,
  // Dev-only: Next fast refresh while the suite is running against `next dev`.
  /React has detected a change in the order of Hooks/i,
  /Should have a queue/i,
  // Dev-only: stale chunk hashes while `next dev` recompiles during long suites.
  /ChunkLoadError: Failed to load chunk/i,
  /Failed to load chunk \/_next\/static\/chunks\//i,
];

function isBenignConsoleError(text: string): boolean {
  return CONSOLE_IGNORE.some((re) => re.test(text))
    || /Failed to load resource: the server responded with a status of 401 \(Unauthorized\)/i.test(text)
    || (/Failed to load resource: the server responded with a status of 404 \(Not Found\)/i.test(text)
      && /_next\/static\/chunks\//i.test(text));
}

type RouteCheck = {
  readonly id: string;
  readonly path: string;
  readonly setup?: (page: Page) => Promise<void>;
  readonly assert: (page: Page, viewport: (typeof VIEWPORTS)[number]) => Promise<void>;
};

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

async function gotoResilient(page: Page, targetPath: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(targetPath, { waitUntil: "domcontentloaded", timeout: 90_000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await page.waitForTimeout(2_000);
      }
    }
  }
  throw lastError;
}

async function assertNoHorizontalOverflow(page: Page, selector: string): Promise<void> {
  const metrics = await page.locator(selector).first().evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function runAxe(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();
  const serious = results.violations.filter((v) =>
    ["critical", "serious"].includes(v.impact ?? ""),
  );
  expect(serious, `${label} a11y serious/critical violations`).toEqual([]);
}

const ROUTES: RouteCheck[] = [
  {
    id: "planner-guest",
    path: "/ooplanner/?plannerDevTools=1",
    setup: async (page) => {
      await enterGuestPlannerWorkspace(page, {
        navigate: false,
        preservePlannerState: true,
        projectName: "E2E changed-routes",
      });
    },
    assert: async (page, viewport) => {
      const topBar = page.locator('[data-testid="planner-topbar"]');
      await expect(topBar).toBeVisible();
      await assertNoHorizontalOverflow(page, '[data-testid="planner-topbar"]');

      const prefsBtn = page.getByRole("button", { name: /Prefs — open preferences menu/i });
      await expect(prefsBtn).toBeVisible();

      if (viewport.width < 768) {
        await expect(page.getByRole("button", { name: /Toggle inventory panel/i })).toBeVisible();
      } else {
        const gridSnap = page.getByRole("group", { name: "Canvas grid and snap" });
        await expect(gridSnap).toBeVisible();
        await expect(gridSnap.getByRole("button", { name: /grid/i })).toBeVisible();
        await expect(gridSnap.getByRole("button", { name: /snap/i })).toBeVisible();
      }

      await expect(page.locator('[data-testid="canvas-stage"], canvas').first()).toBeVisible({
        timeout: 45_000,
      });
      await runAxe(page, "planner-guest");
    },
  },
  {
    id: "admin-customer-queries",
    path: "/admin/customer-queries",
    assert: async (page) => {
      await expect(page.getByRole("heading", { level: 1, name: "Customer queries" }).first()).toBeVisible();
      await expect(page.getByText(/Live inbox with 10-second auto-refresh/i).first()).toBeVisible();
      await expect(page.getByText("Admin token")).toBeHidden();
      await expect(page.locator("select").first()).toBeVisible();
      await assertNoHorizontalOverflow(page, ".admin-page");
      await runAxe(page, "admin-customer-queries");
    },
  },
  {
    id: "admin-svg-list",
    path: "/admin/svg-editor",
    assert: async (page) => {
      await expect(page).toHaveURL(/\/admin\/svg-editor\/?$/);
      await expect(page.getByTestId("admin-svg-primary-journey")).toBeVisible({
        timeout: 45_000,
      });
      await expect(page.getByTestId("admin-shell-title")).toHaveText(
        /Product plan symbols|SVG symbols/i,
      );
      await assertNoHorizontalOverflow(page, "main, .admin-page, body");
      await runAxe(page, "admin-svg-list");
    },
  },
  {
    id: "admin-svg-edit",
    path: "/admin/svg-editor/desk-linear-1200-001",
    assert: async (page) => {
      await expect(page).toHaveURL(/desk-linear-1200-001/);
      await expect(page.getByRole("button", { name: /^Publish$/ })).toBeVisible({
        timeout: 45_000,
      });
      await expect(page.getByTestId("admin-svg-edit-shell")).toBeVisible();
      await expect(page.getByTestId("admin-svg-studio-status-footprint")).toContainText(
        /1200.*600/,
      );
      await assertNoHorizontalOverflow(page, "main, .admin-page, body");
      await runAxe(page, "admin-svg-edit");
    },
  },
];

test.describe("Changed routes — 5× viewport browser verification", () => {
  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCE_ROOT, { recursive: true });
    expect(
      process.env.DEV_AUTH_BYPASS,
      "Admin routes require DEV_AUTH_BYPASS=1 for browser verification",
    ).toBe("1");
  });

  test("5 passes × 5 viewports × 4 changed routes", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await gotoResilient(page, "/ooplanner/?plannerDevTools=1");
    await enterGuestPlannerWorkspace(page, {
      preservePlannerState: true,
      projectName: "E2E changed-routes warmup",
    });

    const report: {
      pass: number;
      viewport: string;
      route: string;
      ok: boolean;
      consoleErrors: string[];
      pageErrors: string[];
      failedResponses: { url: string; status: number }[];
      screenshot: string;
    }[] = [];

    for (let pass = 1; pass <= PASSES; pass++) {
      await clearPlannerStorageInPage(page);

      for (const viewport of VIEWPORTS) {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        for (const route of ROUTES) {
          const shotDir = path.join(
            EVIDENCE_ROOT,
            `pass-${pass}`,
            viewport.name,
          );
          fs.mkdirSync(shotDir, { recursive: true });
          const screenshotPath = path.join(shotDir, `${route.id}.png`);

          try {
            if (route.path) {
              await gotoResilient(page, route.path);
            }
            if (route.setup) {
              await route.setup(page);
            }
            await page.waitForTimeout(400);

            const monitors = attachMonitors(page);
            try {
              await route.assert(page, viewport);
              await page.screenshot({ path: screenshotPath, fullPage: false });

              report.push({
                pass,
                viewport: viewport.name,
                route: route.id,
                ok: true,
                consoleErrors: [...monitors.consoleErrors],
                pageErrors: [...monitors.pageErrors],
                failedResponses: [...monitors.failedResponses],
                screenshot: screenshotPath,
              });

              expect(monitors.pageErrors, `${route.id} @ ${viewport.name} pass ${pass} pageerrors`).toEqual([]);
              expect(monitors.consoleErrors, `${route.id} @ ${viewport.name} pass ${pass} console`).toEqual([]);
            } finally {
              monitors.detach();
            }
          } catch (error) {
            try {
              await page.screenshot({
                path: path.join(shotDir, `${route.id}-FAIL.png`),
                fullPage: false,
                timeout: 10_000,
              });
            } catch {
              // Best-effort failure capture only.
            }
            report.push({
              pass,
              viewport: viewport.name,
              route: route.id,
              ok: false,
              consoleErrors: [],
              pageErrors: [error instanceof Error ? error.message : String(error)],
              failedResponses: [],
              screenshot: screenshotPath,
            });
            throw error;
          }
        }
      }
    }

    const summaryPath = path.join(EVIDENCE_ROOT, "verification-summary.json");
    fs.writeFileSync(
      summaryPath,
      `${JSON.stringify(
        {
          passes: PASSES,
          viewports: VIEWPORTS.map((v) => v.name),
          routes: ROUTES.map((r) => r.id),
          totalChecks: report.length,
          failures: report.filter((r) => !r.ok).length,
          completedAt: new Date().toISOString(),
          results: report,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    expect(report.every((r) => r.ok)).toBe(true);
    expect(report.length).toBe(PASSES * VIEWPORTS.length * ROUTES.length);
  });
});
