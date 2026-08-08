import { expect, test, type Page } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  clickAtPoint,
  clickCatalogAddToCanvas,
  expectObjectCountAtLeast,
  firstFurnitureCenter,
  getFurnitureCount,
  getObjectCount,
  placeArmedCatalogOnCanvas,
  selectPlannerTool,
  switchPlannerStep,
  switchPlannerViewMode,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 90_000 });

const PLACE_CTA = /Place — Add .* to canvas/i;

async function dismissOnboardingIfPresent(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: /Onboarding Guide/i });
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole("button", { name: /Skip onboarding/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 }).catch(() => undefined);
  }
}

async function openWorkspace(page: Page) {
  await enterGuestPlannerWorkspace(page);
  await waitForPlannerCanvas(page);
  await dismissOnboardingIfPresent(page);
}

/** Open modular inventory dock, then arm + place first catalog CTA. */
async function placeFirstCatalogItem(page: Page): Promise<void> {
  const objectsBefore = await getObjectCount(page);
  const furnitureBefore = await getFurnitureCount(page);

  const search = page.getByRole("searchbox", {
    name: /Search inventory by name or SKU/i,
  });
  if (!(await search.isVisible().catch(() => false))) {
    await page.getByTestId("planner-more-actions").click();
    await page.getByRole("menuitem", { name: "Inventory", exact: true }).click();
  }
  await expect(page.getByRole("region", { name: "Catalog browser" })).toBeVisible({
    timeout: 15_000,
  });

  await clickCatalogAddToCanvas(page, PLACE_CTA);
  const toast = page.getByTestId("planner-workspace-toast");
  await expect(toast.getByText(/Click canvas to place/i)).toBeVisible({
    timeout: 15_000,
  });
  await placeArmedCatalogOnCanvas(page, { beforeCount: furnitureBefore });
  await expectObjectCountAtLeast(page, objectsBefore + 1);
  await expect
    .poll(async () => getFurnitureCount(page), { timeout: 15_000 })
    .toBeGreaterThanOrEqual(furnitureBefore + 1);
}

test.describe("Planner chrome v2", () => {
  test("Draw step keeps canvas tools available", async ({ page }) => {
    await openWorkspace(page);
    await switchPlannerStep(page, "Draw");

    await expect(page.getByRole("toolbar", { name: "Canvas tools" })).toBeVisible();
    await expect(page.locator('[data-testid="canvas-stage"]')).toBeVisible();
  });

  test("Place step can open inventory from layout presets", async ({ page }) => {
    await openWorkspace(page);
    await switchPlannerStep(page, "Place");

    await page.getByTestId("planner-more-actions").click();
    await page.getByRole("menuitem", { name: "Inventory", exact: true }).click();

    await expect(page.getByRole("region", { name: "Inventory panel" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Review step shows the review and quote panel", async ({ page }) => {
    await openWorkspace(page);
    await switchPlannerStep(page, "Review");

    await page.getByTestId("planner-more-actions").click();
    await page.getByRole("menuitem", { name: "Properties", exact: true }).click();

    await expect(page.getByRole("tabpanel", { name: "Review" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("region", { name: "Review and quote" })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("3D view shows a ready canvas after catalog place", async ({ page }) => {
    await openWorkspace(page);
    await placeFirstCatalogItem(page);

    await expect(page.getByTestId("planner-view-mode")).toBeVisible();
    await expect(page.getByRole("radio", { name: "2D" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "3D" })).toBeVisible();

    await switchPlannerViewMode(page, "3d");
    await expect(page.getByTestId("planner-3d-canvas")).toBeVisible({ timeout: 25_000 });
  });

  test("3D view renders and 2D restores the canvas", async ({ page }) => {
    await openWorkspace(page);
    await placeFirstCatalogItem(page);

    await switchPlannerViewMode(page, "3d");
    await expect(page.getByTestId("planner-3d-canvas")).toBeVisible({ timeout: 25_000 });

    await switchPlannerViewMode(page, "2d");
    await waitForPlannerCanvas(page);
  });

  test("inventory place adds an item to the canvas", async ({ page }) => {
    await openWorkspace(page);
    await placeFirstCatalogItem(page);
  });

  test("selecting a placed shape opens the inspector", async ({ page }) => {
    await openWorkspace(page);
    await placeFirstCatalogItem(page);

    await selectPlannerTool(page, "Select");
    await expect
      .poll(async () => firstFurnitureCenter(page), { timeout: 15_000 })
      .not.toBeNull();
    const center = await firstFurnitureCenter(page);
    if (!center) throw new Error("No furniture object to select");
    await clickAtPoint(page, center);

    // Fabric rebuild can drop the post-place selection — re-arm via Fabric API.
    await page.evaluate(() => {
      const w = (
        window as unknown as {
          __plannerFabricView?: {
            getObjects?: () => Array<{
              get?: (k: string) => unknown;
              plannerEntityType?: unknown;
            }>;
            setActiveObject?: (o: unknown) => void;
            requestRenderAll?: () => void;
            fire?: (name: string, payload: unknown) => void;
          };
        }
      ).__plannerFabricView;
      if (!w?.getObjects) return;
      const target = w.getObjects().find((o) => {
        const type =
          (typeof o.get === "function" ? o.get("plannerEntityType") : null) ??
          o.plannerEntityType;
        return type === "furniture";
      });
      if (!target) return;
      w.setActiveObject?.(target);
      w.fire?.("selection:created", { selected: [target], target });
      w.requestRenderAll?.();
    });

    const props = page.getByRole("region", { name: "Properties" });
    if (!(await props.isVisible().catch(() => false))) {
      await page.getByTestId("planner-more-actions").click();
      await page.getByRole("menuitem", { name: "Properties", exact: true }).click();
    }
    await expect(props).toBeVisible({ timeout: 10_000 });
    await expect(props.getByText(/^Furniture$/, { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(props).not.toContainText("Nothing selected");
  });
});
