import { expect, test } from "@playwright/test";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  getObjectCount,
  PLANNER_PRIMARY_CANVAS,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 60_000 });

test.describe("Planner onboarding — WS2", () => {
  test("ProjectSetupGate completion creates shell with objects", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    
    const count = await getObjectCount(page);
    expect(count).toBeGreaterThan(0);
  });

  test("Starting point generates room shell from metadata", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    
    const statusBar = page.locator(".pw-status-bar");
    const text = await statusBar.textContent();
    expect(text).toMatch(/\d+ objects/i);
    expect(text).toMatch(/Floor|Room/i);
  });

  test("Shell layout contains visible room boundary", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    
    const canvas = page.locator(PLANNER_PRIMARY_CANVAS);
    await expect(canvas).toBeVisible();
    
    const count = await getObjectCount(page);
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
