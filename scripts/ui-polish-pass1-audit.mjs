/**
 * Pass 1 — page-by-page UI audit at plan viewports.
 * Output: results/ui-polish/pass-1/audit-report.json
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "results", "ui-polish", "pass-1");
const VIEWPORTS = [
  { name: "desktop", width: 1920, height: 1080 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "phone", width: 390, height: 844 },
];

const ROUTES = [
  "/",
  "/products/",
  "/products/workstations/",
  "/planning/",
  "/planner/",
  "/contact/",
  "/about/",
  "/solutions/",
  "/clients/",
  "/trusted-by/",
  "/showrooms/",
  "/downloads/",
  "/privacy/",
  "/terms/",
  "/ooplanner/",
  "/oostudio/",
  "/admin/",
];

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext();
await context.addCookies([
  {
    name: "oando_cookie_consent",
    value: "accepted",
    domain: "localhost",
    path: "/",
    sameSite: "Lax",
  },
]);

const report = [];

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    const page = await context.newPage();
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text().slice(0, 200));
    });
    page.on("pageerror", (err) => errors.push(String(err).slice(0, 200)));

    const url = `${BASE}${route}`;
    let status = "ok";
    let entry = { route, viewport: vp.name, url, issues: [] };

    try {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(1500);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(500);

      entry.httpStatus = resp?.status() ?? 0;
      if (entry.httpStatus >= 400) {
        entry.issues.push(`HTTP ${entry.httpStatus}`);
        status = "fail";
      }

      const metrics = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        const h1 = document.querySelector("h1");
        const bodyFont = getComputedStyle(body).fontFamily;
        const h1Font = h1 ? getComputedStyle(h1).fontFamily : null;
        const bodyColor = getComputedStyle(body).color;
        const scrollW = Math.max(body.scrollWidth, html.scrollWidth);
        const clientW = html.clientWidth;
        const stickyCta = document.querySelector('[data-testid="mobile-sticky-cta"]');
        const threeTab = document.querySelector('[data-testid="dock-tab-3d"]');
        const select = document.querySelector("select");
        const selectFont = select ? getComputedStyle(select).fontFamily : null;
        return {
          title: document.title,
          bodyFont,
          h1Font,
          h1Text: h1?.textContent?.trim().slice(0, 80) ?? null,
          bodyColor,
          horizontalOverflow: scrollW > clientW + 2,
          scrollWidth: scrollW,
          clientWidth: clientW,
          hasStickyCta: !!stickyCta,
          hasThreeTab: !!threeTab,
          selectFont,
          mainExists: !!document.querySelector("main"),
        };
      });

      entry.metrics = metrics;

      if (!/Helvetica/i.test(metrics.bodyFont) && !/helvetica/i.test(metrics.bodyFont)) {
        entry.issues.push(`body font not Helvetica: ${metrics.bodyFont.slice(0, 80)}`);
      }
      if (metrics.h1Font && !/Cisco/i.test(metrics.h1Font)) {
        entry.issues.push(`h1 font not Cisco: ${metrics.h1Font.slice(0, 80)}`);
      }
      if (metrics.horizontalOverflow) {
        entry.issues.push(`horizontal overflow ${metrics.scrollWidth}px > ${metrics.clientWidth}px`);
      }
      if (metrics.hasStickyCta) {
        entry.issues.push("mobile sticky CTA still present");
      }
      if (route === "/oostudio/" && metrics.hasThreeTab) {
        entry.issues.push("Studio 3D tab still present");
      }
      if (metrics.selectFont && /Times/i.test(metrics.selectFont)) {
        entry.issues.push(`select uses Times: ${metrics.selectFont.slice(0, 80)}`);
      }
      if (errors.length) {
        entry.consoleErrors = errors.slice(0, 5);
        if (errors.some((e) => !/favicon|404|hydration/i.test(e))) {
          entry.issues.push(`console errors: ${errors.length}`);
        }
      }

      const shotName = `${route.replace(/\//g, "_").replace(/^_|_$/g, "") || "home"}-${vp.name}.png`;
      await page.screenshot({
        path: path.join(OUT_DIR, shotName),
        fullPage: vp.name === "phone",
      });

      if (entry.issues.length) status = "issues";
    } catch (e) {
      entry.issues.push(`navigation error: ${String(e).slice(0, 120)}`);
      status = "fail";
    }

    entry.status = status;
    report.push(entry);
    await page.close();
  }
}

await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  totalChecks: report.length,
  failed: report.filter((r) => r.status === "fail").length,
  withIssues: report.filter((r) => r.status === "issues").length,
  ok: report.filter((r) => r.status === "ok").length,
  routesWithIssues: [...new Set(report.filter((r) => r.issues.length).map((r) => r.route))],
};

fs.writeFileSync(path.join(OUT_DIR, "audit-report.json"), JSON.stringify({ summary, report }, null, 2));

console.log(JSON.stringify(summary, null, 2));
console.log("\nRoutes with issues:");
for (const route of summary.routesWithIssues) {
  const items = report.filter((r) => r.route === route && r.issues.length);
  console.log(`\n${route}`);
  for (const item of items) {
    console.log(`  [${item.viewport}] ${item.issues.join("; ")}`);
  }
}
