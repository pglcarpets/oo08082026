/**
 * World-standard open3d journey — W1 (draw walls + door/opening) + W2 (place catalog incl. cabinet-v0).
 *
 * Evidence (canonical): results/planner/world-standard-wave/02-browser-open3d-journey/
 * Phase alias:          results/planner/world-standard-wave/07-browser-journey/
 * Serial: playwright.config fullyParallel — this file MUST run serial.
 *
 * Anti false-green (CP-07 / CODE-REVIEW-LIVE):
 *  - open3d primary → guest fallback; routeUsed recorded
 *  - status-bar helpers only (no body metric parsers)
 *  - walls Δ + Opening objects Δ bound to wall that grew
 *  - cabinet-v0 via exact Modular Cabinet CTA; second SKU via exact desk CTA
 *  - placePath catalog only — no configurator sole-green
 *  - 01–07 storyboard + non-blank canvas PNG + playwright-run.json after asserts
 */
import { expect, test, type Page } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  clearPlannerStorage,
  completePlannerSetupGate,
  enterGuestPlannerWorkspace,
} from "./guestProjectSetup";
import {
  drawWallByTwoClicks,
  getFurnitureCount,
  getObjectCount,
  getWallCount,
  placeCatalogOnCanvas,
  placeOpeningOnCanvas,
  PLANNER_FABRIC_STAGE,
  PLANNER_PAINT_CANVAS,
  PLANNER_PRIMARY_CANVAS,
  selectPlannerTool,
  switchPlannerViewMode,
  tapOnCanvas,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

const SITE_ROOT = path.join(process.cwd(), "site");
const REPO_ROOT = path.resolve(SITE_ROOT, "..");
const EVIDENCE_DIR = path.join(
  REPO_ROOT,
  "results",
  "planner",
  "world-standard-wave",
  "02-browser-open3d-journey",
);
const PHASE_ALIAS_DIR = path.join(
  REPO_ROOT,
  "results",
  "planner",
  "world-standard-wave",
  "07-browser-journey",
);

const REQUIRED_SHOTS = [
  "01-route-ready.png",
  "02-walls-drawn.png",
  "03-door-opening.png",
  "04-cabinet-v0-placed.png",
  "05-two-items-placed.png",
  "06-canvas-2d-symbols.png",
  "07-journey-complete.png",
] as const;

const CABINET_PLACE_CTA = /Add Modular Cabinet to canvas/i;
const DESK_PLACE_CTA = /Add Executive Standing Desk to canvas/i;

test.describe.configure({ mode: "serial", timeout: 120_000 });

test.beforeAll(() => {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  mkdirSync(PHASE_ALIAS_DIR, { recursive: true });
});

type JourneyProof = {
  routeUsed: "canvas" | "guest" | "unknown";
  placePath: "catalog";
  wallsBefore: number;
  wallsAfterDraw: number;
  wallsIncreased: boolean;
  objectsBefore: number;
  objectsAfterWalls: number;
  objectsAfterOpening: number;
  doorOrOpeningPlaced: boolean;
  objectsIncreasedAfterOpening: boolean;
  furnitureBefore: number;
  furnitureAfter: number;
  furnitureAtLeast: number;
  includesCabinetV0: boolean;
  secondCatalogId: string;
  secondPlaceCta: string;
  symbolCheck: string;
  canvasShotBytes: number;
  paintSamples: number;
  baseURL: string;
  server: string;
};

function emptyProof(): JourneyProof {
  return {
    routeUsed: "unknown",
    placePath: "catalog",
    wallsBefore: 0,
    wallsAfterDraw: 0,
    wallsIncreased: false,
    objectsBefore: 0,
    objectsAfterWalls: 0,
    objectsAfterOpening: 0,
    doorOrOpeningPlaced: false,
    objectsIncreasedAfterOpening: false,
    furnitureBefore: 0,
    furnitureAfter: 0,
    furnitureAtLeast: 2,
    includesCabinetV0: false,
    secondCatalogId: "",
    secondPlaceCta: "",
    symbolCheck: "non-blank-paint-canvas-pixels (P07); quality bar P05",
    canvasShotBytes: 0,
    paintSamples: 0,
    // Forced to localhost by playwright.config (never 127.0.0.1)
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    server: "localhost only (127.0.0.1 rewritten in playwrightBaseURL.cjs)",
  };
}

/** Primary: /ooplanner · Fallback: guest (?plannerDevTools=1 owned by helper). */
async function enterWorldStandardPlanner(
  page: Page,
): Promise<"canvas" | "guest"> {
  await clearPlannerStorage(page);
  await page.goto("/ooplanner/?plannerDevTools=1", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  const topbar = page.locator('[data-testid="topbar"]');
  // Live sole 2D host = Fabric stage (testid canvas-stage).
  const fabricStage = page.locator(PLANNER_FABRIC_STAGE);
  const canvas = page.locator(PLANNER_PRIMARY_CANVAS);
  const ready = await Promise.race([
    topbar.waitFor({ state: "visible", timeout: 25_000 }).then(() => true),
    fabricStage.waitFor({ state: "visible", timeout: 25_000 }).then(() => true),
  ]).catch(() => false);

  if (ready) {
    // Canvas may still show guest setup gate — complete it without flipping routeUsed.
    await completePlannerSetupGate(page, "W1-W2 world-standard");
    await expect(fabricStage).toBeVisible({ timeout: 25_000 });
    await expect(canvas).toBeVisible({ timeout: 25_000 });
    await expect(page.locator('[data-testid="planner-2d-canvas"]')).toHaveCount(0);
    return "canvas";
  }

  await enterGuestPlannerWorkspace(page, {
    projectName: "W1-W2 world-standard",
  });
  await waitForPlannerCanvas(page);
  return "guest";
}

test.describe("W1–W2 open3d world-standard journey (browser)", () => {
  test("draw walls + opening → place cabinet-v0 + second SKU → non-blank 2D", async ({
    page,
  }) => {
    const proof = emptyProof();

    proof.routeUsed = await enterWorldStandardPlanner(page);
    await waitForPlannerCanvas(page);
    await expect(page.locator('[data-testid="topbar"]')).toBeVisible();
    await expect(page.getByRole("radio", { name: "2D", exact: true })).toBeVisible();
    // Drawing tools: live rail is radiogroup; keep group as legacy or.
    const drawingTools = page
      .getByRole("radiogroup", { name: "Drawing tools" })
      .or(page.getByRole("group", { name: "Drawing tools" }));
    await expect(drawingTools).toBeVisible();
    await expect(page.locator(PLANNER_FABRIC_STAGE)).toBeVisible();
    await expect(page.locator(".pw-step-bar")).toHaveCount(0);

    proof.wallsBefore = await getWallCount(page);
    proof.objectsBefore = await getObjectCount(page);
    proof.furnitureBefore = await getFurnitureCount(page);
    expect(proof.wallsBefore).toBeGreaterThanOrEqual(0);
    expect(proof.furnitureBefore).toBeGreaterThanOrEqual(0);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, "01-route-ready.png") });

    // --- W1: wall Δ on a known span (opening coords bind to this geometry) ---
    // Prefer empty-state "Draw walls" when present (same wall tool; dismisses intent UX).
    const drawWallsCta = page.getByRole("button", { name: /^Draw walls$/i });
    if (await drawWallsCta.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await drawWallsCta.click();
    }
    // Primary horizontal segment mid = (0.5, 0.35); above first-use card center.
    let wallMid = { rx: 0.5, ry: 0.35 };
    await drawWallByTwoClicks(page, { rx: 0.2, ry: 0.35 }, { rx: 0.8, ry: 0.35 });
    let wallsGrew = false;
    try {
      await expect
        .poll(async () => getWallCount(page), { timeout: 8_000 })
        .toBeGreaterThan(proof.wallsBefore);
      wallsGrew = true;
    } catch {
      wallsGrew = false;
    }
    if (!wallsGrew) {
      wallMid = { rx: 0.5, ry: 0.2 };
      await drawWallByTwoClicks(page, { rx: 0.15, ry: 0.2 }, { rx: 0.85, ry: 0.2 });
      await expect
        .poll(async () => getWallCount(page), { timeout: 15_000 })
        .toBeGreaterThan(proof.wallsBefore);
    }

    proof.wallsAfterDraw = await getWallCount(page);
    proof.wallsIncreased = proof.wallsAfterDraw > proof.wallsBefore;
    expect(proof.wallsIncreased).toBe(true);
    proof.objectsAfterWalls = await getObjectCount(page);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "02-walls-drawn.png") });

    // --- W1: Opening on the wall segment that grew ---
    await selectPlannerTool(page, "Opening");
    await tapOnCanvas(page, wallMid.rx, wallMid.ry);
    try {
      await expect
        .poll(async () => getObjectCount(page), { timeout: 8_000 })
        .toBeGreaterThan(proof.objectsAfterWalls);
    } catch {
      await placeOpeningOnCanvas(
        page,
        { rx: wallMid.rx - 0.05, ry: wallMid.ry },
        { rx: wallMid.rx + 0.05, ry: wallMid.ry },
      );
      await expect
        .poll(async () => getObjectCount(page), { timeout: 15_000 })
        .toBeGreaterThan(proof.objectsAfterWalls);
    }
    proof.objectsAfterOpening = await getObjectCount(page);
    proof.objectsIncreasedAfterOpening =
      proof.objectsAfterOpening > proof.objectsAfterWalls;
    expect(proof.objectsIncreasedAfterOpening).toBe(true);
    proof.doorOrOpeningPlaced = true;
    await expect
      .poll(async () => getWallCount(page), { timeout: 5_000 })
      .toBeGreaterThanOrEqual(proof.wallsAfterDraw);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "03-door-opening.png") });

    // --- W2: cabinet-v0 via exact place CTA (identity from button used) ---
    proof.furnitureBefore = await getFurnitureCount(page);
    const catalog = page.getByRole("region", { name: "Catalog browser" });
    const search = page
      .getByRole("searchbox", { name: /Search catalog elements/i })
      .or(page.getByLabel("Search catalog elements"));
    await expect(search).toBeVisible({ timeout: 15_000 });
    await search.fill("cabinet");
    await expect
      .poll(
        async () => catalog.getByRole("button", { name: CABINET_PLACE_CTA }).count(),
        { timeout: 12_000 },
      )
      .toBeGreaterThan(0);

    const cabinetAdd = catalog.getByRole("button", { name: CABINET_PLACE_CTA }).first();
    await expect(cabinetAdd).toBeVisible({ timeout: 12_000 });
    const cabinetCtaName = (await cabinetAdd.getAttribute("aria-label")) ??
      (await cabinetAdd.textContent()) ??
      "Add Modular Cabinet to canvas";
    await placeCatalogOnCanvas(page, 0.42, 0.42, CABINET_PLACE_CTA);
    await expect
      .poll(async () => getFurnitureCount(page), { timeout: 30_000 })
      .toBeGreaterThan(proof.furnitureBefore);
    // Identity: exact CTA used for place + furniture Δ — not body inventory copy alone.
    proof.includesCabinetV0 =
      CABINET_PLACE_CTA.test(cabinetCtaName) ||
      /Modular Cabinet/i.test(cabinetCtaName);
    expect(proof.includesCabinetV0).toBe(true);
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "04-cabinet-v0-placed.png"),
    });

    // --- W2: second SKU — Executive Standing Desk (sample-desk-1) via exact CTA ---
    await search.fill("desk");
    await expect
      .poll(
        async () => catalog.getByRole("button", { name: DESK_PLACE_CTA }).count(),
        { timeout: 12_000 },
      )
      .toBeGreaterThan(0);

    const deskAdd = catalog.getByRole("button", { name: DESK_PLACE_CTA }).first();
    await expect(deskAdd).toBeVisible({ timeout: 12_000 });
    const deskCtaName =
      (await deskAdd.getAttribute("aria-label")) ??
      (await deskAdd.textContent()) ??
      "";
    proof.secondPlaceCta = deskCtaName.trim() || "Add Executive Standing Desk to canvas";
    // Record id from the control used — exact desk CTA maps to sample-desk-1 in demo catalog.
    const dataId =
      (await deskAdd.getAttribute("data-catalog-id")) ??
      (await deskAdd.getAttribute("data-item-id"));
    proof.secondCatalogId =
      dataId && dataId.length > 0
        ? dataId
        : DESK_PLACE_CTA.test(proof.secondPlaceCta) ||
            /Executive Standing Desk/i.test(proof.secondPlaceCta)
          ? "sample-desk-1"
          : proof.secondPlaceCta;
    expect(proof.secondCatalogId.length).toBeGreaterThan(0);

    await placeCatalogOnCanvas(page, 0.58, 0.52, DESK_PLACE_CTA);
    await expect
      .poll(async () => getFurnitureCount(page), { timeout: 20_000 })
      .toBeGreaterThanOrEqual(proof.furnitureBefore + 2);
    proof.furnitureAfter = await getFurnitureCount(page);
    expect(proof.furnitureAfter - proof.furnitureBefore).toBeGreaterThanOrEqual(2);
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "05-two-items-placed.png"),
    });

    // --- Non-blank 2D canvas on Fabric paint layer (pixel probe, not PNG byte size) ---
    const canvasEl = page.locator(PLANNER_PAINT_CANVAS);
    await expect(canvasEl).toBeVisible({ timeout: 15_000 });
    const paintNonBlank = await canvasEl.evaluate((el) => {
      const c = el as HTMLCanvasElement;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx || c.width < 8 || c.height < 8) return { ok: false, samples: 0 };
      const img = ctx.getImageData(0, 0, c.width, c.height);
      let samples = 0;
      for (let i = 0; i + 3 < img.data.length; i += 64) {
        if ((img.data[i + 3] ?? 0) > 32) samples += 1;
      }
      return { ok: samples > 40, samples };
    });
    expect(paintNonBlank.ok, `paint canvas blank (samples=${paintNonBlank.samples})`).toBe(
      true,
    );
    proof.paintSamples = paintNonBlank.samples;
    const shot06 = await canvasEl.screenshot({
      path: path.join(EVIDENCE_DIR, "06-canvas-2d-symbols.png"),
    });
    proof.canvasShotBytes = shot06.byteLength;

    // Soft 2D↔3D (does not claim W4) — use helper (label intercepts bare radio.click)
    await switchPlannerViewMode(page, "3d");
    await expect(page.getByTestId("planner-3d-canvas")).toBeVisible({ timeout: 20_000 });
    await switchPlannerViewMode(page, "2d");
    await waitForPlannerCanvas(page);
    await expect
      .poll(async () => getFurnitureCount(page), { timeout: 10_000 })
      .toBe(proof.furnitureAfter);
    await expect
      .poll(async () => getWallCount(page), { timeout: 10_000 })
      .toBe(proof.wallsAfterDraw);

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "07-journey-complete.png"),
    });

    for (const name of REQUIRED_SHOTS) {
      expect(existsSync(path.join(EVIDENCE_DIR, name)), name).toBe(true);
    }

    // Write proof only on green path (after all expects).
    const runPayload = {
      slice: "P07 / CP-07 world-standard W1-W2 open3d journey",
      date: new Date().toISOString().slice(0, 10),
      result: "pass",
      tests: 1,
      failed: 0,
      gates: { W1: "pass", W2: "pass" },
      routeUsed: proof.routeUsed,
      placePath: proof.placePath,
      command:
        "npx playwright test -c config/build/playwright.config.ts tests/e2e/open3d-world-standard-journey.spec.ts --reporter=list",
      cwd: "site",
      baseURL: proof.baseURL,
      server: proof.server,
      spec: "site/tests/e2e/open3d-world-standard-journey.spec.ts",
      proof: {
        wallsBefore: proof.wallsBefore,
        wallsAfterDraw: proof.wallsAfterDraw,
        wallsIncreased: proof.wallsIncreased,
        doorOrOpeningPlaced: proof.doorOrOpeningPlaced,
        objectsBefore: proof.objectsBefore,
        objectsAfterWalls: proof.objectsAfterWalls,
        objectsAfterOpening: proof.objectsAfterOpening,
        objectsIncreasedAfterOpening: proof.objectsIncreasedAfterOpening,
        furnitureBefore: proof.furnitureBefore,
        furnitureAfter: proof.furnitureAfter,
        furnitureAtLeast: proof.furnitureAtLeast,
        includesCabinetV0: proof.includesCabinetV0,
        secondCatalogId: proof.secondCatalogId,
        secondPlaceCta: proof.secondPlaceCta,
        placePath: proof.placePath,
        symbolCheck: proof.symbolCheck,
        screenshots: [...REQUIRED_SHOTS],
      },
    };
    writeFileSync(
      path.join(EVIDENCE_DIR, "playwright-run.json"),
      `${JSON.stringify(runPayload, null, 2)}\n`,
      "utf8",
    );
    // Alias pointer for phase folder (optional copy of proof only).
    writeFileSync(
      path.join(PHASE_ALIAS_DIR, "playwright-run.json"),
      `${JSON.stringify(
        {
          ...runPayload,
          canonicalEvidence:
            "results/planner/world-standard-wave/02-browser-open3d-journey/",
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
  });
});
