/**
 * Local UI check — http://localhost:3000 only (never 127.0.0.1)
 * Output: results/local-ui-check/report.json + screenshots
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "http://localhost:3000";
const OUT = path.join(ROOT, "results/local-ui-check");

const PATHS = [
  { path: "/", label: "home" },
  { path: "/products/", label: "products" },
  { path: "/ooplanner/", label: "ooplanner" },
  { path: "/oostudio/", label: "oostudio" },
  { path: "/portal/", label: "portal" },
  { path: "/dashboard/", label: "dashboard" },
  { path: "/login/", label: "login" },
  { path: "/api/categories/", label: "api-categories" },
];

function portUp() {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: "localhost", port: 3000, path: "/", method: "GET", timeout: 3000 },
      (res) => {
        res.resume();
        resolve(true);
      },
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function waitReady(maxMs = 180000) {
  const start = Date.now();
  let attempts = 0;
  while (Date.now() - start < maxMs) {
    attempts += 1;
    try {
      const res = await fetch(`${BASE}/`, { redirect: "follow" });
      if (res.status > 0) {
        return { ok: true, attempts, ms: Date.now() - start };
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return { ok: false, attempts, ms: Date.now() - start, error: "timeout after 3m" };
}

async function fetchCategories() {
  const res = await fetch(`${BASE}/api/categories/`, { redirect: "follow" });
  const text = await res.text();
  let categories = [];
  try {
    categories = JSON.parse(text);
  } catch {
    return { status: res.status, error: "invalid json", preview: text.slice(0, 200) };
  }
  const total = Array.isArray(categories)
    ? categories.reduce((s, c) => s + (Number(c.count) || 0), 0)
    : 0;
  return {
    status: res.status,
    categoryCount: Array.isArray(categories) ? categories.length : 0,
    productCountSum: total,
    sample: Array.isArray(categories)
      ? categories.slice(0, 5).map((c) => ({ slug: c.slug, count: c.count }))
      : [],
  };
}

async function headCheck(routePath) {
  try {
    let res = await fetch(`${BASE}${routePath}`, { method: "HEAD", redirect: "manual" });
    let method = "HEAD";
    if (res.status === 405 || res.status === 501) {
      res = await fetch(`${BASE}${routePath}`, { method: "GET", redirect: "manual" });
      method = "GET";
    }
    return {
      method,
      status: res.status,
      ok: res.ok,
      location: res.headers.get("location"),
    };
  } catch (err) {
    return {
      method: "HEAD",
      status: null,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function screenshotPage(page, url, outFile) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: outFile, fullPage: false });
  const title = await page.title();
  const h1 = await page.locator("h1").first().textContent().catch(() => null);
  return { title, h1: h1?.trim() ?? null };
}

async function main() {
  await mkdir(path.join(OUT, "screenshots"), { recursive: true });

  const report = {
    baseUrl: BASE,
    checkedAt: new Date().toISOString(),
    devServer: { alreadyRunning: await portUp(), started: false },
    wait: null,
    paths: {},
    apiCategories: null,
    screenshots: {},
    errors: [],
  };

  if (!report.devServer.alreadyRunning) {
    // On Windows, spawn("pnpm") can resolve to the wrong app — always go through cmd.
    const isWin = process.platform === "win32";
    const child = isWin
      ? spawn("cmd.exe", ["/c", "pnpm dev"], {
          cwd: ROOT,
          detached: true,
          stdio: "ignore",
        })
      : spawn("pnpm", ["dev"], {
          cwd: ROOT,
          detached: true,
          stdio: "ignore",
        });
    child.unref();
    report.devServer.started = true;
  }

  report.wait = await waitReady();
  if (!report.wait.ok) {
    report.errors.push("Server did not become ready within 3 minutes");
    report.finishedAt = new Date().toISOString();
    await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
    process.exit(1);
  }

  report.apiCategories = await fetchCategories();

  for (const p of PATHS) {
    report.paths[p.label] = {
      path: p.path,
      url: `${BASE}${p.path}`,
      ...(await headCheck(p.path)),
    };
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  for (const p of PATHS.filter((x) => !x.path.startsWith("/api/"))) {
    const url = `${BASE}${p.path}`;
    const file = path.join(OUT, "screenshots", `${p.label}.png`);
    try {
      report.screenshots[p.label] = {
        url,
        file: path.relative(ROOT, file).replace(/\\/g, "/"),
        ...(await screenshotPage(page, url, file)),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      report.screenshots[p.label] = { url, error: msg };
      report.errors.push(`screenshot ${p.path}: ${msg}`);
    }
  }

  await browser.close();
  report.finishedAt = new Date().toISOString();
  await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
