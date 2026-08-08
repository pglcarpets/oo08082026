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
  setToolVisibilityMode,
  switchPlannerStep,
  placeOpeningOnCanvas,
  waitForPlannerCanvas,
  firstFurnitureCenter,
  clickAtPoint,
  tapAtPoint,
} from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 60_000 });

const RAIL_TOOLS = [
  "Select",
  "Pan",
  "Wall",
  "Room",
  "Door",
  "Window",
  "Furniture",
  "Zone",
  "Measure",
  "Erase",
] as const;

test.describe("Planner custom tools — Playwright", () => {
  test.beforeEach(async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
  });

  test("tool rail exposes every custom tool", async ({ page }) => {
    for (const tool of RAIL_TOOLS) {
      await expect(plannerToolButton(page, tool)).toBeVisible();
    }
  });

  test("Draw step defaults to Wall tool", async ({ page }) => {
    await expect(page.locator(".pw-step-bar")).toHaveAttribute("data-current", "draw");
    await expect(plannerToolButton(page, "Wall")).toHaveAttribute("aria-pressed", "true");
  });

  test("Wall tool creates a wall shape", async ({ page }) => {
    expect(page).toBeDefined();
    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.32, ry: 0.5 }, { rx: 0.68, ry: 0.5 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Wall tool supports dragging up and left", async ({ page }) => {
    expect(page).toBeDefined();
    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.65, ry: 0.62 }, { rx: 0.35, ry: 0.32 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Room tool supports dragging up and left", async ({ page }) => {
    expect(page).toBeDefined();
    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Room");
    await dragOnCanvas(page, { rx: 0.7, ry: 0.7 }, { rx: 0.4, ry: 0.4 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Room tool creates a room shape", async ({ page }) => {
    expect(page).toBeDefined();
    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Room");
    await dragOnCanvas(page, { rx: 0.25, ry: 0.3 }, { rx: 0.55, ry: 0.55 });
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Furniture tool places catalog item on canvas", async ({ page }) => {
    expect(page).toBeDefined();
    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Furniture");
    await page
      .getByRole("region", { name: "Catalog browser" })
      .getByRole("button", { name: /Add .* to canvas/i })
      .first()
      .click();
    await clickOnCanvas(page, 0.45, 0.42);
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("Place step defaults to Furniture and placement works", async ({ page }) => {
    await switchPlannerStep(page, "Place");
    await expect(plannerToolButton(page, "Furniture")).toHaveAttribute("aria-pressed", "true");

    const before = await getObjectCount(page);
    await page
      .getByRole("region", { name: "Catalog browser" })
      .getByRole("button", { name: /Add .* to canvas/i })
      .first()
      .click();
    await clickOnCanvas(page, 0.45, 0.42);
    await expectObjectCountAtLeast(page, before + 1);
  });

  test("catalog item click activates furniture placement", async ({ page }) => {
    await switchPlannerStep(page, "Place");
    const before = await getObjectCount(page);
    const catalogItem = page
      .getByRole("region", { name: "Catalog browser" })
      .getByRole("button", { name: /Add .* to canvas/i })
      .first();
    await expect(catalogItem).toBeVisible({ timeout: 15_000 });
    await catalogItem.click();
    await expect(plannerToolButton(page, "Furniture")).toHaveAttribute("aria-pressed", "true");
    await clickOnCanvas(page, 0.5, 0.48);
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

  test("Zone tool creates a zone shape", async ({ page }) => {
    expect(page).toBeDefined();
    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Zone");
    await dragOnCanvas(page, { rx: 0.58, ry: 0.28 }, { rx: 0.78, ry: 0.48 });
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
    await selectPlannerTool(page, "Furniture");
    await page
      .getByRole("region", { name: "Catalog browser" })
      .getByRole("button", { name: /Add .* to canvas/i })
      .first()
      .click();
    await clickOnCanvas(page, 0.45, 0.42);
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
    expect(page).toBeDefined();
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

  test("tool visibility dropdown filters the rail in step-focused mode", async ({ page }) => {
    const devSelect = page.locator("#planner-tool-visibility-mode");
    await expect(devSelect).toBeVisible();
    await setToolVisibilityMode(page, "Step-focused");
    await expect(plannerToolButton(page, "Wall")).toBeVisible();
    await expect(plannerToolButton(page, "Furniture")).toHaveCount(0);
    await expect(plannerToolButton(page, "Measure")).toHaveCount(0);

    await setToolVisibilityMode(page, "All tools");
    await expect(plannerToolButton(page, "Furniture")).toBeVisible();
    await expect(plannerToolButton(page, "Measure")).toBeVisible();
  });

  test("Erase tool removes a shape", async ({ page }) => {
    expect(page).toBeDefined();
    await selectPlannerTool(page, "Furniture");
    await page
      .getByRole("region", { name: "Catalog browser" })
      .getByRole("button", { name: /Add .* to canvas/i })
      .first()
      .click();
    await clickOnCanvas(page, 0.45, 0.42);
    const afterPlace = await getObjectCount(page);
    expect(afterPlace).toBeGreaterThan(0);

    await selectPlannerTool(page, "Erase");
    const center = await firstFurnitureCenter(page);
    if (!center) throw new Error("No furniture object to erase");
    await tapAtPoint(page, center);
    await expect.poll(async () => getObjectCount(page), { timeout: 15_000 }).toBe(afterPlace - 1);
  });
});
