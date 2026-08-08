/**
 * Admin Phases 1–4 live browser suite:
 * smoke load, axe a11y, screenshots, keyboard sample.
 *
 * Requires DEV_AUTH_BYPASS=1 (dev turbo server).
 * Does not mutate canonical catalog files.
 */
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const RUN_ID =
  process.env.ADMIN_LIVE_RUN_ID ??
  new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + "_phases-live";

const EVIDENCE_ROOT = path.join(
  process.cwd(),
  `results/admin/${RUN_ID}`,
);
const SHOTS = path.join(EVIDENCE_ROOT, "screenshots");
const REPORTS = path.join(EVIDENCE_ROOT, "reports");
const LOGS = path.join(EVIDENCE_ROOT, "logs");

const authBypassOn = process.env.DEV_AUTH_BYPASS === "1";

type RouteSmoke = {
  readonly phase: "1" | "2" | "3" | "4" | "shell";
  readonly path: string;
  readonly ready: (page: Page) => Promise<void>;
  readonly shot: string;
};

const ROUTES: readonly RouteSmoke[] = [
  {
    phase: "shell",
    path: "/admin",
    shot: "00-admin-dashboard",
    ready: async (page) => {
      await expect(page).toHaveURL(/\/admin\/?$/);
      await expect(page.locator("main, [data-testid], h1").first()).toBeVisible({
        timeout: 45_000,
      });
    },
  },
  {
    phase: "1",
    path: "/admin/product-studio/",
    shot: "p1-svg-editor-list",
    ready: async (page) => {
      // Canonical Product Studio (legacy /admin/svg-editor redirects here).
      await expect(page).toHaveURL(/\/admin\/product-studio\/?/);
      await expect(page.getByTestId("admin-svg-primary-journey")).toBeVisible({
        timeout: 45_000,
      });
      await expect(page.getByTestId("admin-shell-title")).toBeVisible();
      await expect(page.getByTestId("admin-svg-inventory")).toBeVisible();
    },
  },
  {
    phase: "1",
    path: "/admin/product-studio/oando-linear-desk-1600/",
    shot: "p1-svg-studio-edit",
    ready: async (page) => {
      await expect(page).toHaveURL(
        /\/admin\/product-studio\/oando-linear-desk-1600\/?/,
      );
      await expect(page.getByTestId("admin-svg-edit-shell")).toBeVisible({
        timeout: 45_000,
      });
      await expect(page.getByTestId("admin-shell-primary-action")).toBeVisible();
      await expect(
        page.getByRole("toolbar", { name: "Canvas tools" }),
      ).toBeVisible({ timeout: 45_000 });
    },
  },
  {
    phase: "2",
    path: "/admin/product-studio/",
    shot: "p2-inventory-filters",
    ready: async (page) => {
      await expect(page.getByTestId("admin-svg-inventory-filters")).toBeVisible({
        timeout: 45_000,
      });
      await expect(page.getByTestId("admin-svg-inventory-search")).toBeVisible();
      await expect(page.getByTestId("admin-svg-inventory-table")).toBeVisible();
      // Bulk CSV is advanced (collapsed <details>); open then assert.
      const advanced = page.getByTestId("admin-svg-advanced-import");
      await expect(advanced).toBeVisible();
      await advanced.locator("summary").click();
      await expect(page.getByTestId("admin-svg-bulk-import")).toBeVisible();
    },
  },
  {
    phase: "2",
    path: "/admin/catalog",
    shot: "p2-catalog",
    ready: async (page) => {
      await expect(page).toHaveURL(/\/admin\/catalog/);
      await expect(page.locator("h1, [data-testid]").first()).toBeVisible({
        timeout: 45_000,
      });
    },
  },
  {
    phase: "2",
    path: "/admin/inventory",
    shot: "p2-route-inventory",
    ready: async (page) => {
      await expect(page).toHaveURL(/\/admin\/inventory/);
      await expect(page.locator("h1, table, [data-testid]").first()).toBeVisible({
        timeout: 45_000,
      });
    },
  },
  {
    phase: "3",
    path: "/admin/planner-catalog",
    shot: "p3-planner-catalog-families",
    ready: async (page) => {
      await expect(page).toHaveURL(/\/admin\/planner-catalog/);
      await expect(page.locator("h1, main, [data-testid]").first()).toBeVisible({
        timeout: 45_000,
      });
    },
  },
  {
    phase: "3",
    path: "/admin/workspace-catalog",
    shot: "p3-workspace-catalog",
    ready: async (page) => {
      await expect(page).toHaveURL(/\/admin\/workspace-catalog/);
      await expect(page.locator("h1, main, [data-testid]").first()).toBeVisible({
        timeout: 45_000,
      });
    },
  },
  {
    phase: "4",
    path: "/admin/price-books",
    shot: "p4-price-books",
    ready: async (page) => {
      await expect(page).toHaveURL(/\/admin\/price-books/);
      await expect(page.getByTestId("admin-price-book-page")).toBeVisible({
        timeout: 45_000,
      });
      await expect(page.getByRole("heading", { name: "Price books" })).toBeVisible();
    },
  },
];

function ensureDirs(): void {
  mkdirSync(SHOTS, { recursive: true });
  mkdirSync(REPORTS, { recursive: true });
  mkdirSync(LOGS, { recursive: true });
}

async function collectPageErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (err) => {
    errors.push(String(err.message ?? err));
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`[console.error] ${msg.text()}`);
    }
  });
  return errors;
}

test.describe("Admin phases live — smoke + screenshots + a11y", () => {
  test.beforeAll(() => {
    expect(
      authBypassOn,
      "Admin live suite requires DEV_AUTH_BYPASS=1",
    ).toBe(true);
    ensureDirs();
    writeFileSync(
      path.join(LOGS, "run-meta.json"),
      `${JSON.stringify(
        {
          runId: RUN_ID,
          startedAt: new Date().toISOString(),
          devAuthBypass: authBypassOn,
          routes: ROUTES.map((r) => ({ phase: r.phase, path: r.path, shot: r.shot })),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
  });

  for (const route of ROUTES) {
    test(`phase ${route.phase} smoke ${route.path} (${route.shot})`, async ({
      page,
    }) => {
      const errors = await collectPageErrors(page);
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page).not.toHaveURL(/\/access\//);
      await route.ready(page);

      const shotPath = path.join(SHOTS, `${route.shot}.png`);
      await page.screenshot({
        path: shotPath,
        fullPage: true,
        caret: "initial",
      });

      writeFileSync(
        path.join(LOGS, `${route.shot}-console.json`),
        `${JSON.stringify({ path: route.path, errors }, null, 2)}\n`,
        "utf8",
      );
    });
  }

  test("phase 1 live studio interactions + keyboard", async ({ page }) => {
    await page.goto("/admin/product-studio/oando-linear-desk-1600/", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("admin-svg-edit-shell")).toBeVisible({
      timeout: 45_000,
    });
    const stage = page.locator(".svg-studio__stage");
    await expect(stage).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("button", { name: "Add rectangle" })).toBeVisible();
    await page.getByRole("button", { name: "Add rectangle" }).click();
    await expect(page.getByTestId("admin-svg-engine-shell")).toBeVisible();

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      return {
        tag: el.tagName,
        role: el.getAttribute("role"),
        testId: el.getAttribute("data-testid"),
        name:
          el.getAttribute("aria-label") ||
          (el as HTMLElement).innerText?.slice(0, 80) ||
          null,
      };
    });
    writeFileSync(
      path.join(LOGS, "p1-keyboard-focus.json"),
      `${JSON.stringify({ focused }, null, 2)}\n`,
      "utf8",
    );
    expect(focused).not.toBeNull();

    await page.screenshot({
      path: path.join(SHOTS, "p1-studio-after-add-rect.png"),
      fullPage: true,
      caret: "initial",
    });
  });

  test("phase 2 inventory search + filter live", async ({ page }) => {
    await page.goto("/admin/product-studio/", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("admin-svg-inventory-search")).toBeVisible({
      timeout: 45_000,
    });
    await page.getByTestId("admin-svg-inventory-search").fill("linear-desk");
    await expect(page.getByTestId("admin-svg-inventory-table")).toBeVisible();
    const row = page.locator('tr[data-slug="oando-linear-desk-1600"]');
    await expect(row).toBeVisible({ timeout: 20_000 });
    await page.screenshot({
      path: path.join(SHOTS, "p2-inventory-search-desk.png"),
      fullPage: true,
      caret: "initial",
    });
  });

  test("phase 4 price book panel live load", async ({ page }) => {
    await page.goto("/admin/price-books", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("admin-price-book-page")).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByTestId("admin-price-book-panel")).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByTestId("admin-price-book-history")).toBeVisible();
    await page.screenshot({
      path: path.join(SHOTS, "p4-price-books-panel.png"),
      fullPage: true,
      caret: "initial",
    });
  });

  test("ADM-A11Y-01 axe on primary Admin journeys", async ({ page }) => {
    const targets: { path: string; include?: string; label: string }[] = [
      {
        path: "/admin/product-studio/",
        include: "[data-testid=admin-svg-primary-journey]",
        label: "svg-list",
      },
      {
        path: "/admin/product-studio/oando-linear-desk-1600/",
        include: "[data-testid=admin-svg-edit-shell]",
        label: "svg-edit",
      },
      {
        path: "/admin/price-books",
        include: "[data-testid=admin-price-book-page]",
        label: "price-books",
      },
    ];

    const allViolations: Record<
      string,
      { count: number; ids: string[]; details: unknown[] }
    > = {};

    for (const target of targets) {
      await page.goto(target.path, { waitUntil: "domcontentloaded" });
      if (target.include) {
        await expect(page.locator(target.include).first()).toBeVisible({
          timeout: 45_000,
        });
      } else {
        await page.waitForLoadState("networkidle").catch(() => undefined);
      }

      let builder = new AxeBuilder({ page }).withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
        "wcag22aa",
      ]);
      if (target.include) {
        builder = builder.include(target.include);
      }
      const results = await builder.analyze();
      allViolations[target.label] = {
        count: results.violations.length,
        ids: results.violations.map((v) => v.id),
        details: results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          nodes: v.nodes.slice(0, 5).map((n) => ({
            target: n.target,
            failureSummary: n.failureSummary,
          })),
        })),
      };

      await page.screenshot({
        path: path.join(SHOTS, `a11y-${target.label}.png`),
        fullPage: true,
        caret: "initial",
      });
    }

    writeFileSync(
      path.join(REPORTS, "axe-admin-primary.json"),
      `${JSON.stringify(allViolations, null, 2)}\n`,
      "utf8",
    );

    // Honest: record failures; fail the test if any serious WCAG AA hits.
    const total = Object.values(allViolations).reduce((n, v) => n + v.count, 0);
    writeFileSync(
      path.join(REPORTS, "axe-summary.json"),
      `${JSON.stringify({ totalViolations: total, byPage: allViolations }, null, 2)}\n`,
      "utf8",
    );
    expect(
      total,
      `Axe WCAG violations (see results/admin/${RUN_ID}/reports/axe-admin-primary.json): ${JSON.stringify(
        Object.fromEntries(
          Object.entries(allViolations).map(([k, v]) => [k, v.ids]),
        ),
      )}`,
    ).toBe(0);
  });

  test("mobile shell smoke (ADM-MOB)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/product-studio/", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("admin-svg-primary-journey")).toBeVisible({
      timeout: 45_000,
    });
    const scrollWidth = await page.evaluate(() => {
      const el = document.documentElement;
      return { clientWidth: el.clientWidth, scrollWidth: el.scrollWidth };
    });
    writeFileSync(
      path.join(LOGS, "mobile-scroll.json"),
      `${JSON.stringify(scrollWidth, null, 2)}\n`,
      "utf8",
    );
    await page.screenshot({
      path: path.join(SHOTS, "mobile-svg-list.png"),
      fullPage: true,
      caret: "initial",
    });
    // Allow small scrollbar variance
    expect(scrollWidth.scrollWidth).toBeLessThanOrEqual(scrollWidth.clientWidth + 8);
  });
});
