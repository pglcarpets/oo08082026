import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Phase 3a audit correction (2026-08-02): `canvas-stage` is the live host
 * in `site/components/Planner/Planner.tsx`, wrapped around Fabric's own
 * `<canvas data-testid="planner-canvas" class="lower-canvas">` + generated
 * `canvas.upper-canvas` sibling (verified live via DOM probe).
 * Kept the old exported names so the ~30 existing specs importing them keep
 * compiling; only the selector strings changed to match the real DOM.
 */
export const PLANNER_FABRIC_STAGE = '[data-testid="canvas-stage"]';
/** Fabric mounts lower (pixels) + upper (events). Interact with upper. */
export const PLANNER_PRIMARY_CANVAS =
  '[data-testid="canvas-stage"] canvas.upper-canvas';
/** Painted scene for screenshots / pixel probes (lower canvas holds bitmap). */
export const PLANNER_PAINT_CANVAS =
  '[data-testid="canvas-stage"] canvas.lower-canvas';

/** TopBar view-mode radiogroup - product labels are literal "2D" / "3D" (role=radio). */
export const VIEW_MODE_RADIOGROUP_NAME = "View mode";
export const VIEW_MODE_2D_NAME = "2D";
export const VIEW_MODE_3D_NAME = "3D";

export type PlannerViewMode = "2d" | "3d";

/**
 * Locator for the TopBar 2D|3D radio, scoped to the View mode radiogroup.
 * Prefer this over bare getByRole("radio") or getByRole("button") (buttons are wrong - product uses role="radio").
 */
export function plannerViewModeRadio(
  page: Page,
  mode: PlannerViewMode,
): Locator {
  const name = mode === "2d" ? VIEW_MODE_2D_NAME : VIEW_MODE_3D_NAME;
  return page
    .getByRole("radiogroup", { name: VIEW_MODE_RADIOGROUP_NAME })
    .getByRole("radio", { name, exact: true });
}

/** Click 2D or 3D radio and wait until aria-checked sticks. */
export async function switchPlannerViewMode(
  page: Page,
  mode: PlannerViewMode,
): Promise<void> {
  const radio = plannerViewModeRadio(page, mode);
  await expect(radio).toBeVisible({ timeout: 15_000 });
  // React Aria: visible label intercepts pointer events over the input.
  // Prefer label click; fall back to force on the radio.
  const label = page
    .getByRole("radiogroup", { name: VIEW_MODE_RADIOGROUP_NAME })
    .locator("label")
    .filter({ has: radio });
  if ((await label.count()) > 0) {
    await label.first().click();
  } else {
    await radio.click({ force: true });
  }
  await expect(radio).toBeChecked({ timeout: 10_000 });
}


async function primaryCanvas(page: Page): Promise<Locator> {
  return page.locator(PLANNER_PRIMARY_CANVAS);
}

/**
 * Keep Fabric upper-canvas in the viewport before measuring hit targets.
 * A tall shell + scrollIntoView on the tool rail used to shove the stage to
 * negative Y so wall drags hit nothing and walls stayed at seed (4).
 */
/** Guest inventory can show "Loading catalog…" — wait before search/filter. */
export async function waitForPlannerCatalogReady(
  page: Page,
  timeoutMs = 60_000,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const loading = await page
          .getByText(/Loading catalog/i)
          .isVisible()
          .catch(() => false);
        return !loading;
      },
      { timeout: timeoutMs },
    )
    .toBe(true);
}

/** On 375px tier, slide-over panels block canvas hits — dismiss before placement. */
export async function dismissMobilePlannerPanels(page: Page): Promise<void> {
  const inventoryToggle = page.getByRole("button", {
    name: /Toggle inventory panel/i,
  });
  const propertiesToggle = page.getByRole("button", {
    name: /Toggle properties panel/i,
  });

  for (const toggle of [inventoryToggle, propertiesToggle]) {
    if (!(await toggle.isVisible().catch(() => false))) continue;
    if ((await toggle.getAttribute("aria-pressed").catch(() => null)) === "true") {
      await toggle.evaluate((el: HTMLElement) => {
        el.click();
      });
      await expect(toggle)
        .toHaveAttribute("aria-pressed", "false", { timeout: 3_000 })
        .catch(() => undefined);
    }
  }

  const leftPanel = page.locator('#panel-left[data-open="true"]');
  if (await leftPanel.isVisible().catch(() => false)) {
    if (await inventoryToggle.isVisible().catch(() => false)) {
      await inventoryToggle.evaluate((el: HTMLElement) => {
        el.click();
      });
      await expect(leftPanel)
        .toBeHidden({ timeout: 3_000 })
        .catch(() => undefined);
    }
  }

  const backdrop = page.getByRole("button", { name: "Dismiss side panel" });
  if (await backdrop.isVisible().catch(() => false)) {
    // Backdrop sits under panel chrome — DOM click avoids hit-target interception.
    await backdrop.evaluate((el: HTMLElement) => {
      el.click();
    });
    await expect(backdrop)
      .toBeHidden({ timeout: 3_000 })
      .catch(() => undefined);
  }
}

export async function ensurePlannerCanvasOnScreen(page: Page): Promise<void> {
  const stage = page.locator(PLANNER_FABRIC_STAGE);
  await expect(stage).toBeVisible({ timeout: 25_000 });
  await stage.evaluate((el) => {
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
    // Prefer restoring a scrollable ancestor over window when body is locked.
    let node: HTMLElement | null = el.parentElement;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      const oy = style.overflowY;
      if (
        (oy === "auto" || oy === "scroll" || oy === "overlay") &&
        node.scrollHeight > node.clientHeight + 1
      ) {
        // Keep stage top inside this scroller when possible.
        const nodeRect = node.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        if (elRect.top < nodeRect.top) {
          node.scrollTop += elRect.top - nodeRect.top;
        }
      }
      node = node.parentElement;
    }
    if (window.scrollY !== 0) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
  });
}

async function canvasBox(page: Page) {
  await ensurePlannerCanvasOnScreen(page);
  const canvas = await primaryCanvas(page);
  await expect(canvas).toBeVisible({ timeout: 25_000 });
  let box = await canvas.boundingBox();
  if (!box) throw new Error("Planner canvas bounding box not found");
  // If still mostly off-screen, pin stage and remeasure once.
  const viewportH = page.viewportSize()?.height ?? 900;
  if (box.y + box.height * 0.2 < 0 || box.y > viewportH - 40) {
    await page.locator(PLANNER_FABRIC_STAGE).evaluate((el) => {
      el.scrollIntoView({ block: "center", inline: "nearest" });
    });
    box = await canvas.boundingBox();
    if (!box) throw new Error("Planner canvas bounding box not found after scroll");
  }
  return { canvas, box };
}

export async function waitForPlannerCanvas(
  page: Page,
  options: { timeoutMs?: number } = {},
): Promise<void> {
  const timeout =
    options.timeoutMs ??
    (process.env.OPEN3D_WORLD_GATE === "1" ? 90_000 : 25_000);
  await expect(page.locator(PLANNER_PRIMARY_CANVAS)).toBeVisible({ timeout });
  await ensurePlannerCanvasOnScreen(page);
}

function plannerToolNamePattern(toolName: string): RegExp {
  const escaped = toolName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(?: \\(|$)`);
}

export function plannerToolButton(page: Page, toolName: string): Locator {
  const pattern = plannerToolNamePattern(toolName);
  // Live CanvasToolRail: role=toolbar "Canvas tools" (also legacy navigation).
  const canvasTools = page
    .getByRole("toolbar", { name: "Canvas tools" })
    .or(page.getByRole("navigation", { name: "Canvas tools" }));
  const radio = canvasTools.getByRole("radio", { name: pattern });
  const plannerButton = canvasTools.getByRole("button", { name: pattern });
  const drawingGroup = page
    .getByRole("group", { name: "Drawing tools" })
    .getByRole("radio", { name: pattern })
    .or(
      page.getByRole("group", { name: "Drawing tools" }).getByRole("button", { name: pattern }),
    );
  return radio.or(plannerButton).or(drawingGroup);
}

export async function canvasPoint(
  page: Page,
  relX: number,
  relY: number,
): Promise<{ x: number; y: number }> {
  const { box } = await canvasBox(page);
  return {
    x: box.x + box.width * relX,
    y: box.y + box.height * relY,
  };
}

/** Tap without drift — door/window tools finish on pointer up at the wall. */
export async function tapOnCanvas(page: Page, relX: number, relY: number): Promise<void> {
  const point = await canvasPoint(page, relX, relY);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.waitForTimeout(120);
  await page.mouse.up();
}

/** Press and drag slightly along a wall to complete door/window placement. */
export async function placeOpeningOnCanvas(
  page: Page,
  from: { rx: number; ry: number },
  to: { rx: number; ry: number },
): Promise<void> {
  const start = await canvasPoint(page, from.rx, from.ry);
  const end = await canvasPoint(page, to.rx, to.ry);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.move(end.x, end.y, { steps: 4 });
  await page.waitForTimeout(80);
  await page.mouse.up();
}

/** Pointer down → slight move → up so canvas receives move + down/up (furniture needs this). */
export async function clickOnCanvas(page: Page, relX: number, relY: number): Promise<void> {
  const point = await canvasPoint(page, relX, relY);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 2, point.y + 2, { steps: 2 });
  await page.mouse.up();
}

export async function dragOnCanvas(
  page: Page,
  from: { rx: number; ry: number },
  to: { rx: number; ry: number },
): Promise<void> {
  const start = await canvasPoint(page, from.rx, from.ry);
  const end = await canvasPoint(page, to.rx, to.ry);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 16 });
  await page.mouse.up();
}

/**
 * Arm a Drawing-tools rail button and wait until aria-pressed sticks.
 * Scoped to the tools group (avoids matching unrelated "Select" chrome).
 * Retries once if the first click is intercepted / React state drops.
 */
export async function selectPlannerTool(page: Page, toolName: string): Promise<void> {
  const button = plannerToolButton(page, toolName);
  await expect(button).toBeVisible({ timeout: 15_000 });
  // Do NOT scrollIntoViewIfNeeded on the rail — a blown stage height centers
  // tools below the fold; scrolling them into view shoves the Fabric stage
  // above the viewport and wall drags miss (walls stay at seed).
  // Radios use aria-checked; legacy buttons use aria-pressed.
  const role = await button.getAttribute("role");
  const isRadio = role === "radio";
  const armed = isRadio
    ? (await button.getAttribute("aria-checked")) === "true" ||
      (await button.isChecked().catch(() => false))
    : (await button.getAttribute("aria-pressed")) === "true";
  if (!armed) {
    // force: skip actionability scroll that would kick the stage off-screen.
    await button.click({ force: true });
    try {
      if (isRadio) {
        await expect(button).toBeChecked({ timeout: 2_000 });
      } else {
        await expect(button).toHaveAttribute("aria-pressed", "true", {
          timeout: 2_000,
        });
      }
    } catch {
      // Retry via DOM click so status-bar / sticky chrome intercepts cannot block.
      await button.evaluate((el: HTMLElement) => {
        el.click();
      });
      if (isRadio) {
        await expect(button).toBeChecked({ timeout: 5_000 });
      } else {
        await expect(button).toHaveAttribute("aria-pressed", "true", {
          timeout: 5_000,
        });
      }
    }
  }
  await waitForPlannerCanvas(page);
}

type LivePlannerFloor = {
  id: string;
  walls?: unknown[];
  furniture?: unknown[];
  openings?: unknown[];
  zones?: unknown[];
  dimensions?: unknown[];
};

type LivePlannerProject = {
  activeFloorId?: string;
  floors?: LivePlannerFloor[];
};

/** Guest chrome hides the object census — read live project when status bar has no count. */
export async function getObjectCount(page: Page): Promise<number> {
  const bar = page.locator(".pw-status-bar");
  if (await bar.isVisible().catch(() => false)) {
    const span = bar.locator("span").filter({ hasText: /\d+\s+objects/i }).first();
    if (await span.isVisible().catch(() => false)) {
      const text = await span.textContent();
      const match = text?.match(/(\d+)\s+objects/i);
      if (match) return Number.parseInt(match[1], 10);
    }
    const barText = await bar.innerText().catch(() => "");
    const m = barText.match(/(\d+)\s+objects/i);
    if (m) return Number.parseInt(m[1], 10);
  }
  return page.evaluate(() => {
    const project = (window as unknown as { __plannerLiveProject?: LivePlannerProject })
      .__plannerLiveProject;
    const floor =
      project?.floors?.find((candidate) => candidate.id === project.activeFloorId) ??
      project?.floors?.[0];
    if (!floor) return 0;
    return (
      (floor.walls?.length ?? 0) +
      (floor.furniture?.length ?? 0) +
      (floor.openings?.length ?? 0) +
      (floor.zones?.length ?? 0) +
      (floor.dimensions?.length ?? 0)
    );
  });
}

export async function getWallCount(page: Page): Promise<number> {
  const bar = page.locator(".pw-status-bar");
  if (await bar.isVisible().catch(() => false)) {
    const span = bar.locator("span").filter({ hasText: /\d+\s+walls/i }).first();
    if (await span.isVisible().catch(() => false)) {
      const text = await span.textContent();
      const match = text?.match(/(\d+)\s+walls/i);
      if (match) return Number.parseInt(match[1], 10);
    }
  }
  return page.evaluate(() => {
    const project = (window as unknown as { __plannerLiveProject?: LivePlannerProject })
      .__plannerLiveProject;
    const floor =
      project?.floors?.find((candidate) => candidate.id === project.activeFloorId) ??
      project?.floors?.[0];
    return floor?.walls?.length ?? 0;
  });
}

/** Default plan grid spacing (mm) — matches snapDrawingPoint / fabricStageGridOverlay. */
export const PLANNER_GRID_MM = 100;

export type LiveWallSegment = {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
};

/** Read committed wall segments from the live open3d project (Playwright webdriver hook). */
export async function readLiveWalls(page: Page): Promise<LiveWallSegment[]> {
  return page.evaluate(() => {
    const project = (
      window as unknown as {
        __plannerLiveProject?: {
          activeFloorId?: string;
          floors?: Array<{
            id: string;
            walls?: Array<{
              id: string;
              start: { x: number; y: number };
              end: { x: number; y: number };
            }>;
          }>;
        };
      }
    ).__plannerLiveProject;
    if (!project?.floors?.length) return [];
    const floor =
      project.floors.find((f) => f.id === project.activeFloorId) ??
      project.floors[0];
    return (floor.walls ?? []).map((wall) => ({
      id: wall.id,
      start: wall.start,
      end: wall.end,
    }));
  });
}

export function isOnGridMm(value: number, gridMm = PLANNER_GRID_MM): boolean {
  const mod = Math.abs(value % gridMm);
  return mod < 0.5 || mod > gridMm - 0.5;
}

export function wallEndpointsOnGrid(
  walls: readonly LiveWallSegment[],
  gridMm = PLANNER_GRID_MM,
): boolean {
  for (const wall of walls) {
    if (
      !isOnGridMm(wall.start.x, gridMm) ||
      !isOnGridMm(wall.start.y, gridMm) ||
      !isOnGridMm(wall.end.x, gridMm) ||
      !isOnGridMm(wall.end.y, gridMm)
    ) {
      return false;
    }
  }
  return true;
}

export function hasFreehandEndpoint(
  walls: readonly LiveWallSegment[],
  gridMm = PLANNER_GRID_MM,
): boolean {
  for (const wall of walls) {
    const coords = [wall.start.x, wall.start.y, wall.end.x, wall.end.y];
    if (coords.some((value) => !isOnGridMm(value, gridMm))) {
      return true;
    }
  }
  return false;
}

export async function setPlannerSnapEnabled(
  page: Page,
  enabled: boolean,
): Promise<void> {
  const stage = page.locator(PLANNER_FABRIC_STAGE);
  const current = await stage.getAttribute("data-snap-enabled");
  const isOn = current === "true";
  if (isOn === enabled) return;
  await page.getByRole("button", { name: "Prefs — open preferences menu" }).click();
  await page
    .getByRole("menuitem", { name: new RegExp(`Toggle snap \\(${enabled ? "on" : "off"}\\)`, "i") })
    .click();
  await expect(stage).toHaveAttribute(
    "data-snap-enabled",
    enabled ? "true" : "false",
  );
}

/**
 * Furniture metric — status bar first (signed-in), then live project (guest hides census).
 */
export async function getFurnitureCount(page: Page): Promise<number> {
  const bar = page.locator(".pw-status-bar");
  if (await bar.isVisible().catch(() => false)) {
    const span = bar
      .locator("span")
      .filter({ hasText: /\d+\s+furniture/i })
      .first();
    if (await span.isVisible().catch(() => false)) {
      const text = await span.textContent();
      const match = text?.match(/(\d+)\s+furniture/i);
      if (match) return Number.parseInt(match[1], 10);
    }
    const barText = await bar.innerText().catch(() => "");
    const m = barText.match(/(\d+)\s+furniture/i);
    if (m) return Number.parseInt(m[1], 10);
  }
  return page.evaluate(() => {
    const project = (
      window as unknown as {
        __plannerLiveProject?: {
          activeFloorId?: string;
          floors?: Array<{ id: string; furniture?: unknown[] }>;
        };
      }
    ).__plannerLiveProject;
    const floor =
      project?.floors?.find((candidate) => candidate.id === project.activeFloorId) ??
      project?.floors?.[0];
    return floor?.furniture?.length ?? 0;
  });
}

/**
 * Open3d Fabric wall tool: press at start → drag → release at end.
 * Live host commits on pointerup when length ≥ 10mm (not two independent taps).
 * Re-measures canvas after arming so coords are never from an off-screen box.
 */
export async function drawWallByTwoClicks(
  page: Page,
  from: { rx: number; ry: number },
  to: { rx: number; ry: number },
): Promise<void> {
  await selectPlannerTool(page, "Wall");
  await ensurePlannerCanvasOnScreen(page);
  await dragOnCanvas(page, from, to);
  await page.waitForTimeout(200);
}

export async function expectObjectCountAtLeast(page: Page, min: number): Promise<void> {
  await expect
    .poll(async () => getObjectCount(page), { timeout: 15_000 })
    .toBeGreaterThanOrEqual(min);
}

export async function setToolVisibilityMode(
  page: Page,
  mode: "Balanced" | "Step-focused" | "All tools",
): Promise<void> {
  const select = page.locator("#planner-tool-visibility-mode");
  await expect(select).toBeVisible({ timeout: 10_000 });
  await select.selectOption({ label: mode });
  await expect(select).toHaveValue(
    mode === "Balanced" ? "balanced" : mode === "Step-focused" ? "step" : "all",
  );
  await page.waitForTimeout(150);
}

export async function switchPlannerStep(page: Page, stepLabel: "Draw" | "Place" | "Review"): Promise<void> {
  const stepId = stepLabel.toLowerCase();
  const stepButton = page.locator(`.pw-step-bar__btn[data-step="${stepId}"]`);
  await expect(stepButton).toBeVisible({ timeout: 15_000 });
  await stepButton.click();
  await expect(page.locator(".pw-step-bar")).toHaveAttribute("data-current", stepId);
  await waitForPlannerCanvas(page);
  await page.waitForTimeout(250);
}

type FabricObjectHandle = {
  getCenterPoint?: () => { x: number; y: number };
  left?: number;
  top?: number;
  name?: string;
  get?: (key: string) => unknown;
  plannerEntityType?: unknown;
};
type FabricViewHandle = {
  getActiveObject?: () => FabricObjectHandle | undefined;
  getObjects?: () => FabricObjectHandle[];
  viewportTransform?: number[] | null;
  lowerCanvasEl?: HTMLElement;
};

/**
 * Read the screen (page) coordinates of the first furniture object on the
 * live Fabric stage. Uses `plannerEntityType === "furniture"` (not archive name
 * prefixes). Requires `window.__plannerFabricView` from PlannerFabricStage.
 */
export async function firstFurnitureCenter(
  page: Page,
): Promise<{ x: number; y: number } | null> {
  // Prefer visible upper canvas rect — lower can report a blown layout box.
  await page.locator(PLANNER_FABRIC_STAGE).evaluate((el) => {
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
  const point = await page.evaluate(() => {
    const w = (window as unknown as { __plannerFabricView?: FabricViewHandle })
      .__plannerFabricView;
    if (!w) return null;
    const objs = w.getObjects?.() ?? [];
    const entityType = (o: FabricObjectHandle): string | null => {
      if (typeof o.get === "function") {
        const viaGet = o.get("plannerEntityType");
        if (typeof viaGet === "string") return viaGet;
      }
      return typeof o.plannerEntityType === "string" ? o.plannerEntityType : null;
    };
    const target =
      objs.find((o) => entityType(o) === "furniture") ??
      (() => {
        const active = w.getActiveObject?.();
        return active && entityType(active) === "furniture" ? active : undefined;
      })();
    if (!target) return null;
    const center =
      typeof target.getCenterPoint === "function"
        ? target.getCenterPoint()
        : { x: target.left ?? 0, y: target.top ?? 0 };
    const vt = w.viewportTransform ?? [1, 0, 0, 1, 0, 0];
    const px = center.x * vt[0] + center.y * vt[2] + vt[4];
    const py = center.x * vt[1] + center.y * vt[3] + vt[5];
    const host = document.querySelector(
      '[data-testid="canvas-stage"]',
    ) as HTMLElement | null;
    const upper = document.querySelector(
      '[data-testid="canvas-stage"] canvas.upper-canvas',
    ) as HTMLElement | null;
    const el = upper ?? w.lowerCanvasEl ?? host;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    // Map fabric coords into the *visible* box (clamp if layout still tall).
    const x = rect.left + Math.min(Math.max(px, 4), Math.max(4, rect.width - 4));
    const y = rect.top + Math.min(Math.max(py, 4), Math.max(4, rect.height - 4));
    // If rect is mostly off-screen, use viewport-safe Y on the visible strip.
    const safeY =
      y < 0
        ? Math.min(window.innerHeight - 8, Math.max(8, rect.bottom - 40))
        : y > window.innerHeight
          ? Math.max(8, rect.top + 40)
          : y;
    const safeX =
      x < 0
        ? Math.min(window.innerWidth - 8, Math.max(8, rect.left + 40))
        : x > window.innerWidth
          ? Math.max(8, rect.right - 40)
          : x;
    return { x: safeX, y: safeY };
  });
  return point;
}

/**
 * Arm catalog placement ("Add … to canvas") then wait for Place tool pressed.
 * Status bar / sticky inventory chrome intercepts Playwright hit-tests — use a
 * DOM el.click() so React handlers fire without relying on hit-testing.
 * Catalog arms via React state; waiting for aria-pressed avoids racing canvas click
 * (workstation batch path uses a ref and does not need this).
 */
export async function clickCatalogAddToCanvas(
  page: Page,
  name: RegExp | string = /Add .* to canvas/i,
): Promise<Locator> {
  const catalog = page.getByRole("region", { name: "Catalog browser" });
  const btn = catalog.getByRole("button", { name }).first();
  await expect(btn).toBeVisible({ timeout: 15_000 });
  await btn.scrollIntoViewIfNeeded();
  await btn.evaluate((el: HTMLElement) => {
    el.click();
  });
  const placeTool = plannerToolButton(page, "Place");
  // Retry once if React arm did not stick (virtual list re-render / intercept).
  try {
    await expect(placeTool).toBeChecked({ timeout: 2_000 });
  } catch {
    try {
      await expect(placeTool).toHaveAttribute("aria-pressed", "true", {
        timeout: 500,
      });
    } catch {
      await btn.evaluate((el: HTMLElement) => {
        el.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
          }),
        );
      });
      try {
        await expect(placeTool).toBeChecked({ timeout: 8_000 });
      } catch {
        await expect(placeTool).toHaveAttribute("aria-pressed", "true", {
          timeout: 8_000,
        });
      }
    }
  }
  return btn;
}

/** Catalog add (armed) + canvas click — open3d inventory place path. */
export async function placeCatalogOnCanvas(
  page: Page,
  relX: number,
  relY: number,
  name: RegExp | string = /Add .* to canvas/i,
): Promise<void> {
  await clickCatalogAddToCanvas(page, name);
  // Small settle so placement tool + pendingCatalogItemId commit.
  await page.waitForTimeout(150);
  await clickOnCanvas(page, relX, relY);
}

/**
 * Proven systems-v0 place path (W4 / batch-place): immediate furniture delta,
 * no catalog + canvas race.
 * Inventory collapses configurator by default (catalog-first) — expand if needed.
 */
export async function placeSeatsFromConfigurator(
  page: Page,
  seats: 2 | 4 | 10 = 4,
): Promise<void> {
  // Left panel may open on AI Assist; configurator lives under Library.
  const libraryTab = page
    .getByRole("tablist", { name: "Left panel" })
    .getByRole("tab", { name: /^Library$/i });
  if (await libraryTab.isVisible().catch(() => false)) {
    const selected = await libraryTab.getAttribute("aria-selected");
    if (selected !== "true") {
      await libraryTab.click();
    }
  }

  const configurator = page.getByRole("region", {
    name: "Workstation systems configurator",
  });
  await expect(configurator).toBeVisible({ timeout: 15_000 });

  const placeBtn = configurator.getByRole("button", {
    name: `Place ${seats} seats`,
  });
  // defaultOpen={false} on InventoryPanel — Place N seats only after expand.
  if (!(await placeBtn.isVisible().catch(() => false))) {
    await configurator
      .getByRole("button", { name: /Systems configurator/i })
      .click();
    await expect(placeBtn).toBeVisible({ timeout: 10_000 });
  }
  await placeBtn.click();
}

/**
 * Place armed catalog item — retries alternate canvas coords when mobile layout
 * eats the first tap (inventory overlay, scroll, status chrome).
 */
export async function placeArmedCatalogOnCanvas(
  page: Page,
  options: {
    beforeCount?: number;
    points?: Array<{ rx: number; ry: number }>;
    furnitureTimeoutMs?: number;
  } = {},
): Promise<void> {
  const before =
    options.beforeCount ?? (await getFurnitureCount(page));
  const target = before + 1;
  const points = options.points ?? [
    { rx: 0.52, ry: 0.48 },
    { rx: 0.62, ry: 0.55 },
    { rx: 0.45, ry: 0.42 },
  ];
  const furnitureTimeoutMs = options.furnitureTimeoutMs ?? 35_000;
  const deadline = Date.now() + furnitureTimeoutMs;

  for (const point of points) {
    if (Date.now() > deadline) break;
    await dismissMobilePlannerPanels(page);
    await ensurePlannerCanvasOnScreen(page);
    await clickOnCanvas(page, point.rx, point.ry);
    const placed = await expect
      .poll(async () => getFurnitureCount(page), {
        timeout: 1_500,
        intervals: [100, 200, 400],
      })
      .toBeGreaterThanOrEqual(target)
      .then(() => true)
      .catch(() => false);
    if (placed) return;
  }

  await expect
    .poll(async () => getFurnitureCount(page), {
      timeout: Math.max(5_000, deadline - Date.now()),
    })
    .toBeGreaterThanOrEqual(target);
}

/** Click at absolute page coordinates (down + micro-move + up). */
export async function clickAtPoint(
  page: Page,
  p: { x: number; y: number },
): Promise<void> {
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(p.x + 2, p.y + 2, { steps: 2 });
  await page.mouse.up();
}

/** Tap at absolute page coordinates (down + up, no drift). */
export async function tapAtPoint(
  page: Page,
  p: { x: number; y: number },
): Promise<void> {
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.waitForTimeout(120);
  await page.mouse.up();
}
