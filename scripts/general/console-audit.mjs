/**
 * Console audit -- checks for console errors, hydration mismatches, and failed images
 * on key routes using Playwright.
 *
 * Usage:
 *   # With dev server already running on localhost:3000
 *   node scripts/general/console-audit.mjs
 *
 *   # Against production
 *   BASE_URL=https://oando.co.in node scripts/general/console-audit.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "results", "console-audit");
const OUT_FILE = path.join(OUT_DIR, "errors.json");

const ROUTES = [
  "/",
  "/products/",
  "/products/workstations/",
  "/products/seating/",
  "/planning/",
  "/contact/",
  "/dashboard/",
  "/portal/",
];

async function auditRoute(page, route) {
  const url = `${BASE}${route}`;
  const consoleErrors = [];
  const consoleWarnings = [];
  const failedImages = [];

  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === "error") {
      consoleErrors.push(text);
    } else if (type === "warning") {
      consoleWarnings.push(text);
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(`[pageerror] ${err.message}`);
  });

  page.on("response", (resp) => {
    const req = resp.request();
    const resourceType = req.resourceType();
    const status = resp.status();
    if (resourceType === "image" && status >= 400) {
      failedImages.push({
        url: req.url(),
        status,
        route,
      });
    }
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    // Wait a bit for hydration errors to surface
    await page.waitForTimeout(2000);
  } catch (e) {
    consoleErrors.push(`[navigation] ${e.message}`);
  }

  return {
    consoleErrors,
    consoleWarnings,
    failedImages,
    failedImageCount: failedImages.length,
  };
}

async function main() {
  console.log(`Console audit starting against ${BASE}`);

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const results = {
    checkedAt: new Date().toISOString(),
    baseUrl: BASE,
    routes: {},
  };

  for (const route of ROUTES) {
    const page = await context.newPage();
    const audit = await auditRoute(page, route);
    results.routes[route] = audit;

    const errorCount = audit.consoleErrors.length;
    const warnCount = audit.consoleWarnings.length;
    const imgCount = audit.failedImages.length;
    console.log(
      `${route}: ${errorCount} errors, ${warnCount} warnings, ${imgCount} failed images`
    );

    await page.close();
  }

  await browser.close();

  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${OUT_FILE}`);

  const totalErrors = Object.values(results.routes).reduce(
    (sum, r) => sum + r.consoleErrors.length,
    0
  );
  const totalWarnings = Object.values(results.routes).reduce(
    (sum, r) => sum + r.consoleWarnings.length,
    0
  );
  const totalImages = Object.values(results.routes).reduce(
    (sum, r) => sum + r.failedImages.length,
    0
  );

  console.log(`\nSummary: ${totalErrors} errors, ${totalWarnings} warnings, ${totalImages} failed images`);

  if (totalErrors > 0 || totalImages > 0) {
    console.log("\nFAILED -- console errors or failed images detected");
    process.exit(1);
  }

  console.log("\nPASSED -- no console errors or failed images");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
