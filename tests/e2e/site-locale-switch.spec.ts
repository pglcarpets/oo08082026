import { expect, test } from "@playwright/test";
import { prepareSiteUiCapture } from "./site-ui-helpers";

const HI_ABOUT_SUBTITLE = "हम व्यावहारिक, टिकाऊ और स्केलेबल वर्कस्पेस सिस्टम डिज़ाइन और डिलीवर करते हैं।";
const EN_ABOUT_SUBTITLE = "We plan, supply, and install workplaces teams use every day.";

test.describe("site locale switch — wave 1", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("about page renders Hindi copy when NEXT_LOCALE=hi", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "NEXT_LOCALE",
        value: "hi",
        domain: "localhost",
        path: "/",
        sameSite: "Lax",
      },
    ]);

    await page.goto("/about");
    await page.getByTestId("home-marketing-layout").waitFor({ state: "visible" });
    await prepareSiteUiCapture(page);

    await expect(page.locator(".about-hero__subtitle")).toContainText(HI_ABOUT_SUBTITLE);
    await expect(page.locator(".about-hero__subtitle")).not.toContainText(EN_ABOUT_SUBTITLE);
  });

  test("footer locale switcher changes about hero to Hindi without a page crash", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/about");
    await page.getByTestId("home-marketing-layout").waitFor({ state: "visible" });

    const switcher = page.locator("#locale-switcher");
    await switcher.scrollIntoViewIfNeeded();
    await switcher.selectOption("hi");
    await expect(page).toHaveURL(/\/about\/?$/);
    await page.getByTestId("home-marketing-layout").waitFor({ state: "visible" });
    await prepareSiteUiCapture(page);

    await expect(page.locator(".about-hero__subtitle")).toContainText(HI_ABOUT_SUBTITLE);
    await expect(page.locator(".about-hero__subtitle")).not.toContainText(EN_ABOUT_SUBTITLE);
    expect(pageErrors).toEqual([]);
  });
});
