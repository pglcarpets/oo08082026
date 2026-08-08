import { expect, test } from "@playwright/test";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import fs from "node:fs";
import path from "node:path";

test.describe("Planner Workspace Responsiveness", () => {
  const screenshotsDir = path.join(
    process.cwd(),
    "..",
    "results",
    "planner",
    "planner-responsiveness",
    "screenshots",
  );

  test.beforeAll(() => {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  });

  test("Check header layout and element visibility across viewports", async ({ page }) => {
    // 1. Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await enterGuestPlannerWorkspace(page);

    const topBar = page.locator('[data-testid="topbar"]');
    await expect(topBar).toBeVisible();

    // Verify Grid/Snap buttons are visible on desktop (restored to TopBar actions group)
    const gridBtn = page.getByRole("button", { name: /^(Enable|Disable) grid$/i });
    const snapBtn = page.getByRole("button", { name: /^(Enable|Disable) snap$/i });
    await expect(gridBtn).toBeVisible();
    await expect(snapBtn).toBeVisible();

    // Verify no horizontal overflow in header on desktop
    const desktopMetrics = await topBar.evaluate((el) => {
      const html = el as HTMLElement;
      return {
        scrollWidth: html.scrollWidth,
        clientWidth: html.clientWidth,
        offsetHeight: html.offsetHeight,
      };
    });
    expect(desktopMetrics.scrollWidth).toBeLessThanOrEqual(desktopMetrics.clientWidth);

    // Save screenshot
    await page.screenshot({ path: path.join(screenshotsDir, "desktop.png") });

    // 2. Tablet Viewport (< 48rem / 768px)
    await page.setViewportSize({ width: 700, height: 1024 });

    // Grid and Snap buttons should be hidden on small viewports (desktopOnly); use Prefs menu
    const prefsBtn = page.getByRole("button", { name: /Prefs — open preferences menu/i });
    await expect(gridBtn).toBeHidden({ timeout: 10_000 });
    await expect(snapBtn).toBeHidden({ timeout: 10_000 });
    await prefsBtn.click();
    await expect(page.getByRole("menuitem", { name: /Grid/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Snap/i })).toBeVisible();
    await page.keyboard.press("Escape");

    // Verify header does not overflow
    const tabletMetrics = await topBar.evaluate((el) => {
      const html = el as HTMLElement;
      return {
        scrollWidth: html.scrollWidth,
        clientWidth: html.clientWidth,
        offsetHeight: html.offsetHeight,
      };
    });
    expect(tabletMetrics.scrollWidth).toBeLessThanOrEqual(tabletMetrics.clientWidth);

    // Save screenshot
    await page.screenshot({ path: path.join(screenshotsDir, "tablet.png") });

    // 3. Mobile Viewport (< 48rem / 768px)
    await page.setViewportSize({ width: 375, height: 812 });

    // Grid/Snap should still be hidden
    await expect(gridBtn).toBeHidden({ timeout: 10_000 });
    await expect(snapBtn).toBeHidden({ timeout: 10_000 });

    // Verify header does not overflow
    const mobileMetrics = await topBar.evaluate((el) => {
      const html = el as HTMLElement;
      return {
        scrollWidth: html.scrollWidth,
        clientWidth: html.clientWidth,
        offsetHeight: html.offsetHeight,
      };
    });
    expect(mobileMetrics.scrollWidth).toBeLessThanOrEqual(mobileMetrics.clientWidth);

    // Save screenshot
    await page.screenshot({ path: path.join(screenshotsDir, "mobile.png") });
  });
});
