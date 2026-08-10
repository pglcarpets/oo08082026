import { expect, test } from "@playwright/test";
import { prepareSiteUiCapture } from "./site-ui-helpers";

const HI_ABOUT_HERO = "वन एंड ओनली के बारे में";
const EN_ABOUT_HERO = "About One&Only";

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

    await expect(page.getByRole("heading", { level: 1 })).toContainText(HI_ABOUT_HERO);
    await expect(page.getByRole("heading", { level: 1 })).not.toContainText(EN_ABOUT_HERO);
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

    const hero = page.getByRole("heading", { level: 1 });
    await expect(hero).toContainText(HI_ABOUT_HERO);
    await expect(hero).not.toContainText(EN_ABOUT_HERO);
    expect(pageErrors).toEqual([]);
  });
});
