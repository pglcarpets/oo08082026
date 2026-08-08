import { expect, test } from "@playwright/test";

test.describe("Admin P05 price book journey", () => {
  test.beforeEach(async () => {
    const { resetDefaultPriceBookSeed } = await import(
      "@/features/admin/pricing/priceBookAdmin.server"
    );
    resetDefaultPriceBookSeed();
  });

  test("draft → approve → activate → rollback in admin UI", async ({ page }) => {
    page.on("dialog", (dialog) => {
      void dialog.accept();
    });

    await page.goto("/admin/price-books", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/price-books/);
    await expect(page.getByRole("heading", { name: "Price books" })).toBeVisible();

    await expect(page.locator("code", { hasText: "pb-linear-2026-q3" })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByText("draft").first()).toBeVisible();

    await page.getByTestId("admin-price-book-reason").fill("e2e commercial journey");
    await page.getByRole("button", { name: "Approve draft" }).click();
    await expect(page.getByText("approve complete", { exact: false })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByTestId("admin-price-book-lifecycle-list").getByText("approved", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Activate/i }).click();
    await expect(page.getByText("activate complete", { exact: false })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByTestId("admin-price-book-lifecycle-list").getByText("active", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Rollback" }).click();
    await expect(page.getByText("rollback complete", { exact: false })).toBeVisible({
      timeout: 15_000,
    });
  });
});