import { expect, test } from "@playwright/test";
import {
  assertMarketingStructure,
  prepareSiteUiCapture,
  SITE_UI_SCREENSHOT_OPTS,
} from "./site-ui-helpers";

test.describe("site visual regression — wave 1", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("homepage structure and snapshot", async ({ page }) => {
    await page.goto("/");
    await page.locator("#home-hero").waitFor({ state: "visible" });
    await prepareSiteUiCapture(page);
    await assertMarketingStructure(page);
    await expect(page).toHaveScreenshot("wave1-homepage.png", SITE_UI_SCREENSHOT_OPTS);
  });

  test("about structure and snapshot", async ({ page }) => {
    await page.goto("/about");
    await page.getByTestId("home-marketing-layout").waitFor({ state: "visible" });
    await prepareSiteUiCapture(page);
    await assertMarketingStructure(page);
    await expect(page).toHaveScreenshot("wave1-about.png", SITE_UI_SCREENSHOT_OPTS);
  });

  test("contact structure and snapshot", async ({ page }) => {
    await page.goto("/contact");
    await page.getByTestId("home-marketing-layout").waitFor({ state: "visible" });
    await prepareSiteUiCapture(page);
    await assertMarketingStructure(page);
    await expect(page).toHaveScreenshot("wave1-contact.png", SITE_UI_SCREENSHOT_OPTS);
  });

  test("solutions structure and snapshot", async ({ page }) => {
    await page.goto("/solutions");
    await page.getByTestId("home-marketing-layout").waitFor({ state: "visible" });
    await prepareSiteUiCapture(page);
    await assertMarketingStructure(page);
    await expect(page).toHaveScreenshot("wave2-solutions.png", SITE_UI_SCREENSHOT_OPTS);
  });

  test("products structure and snapshot", async ({ page }) => {
    await page.goto("/products");
    await page.getByTestId("home-marketing-layout").waitFor({ state: "visible" });
    await prepareSiteUiCapture(page);
    await assertMarketingStructure(page);
    await expect(page).toHaveScreenshot("wave2-products.png", SITE_UI_SCREENSHOT_OPTS);
  });

  test("quote-cart structure and snapshot", async ({ page }) => {
    await page.goto("/quote-cart");
    await page.getByTestId("home-marketing-layout").waitFor({ state: "visible" });
    await prepareSiteUiCapture(page);
    await assertMarketingStructure(page);
    await expect(page).toHaveScreenshot("wave2-quote-cart.png", SITE_UI_SCREENSHOT_OPTS);
  });
});
