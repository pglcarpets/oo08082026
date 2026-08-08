/**
 * /planner/ marketing landing must scroll; workspace routes stay 100dvh locked.
 * Evidence: results/planner/planner-scroll-fix/
 */
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const EVIDENCE_ROOT = path.join(process.cwd(), "..", "results", "planner", "planner-scroll-fix");

test.describe("Planner marketing scroll vs workspace shell", () => {
  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCE_ROOT, { recursive: true });
  });

  test("marketing /planner/ scrolls past hero to lower sections", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/planner/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });

    const before = await page.evaluate(() => ({
      bodyClasses: document.body.className,
      hasWorkspace: document.body.classList.contains("planner-workspace"),
      hasPlannerRoot: document.body.classList.contains("planner-root"),
      hasOverflowHidden: document.body.classList.contains("overflow-hidden"),
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
      scrollY: window.scrollY,
    }));

    expect(before.hasWorkspace).toBe(false);
    expect(before.hasPlannerRoot).toBe(false);
    expect(before.hasOverflowHidden).toBe(false);
    expect(before.scrollHeight).toBeGreaterThan(before.innerHeight + 200);

    await page.screenshot({ path: path.join(EVIDENCE_ROOT, "planner-landing-top.png") });

    await page.evaluate(() => window.scrollTo({ top: 9_999, behavior: "instant" }));
    await expect
      .poll(async () => page.evaluate(() => window.scrollY), { timeout: 5_000 })
      .toBeGreaterThan(400);

    const after = await page.evaluate(() => ({
      scrollY: window.scrollY,
      featuresVisible: !!document.querySelector(".home-tool-card, .planner-landing-feature"),
    }));

    expect(after.scrollY).toBeGreaterThan(400);
    expect(after.featuresVisible).toBe(true);

    await page.screenshot({ path: path.join(EVIDENCE_ROOT, "planner-landing-scrolled.png") });

    fs.writeFileSync(
      path.join(EVIDENCE_ROOT, "marketing-scroll.json"),
      `${JSON.stringify({ before, after, ok: true, completedAt: new Date().toISOString() }, null, 2)}\n`,
      "utf8",
    );
  });

  test("workspace routes keep 100dvh overflow lock", async ({ page }) => {
    for (const route of ["/ooplanner/?plannerDevTools=1"]) {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 120_000 });
      await expect
        .poll(async () =>
          page.evaluate(() => document.body.classList.contains("planner-workspace")),
        )
        .toBe(true);

      const metrics = await page.evaluate(() => ({
        bodyClasses: document.body.className,
        htmlOverflow: window.getComputedStyle(document.documentElement).overflow,
        bodyOverflow: window.getComputedStyle(document.body).overflow,
        scrollHeight: document.documentElement.scrollHeight,
        innerHeight: window.innerHeight,
      }));

      expect(metrics.bodyClasses).toContain("planner-workspace");
      expect(metrics.bodyClasses).toContain("planner-root");
      expect(metrics.htmlOverflow).toBe("hidden");
      expect(metrics.bodyOverflow).toBe("hidden");
      expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.innerHeight + 2);

      const safeRouteName = route.replace(/[/?=&]/g, "-").replace(/^-|-$/g, "");
      await page.screenshot({
        path: path.join(EVIDENCE_ROOT, `workspace-100dvh-${safeRouteName}.png`),
      });
    }

    fs.writeFileSync(
      path.join(EVIDENCE_ROOT, "workspace-100dvh.json"),
      `${JSON.stringify({ ok: true, completedAt: new Date().toISOString() }, null, 2)}\n`,
      "utf8",
    );
  });

  test("guest → marketing client nav unlocks document scroll", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/ooplanner/?plannerDevTools=1", { waitUntil: "domcontentloaded", timeout: 120_000 });
    await expect
      .poll(async () =>
        page.evaluate(() => document.body.classList.contains("planner-workspace")),
      )
      .toBe(true);

    await page.evaluate(() => {
      const link = document.createElement("a");
      link.href = "/planner/";
      link.click();
    });
    await page.waitForURL(/\/planner\/?$/, { timeout: 30_000 });
    await expect
      .poll(
        async () =>
          page.evaluate(() => document.body.classList.contains("planner-workspace")),
        { timeout: 15_000 },
      )
      .toBe(false);

    const landing = await page.evaluate(() => ({
      url: location.pathname,
      bodyClasses: document.body.className,
      hasWorkspace: document.body.classList.contains("planner-workspace"),
      bodyOverflow: document.body.style.overflow,
    }));

    expect(landing.url).toMatch(/\/planner\/?$/);
    expect(landing.hasWorkspace).toBe(false);
    expect(landing.bodyOverflow).toBe("");

    await page.evaluate(() => window.scrollTo({ top: 9_999, behavior: "instant" }));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(400);

    fs.writeFileSync(
      path.join(EVIDENCE_ROOT, "guest-to-marketing-scroll.json"),
      `${JSON.stringify({ landing, scrollY, ok: true, completedAt: new Date().toISOString() }, null, 2)}\n`,
      "utf8",
    );
  });
});
