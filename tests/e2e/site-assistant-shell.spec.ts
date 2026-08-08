import { expect, test } from "@playwright/test";

test.describe("site assistant shell", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: "oando_cookie_consent",
        value: "accepted",
        domain: "localhost",
        path: "/",
        sameSite: "Lax",
      },
    ]);
  });

  test("homepage exposes AI chatbot launcher and panel", async ({ page }) => {
    await page.goto("/");
    await page.locator("#home-hero").waitFor({ state: "visible" });

    await page.getByRole("button", { name: "Open AI chatbot" }).click();
    await expect(page.getByRole("dialog", { name: "AI chatbot" })).toBeVisible();
    await expect(page.getByLabel("Assistant conversation")).toBeVisible();
  });

  test("products catalog page loads category grid links", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("heading", { level: 1, name: /Built to\s*Perform/i }).waitFor();
    await expect(page.locator('a[href^="/products/"]').first()).toBeVisible({ timeout: 20_000 });
  });
});
