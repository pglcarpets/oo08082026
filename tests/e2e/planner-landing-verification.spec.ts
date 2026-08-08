/**
 * Browser acceptance for /planner marketing landing.
 * Evidence: results/planner/planner-landing-verification/
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const EVIDENCE_ROOT = path.join(
  process.cwd(),
  "..",
  "results",
  "planner",
  "planner-landing-verification",
);

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
  /Failed to load resource.*favicon/i,
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
    if (status >= 400) {
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

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
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

async function assertPlannerLanding(page: Page, viewport: (typeof VIEWPORTS)[number]): Promise<void> {
  await expect(page).toHaveURL(/\/planner\/?$/);

  const hero = page.locator("#planner-hero");
  await expect(hero).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Plan your office/i })).toBeVisible();

  await expect(page.getByRole("link", { name: /Start free/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Sign in/i }).first()).toBeVisible();

  const demo = page.locator(".planner-hero-demo");
  await expect(demo).toBeVisible();
  await expect(demo.locator(".planner-hero-demo__segment")).toContainText("2D");
  await expect(demo.locator(".planner-hero-demo__segment")).toContainText("3D");
  await expect(demo.locator(".planner-hero-demo__segment")).toContainText("Split");

  await expect(page.getByText("Import sketch").first()).toBeVisible();
  await expect(page.getByText("Export plan").first()).toBeVisible();

  const plannerNav = page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Planner" });
  if (viewport.width >= 1024) {
    await expect(plannerNav).toBeVisible();
    await expect(plannerNav).toHaveClass(/shell-nav-link-current/);
  }

  if (viewport.width >= 1280) {
    await expect(page.getByRole("button", { name: /Guided Planner/i })).toBeVisible();
  }

  const scroll = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    bodyOverflow: getComputedStyle(document.body).overflow,
  }));
  expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight + 80);
  expect(scroll.bodyOverflow).not.toBe("hidden");

  await expect(page.getByRole("heading", { name: /Built for/i })).toBeVisible({
    timeout: 15_000,
  });

  await assertNoHorizontalOverflow(page);
  await runAxe(page, `planner-landing @ ${viewport.name}`);
}

test.describe("Planner landing — browser verification", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCE_ROOT, { recursive: true });
  });

  for (const viewport of VIEWPORTS) {
    test(`planner landing @ ${viewport.name}`, async ({ page }) => {
      const monitors = attachMonitors(page);
      const shotDir = path.join(EVIDENCE_ROOT, viewport.name);
      fs.mkdirSync(shotDir, { recursive: true });
      const screenshotPath = path.join(shotDir, "planner-landing.png");

      try {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto("/planner/", { waitUntil: "domcontentloaded", timeout: 60_000 });
        await expect(page.getByRole("heading", { level: 1, name: /Plan your office/i })).toBeVisible({
          timeout: 30_000,
        });
        await page.waitForTimeout(2500);
        await assertPlannerLanding(page, viewport);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        expect(monitors.pageErrors, `${viewport.name} pageerrors`).toEqual([]);
        expect(monitors.consoleErrors, `${viewport.name} console`).toEqual([]);
        expect(monitors.failedResponses, `${viewport.name} failed responses`).toEqual([]);

        fs.writeFileSync(
          path.join(shotDir, "result.json"),
          `${JSON.stringify(
            {
              viewport: viewport.name,
              ok: true,
              consoleErrors: monitors.consoleErrors,
              pageErrors: monitors.pageErrors,
              failedResponses: monitors.failedResponses,
              screenshot: screenshotPath,
              completedAt: new Date().toISOString(),
            },
            null,
            2,
          )}\n`,
          "utf8",
        );
      } catch (error) {
        await page.screenshot({
          path: path.join(shotDir, "planner-landing-FAIL.png"),
          fullPage: true,
        });
        fs.writeFileSync(
          path.join(shotDir, "result.json"),
          `${JSON.stringify(
            {
              viewport: viewport.name,
              ok: false,
              consoleErrors: monitors.consoleErrors,
              pageErrors: [
                ...monitors.pageErrors,
                error instanceof Error ? error.message : String(error),
              ],
              failedResponses: monitors.failedResponses,
              screenshot: path.join(shotDir, "planner-landing-FAIL.png"),
              completedAt: new Date().toISOString(),
            },
            null,
            2,
          )}\n`,
          "utf8",
        );
        throw error;
      } finally {
        monitors.detach();
      }
    });
  }
});
