/**
 * Factory C4 e2e — guest place multipath Linear Desk 1600 → BOQ name · SKU.
 *
 * C4 factory journey (Playwright e2e).
 * Run:
 *   pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/planner-c4-factory.spec.ts --reporter=list
 */
import { expect, test, type Page } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import { PLANNER_FABRIC_STAGE } from "./plannerCanvasHelpers";
import { warmDevRoute } from "./helpers/warmDevRoute";

const TARGET_SLUG = "oando-linear-desk-1600";
const TARGET_SKU = "OANDO-LINEAR-DSK-1600";
const TARGET_NAME = "Linear Desk 1600";

async function dismissOnboardingIfPresent(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: /Onboarding Guide/i });
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole("button", { name: /Skip onboarding/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 }).catch(() => undefined);
  }
}

async function openDesktopInventory(page: Page): Promise<void> {
  await dismissOnboardingIfPresent(page);

  const search = page.getByRole("searchbox", {
    name: /Search inventory by name or SKU/i,
  });
  if (await search.isVisible().catch(() => false)) return;

  const hint = page.getByTestId("open3d-guest-place-hint");
  if (await hint.isVisible().catch(() => false)) {
    await hint.click();
  }

  const placeWorkstation = page.getByRole("button", {
    name: /place a workstation from the library|Place workstation/i,
  });
  if (await placeWorkstation.isVisible().catch(() => false)) {
    // Prefer More → Inventory when first-use also arms ws-v0.
    const more = page.getByTestId("planner-more-actions");
    if (await more.isVisible().catch(() => false)) {
      await more.click();
      await page.getByRole("menuitem", { name: "Inventory", exact: true }).click();
    } else {
      await placeWorkstation.click();
    }
  }

  if (!(await search.isVisible().catch(() => false))) {
    await page.getByTestId("planner-more-actions").click();
    await page.getByRole("menuitem", { name: "Inventory", exact: true }).click();
  }

  await expect(search).toBeVisible({ timeout: 30_000 });
}

test.describe("Factory C4 — multipath desk BOQ identity", () => {
  test.describe.configure({ timeout: 240_000 });

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000);
    const warm = await browser.newPage();
    try {
      await warmDevRoute(warm, "/ooplanner/?plannerDevTools=1", {
        readySelector: PLANNER_FABRIC_STAGE,
        timeoutMs: 120_000,
      });
    } catch {
      // Cold compile / chunk races under parallel admin load — test body retries via enterGuest.
    } finally {
      await warm.close().catch(() => undefined);
    }
  });

  test("guest places Linear Desk 1600 and Quote shows name · SKU", async ({
    page,
  }) => {
    test.setTimeout(240_000);

    await enterGuestPlannerWorkspace(page, { projectName: "C4 factory e2e" });
    await openDesktopInventory(page);

    await expect(page.locator(`[data-slug="${TARGET_SLUG}"]`).first()).toBeVisible({
      timeout: 60_000,
    });

    const search = page.getByRole("searchbox", {
      name: /Search inventory by name or SKU/i,
    });
    await search.fill(TARGET_NAME);

    const place = page
      .getByRole("region", { name: "Catalog browser" })
      .getByRole("button", {
        name: new RegExp(`Place — Add ${TARGET_NAME} to canvas`, "i"),
      })
      .first();
    await expect(place).toBeVisible({ timeout: 30_000 });
    await place.click();

    await expect(page.getByText(/Click canvas to place/i).first()).toBeVisible({
      timeout: 15_000,
    });

    const stage = page.getByTestId("canvas-stage");
    const box = await stage.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width * 0.45, box!.y + box!.height * 0.45);

    await expect(page.getByText(/Placed/i).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole("button", { name: /Quote/i }).first().click();

    const boq = page.getByTestId("review-boq-lines");
    await expect(boq).toBeVisible({ timeout: 30_000 });
    await expect(boq).toContainText(TARGET_NAME);
    await expect(boq).toContainText(TARGET_SKU);
    await expect(boq).not.toContainText(/ws-v0-/i);
  });
});
