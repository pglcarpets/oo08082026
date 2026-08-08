import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Planner Shell 100dvh Layout constraints", () => {
  // Live hosts only; /planner/open3d is next.config 301 → canvas (not a separate shell)
  const routes = ["/ooplanner/"];
  
  test.beforeAll(() => {
    // Ensure the output directory exists for Phase 1 evidence
    const outputDir = path.resolve(process.cwd(), "results/site/phase1/ui-1");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  for (const route of routes) {
    test(`Route ${route} should enforce 100dvh and overflow hidden`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle", timeout: 30000 });
      
      // Wait for some shell elements to mount if present, but don't fail if they differ slightly
      await page.waitForTimeout(1000); 
      
      // Check body and html overflow styles
      const metrics = await page.evaluate(() => {
        return {
          htmlOverflow: window.getComputedStyle(document.documentElement).overflow,
          bodyOverflow: window.getComputedStyle(document.body).overflow,
          scrollHeight: document.body.scrollHeight,
          innerHeight: window.innerHeight,
        };
      });

      // Assertions to verify no scrolling at the root frame
      expect(metrics.htmlOverflow).toBe("hidden");
      expect(metrics.bodyOverflow).toBe("hidden");
      expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.innerHeight);

      // Save screenshot evidence
      const safeRouteName = route.replace(/\//g, "-").replace(/^-|-$/g, "");
      const outputDir = path.resolve(process.cwd(), "results/site/phase1/ui-1");
      const screenshotPath = path.join(outputDir, `100dvh-proof-${safeRouteName}.png`);
      
      await page.screenshot({ path: screenshotPath });
    });
  }
});
