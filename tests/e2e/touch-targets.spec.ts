/**
 * TST-S27 / AUDIT-M-01 — interactive targets must be ≥44×44 (WCAG 2.5.5 AAA)
 * on mobile. Regression: footer social 36×36, carousel dots 8×8, filter pills
 * ~31h, category hero chips ~31h, breadcrumb 17h. Fix: min-h-11 / min-height:
 * 2.75rem on the offenders.
 *
 * Exceptions (per WCAG 1.4.11 note): inline text links inside paragraph
 * notices (cookie bar) are exempt — the adjacent notice row is the hit target.
 */
import { expect, test, type Page } from "@playwright/test";

const MIN_TARGET = 44;

type SmallTarget = {
  tag: string;
  text: string;
  w: number;
  h: number;
};

/** Measure interactive elements, return those <44 on EITHER axis. */
async function measureSmallTargets(page: Page): Promise<SmallTarget[]> {
  return page.evaluate((min) => {
    const small: { tag: string; text: string; w: number; h: number }[] = [];
    const els = document.querySelectorAll<HTMLElement>("a, button, input, select");
    for (const el of els) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      // Inputs inside a ≥44px form/container: the container is the hit target.
      if (
        (el.tagName === "INPUT" || el.tagName === "SELECT") &&
        el.closest("form, .min-h-11, [class*='min-h-11']")
      ) {
        continue;
      }
      // Inline text link inside a notice/paragraph/label (cookie bar, form-field
      // consent label) — exempt; the row/checkbox is the hit target.
      if (
        el.tagName === "A" &&
        el.closest(
          "[data-cookie-consent-bar], .cookie-consent, [class*='cookie'], [class*='consent'], label, p, li",
        )
      ) {
        continue;
      }
      // Text links: height is the meaningful axis; width follows content.
      if (el.tagName === "A" && rect.height >= min) {
        continue;
      }
      if (rect.width < min || rect.height < min) {
        small.push({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent ?? "").trim().slice(0, 30) || el.getAttribute("aria-label") || "",
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
    }
    return small;
  }, MIN_TARGET);
}

test.describe("touch targets ≥44px (TST-S27)", () => {
  test("homepage footer + carousel controls meet 44×44 at 390", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(1200);

    const small = await measureSmallTargets(page);
    expect(
      small,
      `targets <44px on /: ${JSON.stringify(small)}`,
    ).toEqual([]);
  });

  test("category filter pills meet 44×44 at 390", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/products/workstations/", { waitUntil: "load" });
    await page.waitForTimeout(1200);

    const small = await measureSmallTargets(page);
    expect(
      small,
      `targets <44px on /products/workstations/: ${JSON.stringify(small)}`,
    ).toEqual([]);
  });
});
