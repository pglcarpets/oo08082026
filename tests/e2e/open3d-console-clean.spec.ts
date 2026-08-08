/**
 * Benchmark quality — open3d console product cleanliness.
 *
 * 1) Known catalog preview SVGs must not 404 (proof-chair / placeholder-cabinet).
 * 2) Product must not emit THREE.Color "Unknown color model" warnings
 *    (CSS vars like var(--text-inverse-body) must be resolved before materials).
 *    Fail on console warn/error text and pageerror — not only pageerror.
 *
 * Evidence: results/planner/benchmark-quality/tw2/
 * Agent pack copies: results/planner/benchmark-quality/tw-e2e/
 */
import { expect, test, type Page, type ConsoleMessage } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import {
  clearPlannerStorageInPage,
  enterGuestPlannerWorkspace,
} from "./guestProjectSetup";
import {
  placeSeatsFromConfigurator,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ mode: "serial", timeout: 120_000 });

const EVIDENCE = path.join(
  process.cwd(),
  "..",
  "results",
  "planner",
  "benchmark-quality",
  "tw2",
);

/** Controllable console 404s — demo/proof catalog thumbs referenced by open3d. */
const KNOWN_ASSET_PATHS = [
  "/proof-chair.svg",
  "/placeholder-cabinet.svg",
] as const;

/** Product regression: THREE receives unresolved CSS custom properties. */
const THREE_COLOR_UNKNOWN_RE = /THREE\.Color:\s*Unknown color model/i;

function urlMatchesKnownAsset(url: string): string | null {
  for (const assetPath of KNOWN_ASSET_PATHS) {
    if (url.includes(assetPath)) return assetPath;
  }
  return null;
}

function isThreeColorUnknown(text: string): boolean {
  return THREE_COLOR_UNKNOWN_RE.test(text);
}

type AssetHit = {
  url: string;
  assetPath: string;
  status: number;
};

async function attachKnownAssetMonitors(page: Page): Promise<{
  hits: AssetHit[];
  notFound: AssetHit[];
  consoleErrorsForAssets: string[];
  consoleErrors: string[];
  consoleWarnings: string[];
  threeColorUnknown: string[];
  pageErrors: string[];
}> {
  const hits: AssetHit[] = [];
  const notFound: AssetHit[] = [];
  const consoleErrorsForAssets: string[] = [];
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const threeColorUnknown: string[] = [];
  const pageErrors: string[] = [];

  page.on("requestfinished", async (request) => {
    const url = request.url();
    const assetPath = urlMatchesKnownAsset(url);
    if (!assetPath) return;
    try {
      const response = await request.response();
      const status = response?.status() ?? 0;
      const hit: AssetHit = { url, assetPath, status };
      hits.push(hit);
      if (status === 404) notFound.push(hit);
    } catch {
      // Response may be unavailable after navigation; ignore.
    }
  });

  page.on("response", (response) => {
    const url = response.url();
    const assetPath = urlMatchesKnownAsset(url);
    if (!assetPath) return;
    const status = response.status();
    // Dedupe with requestfinished; still catch any missed path.
    if (status === 404 && !notFound.some((h) => h.url === url && h.status === 404)) {
      notFound.push({ url, assetPath, status });
    }
  });

  page.on("console", (msg: ConsoleMessage) => {
    const type = msg.type();
    const text = msg.text();

    if (type === "error") {
      consoleErrors.push(text);
      if (KNOWN_ASSET_PATHS.some((p) => text.includes(p.replace(/^\//, "")))) {
        consoleErrorsForAssets.push(text);
      }
    }
    if (type === "warning") {
      consoleWarnings.push(text);
    }

    // Product bar: fail on THREE.Color CSS-var bleed via warn OR error (not only pageerror).
    if (
      (type === "warning" || type === "error" || type === "log") &&
      isThreeColorUnknown(text)
    ) {
      threeColorUnknown.push(`[${type}] ${text}`);
    }
  });

  page.on("pageerror", (err) => {
    const text = String(err?.message ?? err);
    pageErrors.push(text);
    if (isThreeColorUnknown(text)) {
      threeColorUnknown.push(`[pageerror] ${text}`);
    }
  });

  return {
    hits,
    notFound,
    consoleErrorsForAssets,
    consoleErrors,
    consoleWarnings,
    threeColorUnknown,
    pageErrors,
  };
}

function writeEvidence(
  name: string,
  payload: Record<string, unknown>,
): void {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.writeFileSync(
    path.join(EVIDENCE, name),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
}

test.describe("open3d console clean — known preview SVG 404s + THREE.Color", () => {
  test("after open3d load + 3D path, no SVG 404s and no THREE.Color Unknown color model", async ({
    page,
  }) => {
    fs.mkdirSync(EVIDENCE, { recursive: true });

    const monitors = await attachKnownAssetMonitors(page);

    // Live stack via guest host (Fabric PlannerFabricStage + demo catalog previews).
    await page.goto("/ooplanner/?plannerDevTools=1", {
      waitUntil: "domcontentloaded",
    });
    await clearPlannerStorageInPage(page);
    await enterGuestPlannerWorkspace(page, {
      projectName: "TW2 console-clean",
      preservePlannerState: true,
      navigate: false,
    });

    await waitForPlannerCanvas(page);
    const topbar = page.locator('[data-testid="topbar"]');
    await expect(topbar).toBeVisible({ timeout: 25_000 });

    // Catalog region loads demo thumbs that reference the known SVGs.
    const search = page.getByLabel("Search catalog elements");
    await expect(search).toBeVisible({ timeout: 15_000 });
    // Nudge catalog to materialize preview images (proof chair / cabinet).
    await search.fill("chair");
    await expect
      .poll(
        async () => {
          const catalog = page.getByRole("region", { name: "Catalog browser" });
          return catalog.getByRole("button", { name: /Add .* to canvas/i }).count();
        },
        { timeout: 10_000 },
      )
      .toBeGreaterThan(0);
    await search.fill("cabinet");
    await expect
      .poll(
        async () => {
          const catalog = page.getByRole("region", { name: "Catalog browser" });
          return catalog
            .getByRole("button", { name: /Add Modular Cabinet to canvas/i })
            .count();
        },
        { timeout: 10_000 },
      )
      .toBeGreaterThan(0);

    // Explicit fetch proof: if page never requested them, still assert HTTP status.
    for (const assetPath of KNOWN_ASSET_PATHS) {
      const res = await page.request.get(assetPath);
      expect(
        res.status(),
        `direct GET ${assetPath} must not be 404`,
      ).not.toBe(404);
      expect(res.ok(), `direct GET ${assetPath} should be ok`).toBe(true);
    }

    // 3D path — where THREE.Color CSS-var warnings historically fire (walls / materials).
    const beforeFurniture = await page.locator("body").innerText();
    const beforeMatch = beforeFurniture.match(/(\d+)\s+furniture/i);
    const beforeCount = beforeMatch ? Number.parseInt(beforeMatch[1], 10) : 0;

    await placeSeatsFromConfigurator(page, 4);
    await expect
      .poll(
        async () => {
          const body = await page.locator("body").innerText();
          const m = body.match(/(\d+)\s+furniture/i);
          return m ? Number.parseInt(m[1], 10) : -1;
        },
        { timeout: 25_000 },
      )
      .toBe(beforeCount + 4);

    const radio3d = page.getByRole("radio", { name: "3D", exact: true });
    await radio3d.click();
    await expect(radio3d).toBeChecked({ timeout: 10_000 });
    await expect(page.getByTestId("planner-3d-canvas")).toBeVisible({
      timeout: 20_000,
    });
    // Prefer orbit-ready; fall back to 3d canvas visible if attr lags.
    const orbit = page.locator(
      '[data-testid="three-viewer-container"][data-orbit-enabled="true"]',
    );
    try {
      await expect(orbit.first()).toBeVisible({ timeout: 12_000 });
    } catch {
      // Orbit attr is best-effort; 3D canvas + checked radio is enough to load materials.
      await expect(page.getByTestId("planner-3d-canvas")).toBeVisible();
    }
    // Real settle: furniture count still visible after mode switch (scene rebuilt).
    await expect
      .poll(
        async () => {
          const body = await page.locator("body").innerText();
          const m = body.match(/(\d+)\s+furniture/i);
          return m ? Number.parseInt(m[1], 10) : -1;
        },
        { timeout: 15_000 },
      )
      .toBe(beforeCount + 4);

    await page.screenshot({
      path: path.join(EVIDENCE, "01-open3d-loaded.png"),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(EVIDENCE, "02-open3d-3d-path.png"),
      fullPage: false,
    });

    const report = {
      capturedAt: new Date().toISOString(),
      route: page.url(),
      knownAssetPaths: [...KNOWN_ASSET_PATHS],
      networkHits: monitors.hits,
      notFound404: monitors.notFound,
      consoleErrorsForAssets: monitors.consoleErrorsForAssets,
      consoleErrorCount: monitors.consoleErrors.length,
      consoleErrorsSample: monitors.consoleErrors.slice(0, 20),
      consoleWarningCount: monitors.consoleWarnings.length,
      consoleWarningsSample: monitors.consoleWarnings.slice(0, 30),
      threeColorUnknown: monitors.threeColorUnknown,
      pageErrors: monitors.pageErrors,
    };
    writeEvidence("console-clean-report.json", report);

    expect(
      monitors.notFound,
      `known assets must not 404 via requestfinished/response: ${JSON.stringify(monitors.notFound)}`,
    ).toEqual([]);

    expect(
      monitors.consoleErrorsForAssets,
      `console must not report 404 for known assets: ${JSON.stringify(monitors.consoleErrorsForAssets)}`,
    ).toEqual([]);

    // Hard product bar: THREE.Color Unknown color model must not appear
    // (console warn/error/log OR pageerror — not only pageerror).
    expect(
      monitors.threeColorUnknown,
      `THREE.Color Unknown color model must not appear (CSS var bleed): ${JSON.stringify(monitors.threeColorUnknown)}`,
    ).toEqual([]);

    writeEvidence("run.json", {
      test: "open3d-console-clean",
      result: "pass",
      notFound404Count: monitors.notFound.length,
      consoleErrorsForAssetsCount: monitors.consoleErrorsForAssets.length,
      threeColorUnknownCount: monitors.threeColorUnknown.length,
      pageErrorCount: monitors.pageErrors.length,
      networkHitCount: monitors.hits.length,
      capturedAt: report.capturedAt,
    });
  });
});
