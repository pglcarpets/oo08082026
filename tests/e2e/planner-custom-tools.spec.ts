import { expect, test } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  clickOnCanvas,
  dragOnCanvas,
  expectObjectCountAtLeast,
  getObjectCount,
  getWallCount,
  plannerToolButton,
  selectPlannerTool,
  switchPlannerStep,
  placeOpeningOnCanvas,
  waitForPlannerCanvas,
  firstFurnitureCenter,
  clickAtPoint,
  placeCatalogOnCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 60_000 });

/** Live PLANNER_TOOLS in Planner.tsx — no Room / Furniture / Zone / Erase on the rail. */
const RAIL_TOOLS = [
  "Select",
  "Pan",
  "Wall",
  "Door",
  "Window",
  "Line",
  "Measure",
  "Text",
] as const;

test.describe("Planner custom tools — Playwright", () => {
  test.beforeEach(async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
  });

  test("tool rail exposes every live tool", async ({ page }) => {
    for (const tool of RAIL_TOOLS) {
      await expect(plannerToolButton(page, tool)).toBeVisible();
    }
  });

  test("Draw step defaults to Wall tool", async ({ page }) => {
    await expect(page.locator(".pw-step-bar")).toHaveAttribute("data-current", "draw");
    await expect(plannerToolButton(page, "Wall")).toHaveAttribute("aria-pressed", "true");
  });

  test("Wall tool creates a wall shape", async ({ page }) => {
    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.32, ry: 0.5 }, { rx: 0.68, ry: 0.5 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Wall tool supports dragging up and left", async ({ page }) => {
    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.65, ry: 0.62 }, { rx: 0.35, ry: 0.32 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Line tool creates a line shape", async ({ page }) => {
    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Line");
    await dragOnCanvas(page, { rx: 0.3, ry: 0.3 }, { rx: 0.6, ry: 0.55 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Text tool activates without breaking the canvas", async ({ page }) => {
    await selectPlannerTool(page, "Text");
    await expect(plannerToolButton(page, "Text")).toHaveAttribute("aria-pressed", "true");
    await waitForPlannerCanvas(page);
  });

  test("catalog item places furniture without a Furniture rail tool", async ({ page }) => {
    await switchPlannerStep(page, "Place");
    const before = await getObjectCount(page);
    await placeCatalogOnCanvas(page, 0.45, 0.42);
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Door tool places on an existing wall", async ({ page }) => {
    await switchPlannerStep(page, "Draw");
    const wallsBefore = await getWallCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.15, ry: 0.5 }, { rx: 0.85, ry: 0.5 });
    await expect.poll(async () => getWallCount(page), { timeout: 10_000 }).toBe(wallsBefore + 1);

    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Door");
    await placeOpeningOnCanvas(page, { rx: 0.5, ry: 0.5 }, { rx: 0.55, ry: 0.5 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Window tool places on an existing wall", async ({ page }) => {
    await switchPlannerStep(page, "Draw");
    const wallsBefore = await getWallCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.15, ry: 0.6 }, { rx: 0.85, ry: 0.6 });
    await expect.poll(async () => getWallCount(page), { timeout: 10_000 }).toBe(wallsBefore + 1);

    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Window");
    await placeOpeningOnCanvas(page, { rx: 0.5, ry: 0.6 }, { rx: 0.55, ry: 0.6 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Review step defaults to Measure and measurement works", async ({ page }) => {
    await switchPlannerStep(page, "Review");
    await expect(plannerToolButton(page, "Measure")).toHaveAttribute("aria-pressed", "true");

    const before = await getObjectCount(page);
    await dragOnCanvas(page, { rx: 0.2, ry: 0.2 }, { rx: 0.45, ry: 0.35 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Select tool selects a placed shape", async ({ page }) => {
    await switchPlannerStep(page, "Place");
    await placeCatalogOnCanvas(page, 0.45, 0.42);
    await expectObjectCountAtLeast(page, 1);

    await selectPlannerTool(page, "Select");
    const center = await firstFurnitureCenter(page);
    if (!center) throw new Error("No furniture object to select");
    await clickAtPoint(page, center);
    await expect(page.locator(".pwx-inspector")).not.toContainText("Nothing selected", {
      timeout: 10_000,
    });
  });

  test("Pan tool activates without breaking the canvas", async ({ page }) => {
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.15, ry: 0.4 }, { rx: 0.85, ry: 0.4 });
    const countAfterWall = await getObjectCount(page);

    await selectPlannerTool(page, "Pan");
    await dragOnCanvas(page, { rx: 0.5, ry: 0.5 }, { rx: 0.35, ry: 0.35 });
    await expect
      .poll(async () => getObjectCount(page), { timeout: 15_000 })
      .toBe(countAfterWall);
    await waitForPlannerCanvas(page);
  });
});
