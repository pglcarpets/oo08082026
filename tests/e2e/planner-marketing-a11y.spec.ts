import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = [
  "/planner/features/",
  "/planner/features/measure/",
  "/planner/help/",
];

for (const route of ROUTES) {
  test(`${route} has no critical or serious accessibility violations`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const blocking = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(blocking).toEqual([]);
  });
}
