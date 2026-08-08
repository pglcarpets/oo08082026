import { expect, test, type Page } from "@playwright/test";

const SCREENSHOT_OPTS = {
  maxDiffPixelRatio: 0.02,
  animations: "disabled" as const,
};

async function prepareDesignKitCapture(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => document.fonts.ready);
  await page.getByTestId("design-kit-page").waitFor({ state: "visible" });
}

test.describe("design kit visual regression", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("site benchmark snapshot", async ({ page }) => {
    await page.goto("/admin/design-kit#site");
    await prepareDesignKitCapture(page);
    const section = page.getByTestId("design-kit-site");
    await expect(section).toBeVisible();
    await expect(section).toHaveScreenshot("design-kit-site-materials.png", SCREENSHOT_OPTS);
  });

  test("site surfaces and product buttons snapshot", async ({ page }) => {
    await page.goto("/admin/design-kit#site-surfaces");
    await prepareDesignKitCapture(page);
    await expect(page.getByTestId("design-kit-site-surfaces")).toBeVisible();
    await page.locator("#product-forms").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("design-kit-buttons")).toBeVisible();
    const block = page.getByTestId("design-kit-site-surfaces");
    await expect(block).toHaveScreenshot("design-kit-site-surfaces.png", SCREENSHOT_OPTS);
  });

  test("full page snapshot", async ({ page }) => {
    await page.goto("/admin/design-kit");
    await prepareDesignKitCapture(page);
    await expect(page.getByTestId("design-kit-page")).toBeVisible();
    await expect(page).toHaveScreenshot("design-kit-full.png", {
      ...SCREENSHOT_OPTS,
      fullPage: true,
    });
  });
});
