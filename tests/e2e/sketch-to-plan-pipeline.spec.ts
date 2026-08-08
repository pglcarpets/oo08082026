import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";

// Use process.cwd() for cross-platform fixture path resolution (CJS/ESM compatible)
const SKETCH_FIXTURE = path.join(process.cwd(), "tests", "e2e", "fixtures", "sketch-1x1.png");
const MINIMAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("sketch-to-plan pipeline", () => {
  // Keep a mid-width desktop viewport to match the planner catalog Playwright lane.
  test.use({ viewport: { width: 1100, height: 800 } });

  test.beforeAll(() => {
    fs.mkdirSync(path.dirname(SKETCH_FIXTURE), { recursive: true });
    if (!fs.existsSync(SKETCH_FIXTURE)) {
      fs.writeFileSync(SKETCH_FIXTURE, MINIMAL_PNG);
    }
  });
  test.beforeEach(async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
  });

  test("uploads a sketch image and reaches sketch recovery UI", async ({ page }) => {
    // Wait for the topbar to be fully loaded
    await expect(page.locator('[data-testid="topbar"]')).toBeVisible({ timeout: 20_000 });

    // Prefer sketch uploader; underlay also matches accept*=image.
    const fileInput = page
      .getByLabel(/Upload sketch for Sketch to plan/i)
      .or(page.locator('input[type="file"][accept*="image"]').first());
    await fileInput.setInputFiles(SKETCH_FIXTURE);

    await expect(
      page.getByText(/Sketch recovery|Converting sketch|Sketch kept as reference|Sketch conversion accepted/i),
    ).toBeVisible({ timeout: 45_000 });
  });
});
