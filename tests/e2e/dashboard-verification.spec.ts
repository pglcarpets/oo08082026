/**
 * Dashboard route browser verification — header branding, overflow, console.
 * Evidence: results/site/dashboard-verification/
 */
import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const EVIDENCE_ROOT = path.join(process.cwd(), "..", "results", "site", "dashboard-verification");

const VIEWPORTS = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "375x812", width: 375, height: 812 },
] as const;

const CONSOLE_IGNORE = [
  /favicon\.ico/i,
  /webpack-hmr/i,
  /hmr/i,
  /Download the React DevTools/i,
];

function isBenignConsoleError(text: string): boolean {
  return CONSOLE_IGNORE.some((re) => re.test(text));
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

  return { consoleErrors, pageErrors, failedResponses };
}

async function assertNoHorizontalOverflow(page: Page, selector: string): Promise<void> {
  const metrics = await page.locator(selector).first().evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

test.describe.configure({ mode: "serial", timeout: 180_000 });

test.describe("Dashboard verification", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} — header, branding, overflow`, async ({ page }) => {
      fs.mkdirSync(path.join(EVIDENCE_ROOT, viewport.name), { recursive: true });
      const monitors = attachMonitors(page);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/dashboard/", { waitUntil: "domcontentloaded" });

      // Auth gate: should land on dashboard, not access redirect
      await expect(page).toHaveURL(/\/dashboard\/?$/);

      const header = page.locator("header").first();
      await expect(header).toBeVisible({ timeout: 15_000 });

      // Branding: real wordmark + Suite chip (sm+)
      const brandLink = page.getByLabel(/One&Only workspace/i);
      await expect(brandLink).toBeVisible();
      await expect(brandLink.getByRole("img", { name: /One&Only/i })).toBeVisible();

      if (viewport.width >= 640) {
        await expect(brandLink).toContainText("Suite");
      }

      // Main nav
      const nav = page.getByRole("navigation", { name: "Main navigation" });
      await expect(nav).toBeVisible();
      await expect(nav.getByRole("link", { name: "Dashboard", exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );

      // Hero content
      await expect(
        page.getByRole("heading", { name: /Your office furniture planner hub/i }),
      ).toBeVisible();

      // Header metrics
      const headerBox = await header.boundingBox();
      expect(headerBox).not.toBeNull();
      expect(headerBox!.y).toBeGreaterThanOrEqual(0);
      expect(headerBox!.width).toBeLessThanOrEqual(viewport.width);

      // Logo alignment inside brand link
      const brandMetrics = await brandLink.evaluate((el) => {
        const logo = el.querySelector("img");
        const rect = el.getBoundingClientRect();
        const logoRect = logo?.getBoundingClientRect();
        return {
          brandLeft: rect.left,
          logoTop: logoRect?.top ?? 0,
          logoHeight: logoRect?.height ?? 0,
          headerAlign: logoRect
            ? Math.abs(logoRect.top + logoRect.height / 2 - (rect.top + rect.height / 2))
            : 999,
        };
      });
      expect(brandMetrics.headerAlign).toBeLessThan(6);

      // Top accent bar (shell-top-accent utility)
      const accentBar = header.locator(".shell-top-accent");
      const accentCount = await accentBar.count();

      // Page overflow
      await assertNoHorizontalOverflow(page, "body");
      await assertNoHorizontalOverflow(page, ".workspace-hub");

      await page.screenshot({
        path: path.join(EVIDENCE_ROOT, viewport.name, "dashboard.png"),
        fullPage: true,
      });

      const report = {
        viewport: viewport.name,
        url: page.url(),
        branding: {
          wordmarkVisible: true,
          suiteBadgeVisible: viewport.width >= 640,
          accentBarPresent: accentCount > 0,
        },
        headerBox,
        brandMetrics,
        overflow: "pass",
        consoleErrors: monitors.consoleErrors,
        pageErrors: monitors.pageErrors,
        failedResponses: monitors.failedResponses,
      };

      fs.writeFileSync(
        path.join(EVIDENCE_ROOT, viewport.name, "report.json"),
        JSON.stringify(report, null, 2),
      );

      expect(monitors.pageErrors, `page errors at ${viewport.name}`).toEqual([]);
      expect(monitors.consoleErrors, `console errors at ${viewport.name}`).toEqual([]);
      expect(monitors.failedResponses, `failed requests at ${viewport.name}`).toEqual([]);
    });
  }
});
