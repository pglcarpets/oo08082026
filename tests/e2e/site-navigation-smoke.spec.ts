import { expect, test } from "@playwright/test";

const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());

test.describe("site navigation smoke", () => {
  test("homepage loads with hero and progress dots", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#home-hero")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Spaces that work/i);
    await expect(page.getByText(/Pan-India/i)).toBeVisible();

    const secondDot = page.getByRole("button", { name: "Show project image 2" });
    await secondDot.click();
    await expect(secondDot).toHaveAttribute("aria-current", "true");
  });

  test("homepage hero exposes products CTA and trusted-by glass proof", async ({
    page,
  }) => {
    await page.goto("/");

    const browseProducts = page.getByRole("link", { name: /Browse products/i }).first();
    await expect(browseProducts).toBeVisible();
    await expect(browseProducts).toHaveAttribute("href", /\/products\/?/);

    const glassProof = page.getByRole("link", { name: /View clients/i });
    await expect(glassProof).toBeVisible();
    await expect(glassProof).toHaveAttribute("href", /\/trusted-by\/?$/);
    await expect(glassProof).toContainText(/Trusted by/i);
    await expect(glassProof).toContainText(/120\+/i);
  });

  test("homepage shows Final0704-inspired sections", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Browse/i })).toBeVisible();
    await expect(page.getByTestId("kpi-client-organisations")).toBeVisible();
    await expect(page.getByTestId("kpi-locations-served")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Recent/i })).toContainText(
      /installs/i,
    );
    await expect(page.getByTestId("home-partnership")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Design your workspace/i })).toBeVisible();
    await expect(page.locator("a.home-tool-card", { hasText: /Oando Planner/i })).toBeVisible();
    await expect(page.getByLabel(/example 10 by 8 metre office floor plan/i)).toBeVisible();
    await expect(page.getByTestId("home-tools-floorplan")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /We engineer workspaces/i }),
    ).toBeVisible();

    const briefForm = page.getByRole("form", { name: "Project brief enquiry" });
    await expect(briefForm).toBeVisible();
    await expect(briefForm.getByRole("button", { name: /Send Brief/i })).toBeVisible();
    await expect(briefForm.getByLabel("Name")).toBeVisible();
    await expect(briefForm.getByLabel("City")).toBeVisible();
    await expect(briefForm.getByLabel("Phone")).toBeVisible();
    await expect(briefForm.getByLabel("Email")).toBeVisible();
    await expect(briefForm.locator("#contact-teaser-brief")).toBeVisible();
  });

  test("/planning service page loads with workflow section", async ({ page }) => {
    await page.goto("/planning");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Planning Service/i);
    await expect(page.getByRole("heading", { name: /From intent to implementation-ready plans/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Request planning call/i }).first()).toBeVisible();
  });

  test("/products catalog loads with first category card visible", async ({ page }) => {
    if (!hasSupabaseEnv) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL required for gate Playwright");
    }
    await page.goto("/products", { waitUntil: "domcontentloaded", timeout: 60_000 });

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Built to\s*Perform/i);
    await expect(
      page.getByRole("heading", { level: 2, name: /Specification-led guidance/i }),
    ).toBeVisible();

    // Scope to category cards — header Products is also `/products/` and has no h3.
    const firstCategoryCard = page.locator("main a.home-collection-card[href^='/products/']").first();
    await expect(firstCategoryCard).toBeVisible();
    await expect(firstCategoryCard.getByRole("heading", { level: 3 })).toBeVisible();
  });

  test("/quote-cart loads with hero title and compare action", async ({ page }) => {
    await page.goto("/quote-cart");

    await expect(page.getByTestId("home-marketing-layout")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: /Quote cart built for procurement follow-through/i })).toBeVisible();
    await expect(page.getByText(/Your quote cart is empty/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Browse products/i }).first()).toBeVisible();
  });

  test("/compare loads with single page title and section heading", async ({ page }) => {
    await page.goto("/compare");

    await expect(page.getByTestId("home-marketing-layout")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: /Compare selected workspace options/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /Specification review/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: /Compare selected workspace options/i })).toHaveCount(1);
  });

  test("desktop header All Products link reaches /products", async ({ page }) => {
    if (!hasSupabaseEnv) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL required for gate Playwright");
    }
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.locator("#home-hero").waitFor({ state: "visible" });

    await page.getByRole("button", { name: "Products" }).hover();
    const megaMenu = page.locator("#products-mega-menu");
    await megaMenu.waitFor({ state: "visible", timeout: 10_000 });
    await megaMenu.getByRole("link", { name: "All Products >" }).click();

    await expect(page).toHaveURL(/\/products\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Built to\s*Perform/i);
  });

  test("mobile drawer opens and All Products closes drawer on /products", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.locator("#home-hero").waitFor({ state: "visible" });

    await page.getByRole("button", { name: "Open menu" }).click();
    const mobileNav = page.getByRole("navigation", { name: "Mobile primary navigation" });
    await mobileNav.waitFor({ state: "visible", timeout: 10_000 });

    await mobileNav.getByRole("button", { name: "Products" }).click();
    const allProducts = mobileNav.getByRole("link", { name: "All Products", exact: true });
    await allProducts.waitFor({ state: "visible", timeout: 10_000 });
    await allProducts.click();

    await page.waitForURL(/\/products\/?$/, { timeout: 15_000 });
    await expect(mobileNav).toBeHidden();
  });
});
