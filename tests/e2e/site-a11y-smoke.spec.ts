import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Site public-surface accessibility smoke (SITE-A11Y-01 partial coverage).
 * Mirrors the planner marketing a11y spec but targets the public `(site)` routes
 * classified as indexable in `features/site/data/routeClassification.ts`.
 *
 * Run against a running dev server:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test -c config/build/playwright.config.ts tests/e2e/site-a11y-smoke.spec.ts
 */
const ROUTES = [
  "/",
  "/products",
  "/products/workstations",
  "/products/seating",
  "/solutions",
  "/contact",
  "/about",
  "/planning",
  "/planner",
  "/downloads/",
];

for (const route of ROUTES) {
  test(`${route} has no critical or serious accessibility violations`, async ({ page }) => {
    const response = await page.goto(route);
    // Accept 200/307/308 (redirects) — do not fail the a11y gate on transport.
    expect(response?.status()).toBeLessThan(400);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const blocking = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(blocking).toEqual([]);
  });
}
