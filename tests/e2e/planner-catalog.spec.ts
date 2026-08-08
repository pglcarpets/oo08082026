import { expect, test, type Page } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import { PLANNER_FABRIC_STAGE } from "./plannerCanvasHelpers";
import { warmDevRoute } from "./helpers/warmDevRoute";

async function dismissOnboardingIfPresent(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: /Onboarding Guide/i });
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole("button", { name: /Skip onboarding/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 }).catch(() => undefined);
  }
}

/** Desktop modular dock closes inventory by default — open via layout presets menu. */
async function openDesktopInventory(page: Page): Promise<void> {
  await dismissOnboardingIfPresent(page);

  const search = page.getByRole("searchbox", {
    name: /Search inventory by name or SKU/i,
  });
  if (await search.isVisible().catch(() => false)) return;

  const placeWorkstation = page.getByRole("button", {
    name: /place a workstation from the library|Place workstation/i,
  });
  if (await placeWorkstation.isVisible().catch(() => false)) {
    await placeWorkstation.click();
  }

  if (!(await search.isVisible().catch(() => false))) {
    await page.getByTestId("planner-more-actions").click();
    await page.getByRole("menuitem", { name: "Inventory", exact: true }).click();
  }

  await expect(search).toBeVisible({ timeout: 30_000 });
}

test.describe("planner catalog panel", () => {
  // Cold dev route: the guest planner's client chunks only compile once a
  // browser requests them, which can race the manifest write.
  test.beforeAll(async ({ browser }) => {
    const warm = await browser.newPage();
    try {
      await warmDevRoute(warm, "/ooplanner/?plannerDevTools=1", {
        readySelector: PLANNER_FABRIC_STAGE,
        timeoutMs: 90_000,
      });
    } finally {
      await warm.close();
    }
  });

  test("desktop rail, catalog, and canvas do not overlap", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await openDesktopInventory(page);

    // Modular desktop: CanvasToolRail | dock inventory | fabric stage
    const rail = page.locator(".pw-tool-rail");
    const catalog = page.getByRole("region", { name: "Inventory panel" });
    const canvas = page.locator('[data-testid="canvas-stage"]');

    await expect(rail).toBeVisible();
    await expect(catalog).toBeVisible();
    await expect(canvas).toBeVisible();

    const railBox = await rail.boundingBox();
    const catalogBox = await catalog.boundingBox();
    const canvasBox = await canvas.boundingBox();

    expect(railBox).not.toBeNull();
    expect(catalogBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();

    expect(railBox!.x + railBox!.width).toBeLessThanOrEqual(catalogBox!.x + 4);
    expect(catalogBox!.x + catalogBox!.width).toBeLessThanOrEqual(canvasBox!.x + 4);
  });

  test("guest workspace exposes searchable catalog", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await openDesktopInventory(page);

    await expect(page.locator("[data-catalog-item]").first()).toBeVisible({
      timeout: 15_000,
    });

    const search = page.getByRole("searchbox", {
      name: /Search inventory by name or SKU/i,
    });
    await search.fill("meeting");

    await expect(
      page
        .getByRole("region", { name: "Catalog browser" })
        .getByRole("button", { name: /Place — Add .* to canvas/i })
        .first(),
    ).toBeVisible({
      timeout: 15_000,
    });
  });
});
