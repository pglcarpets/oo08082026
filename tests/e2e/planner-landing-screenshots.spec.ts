import path from "node:path";
import fs from "node:fs";
import { test, expect } from "@playwright/test";

/**
 * Throwaway capture spec: full-page screenshots of /planner at three
 * breakpoints for the landing "wow" review. Not part of any test gate.
 */
const VIEWPORTS = [
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1280x800", width: 1280, height: 800 },
] as const;

const OUT_DIR = path.resolve(process.cwd(), "results/screenshots/planner-landing-wow");

for (const vp of VIEWPORTS) {
  test(`planner landing screenshot ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/planner", { waitUntil: "networkidle" });

    // Let the hero demo loop assemble fully before capturing.
    await page.waitForTimeout(6500);

    // Scroll through the page so whileInView reveals fire, then return to top.
    await page.evaluate(async () => {
      const step = Math.max(window.innerHeight / 2, 200);
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 220));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(900);

    const outPath = path.join(OUT_DIR, `planner-${vp.name}.png`);
    await page.screenshot({
      path: outPath,
      fullPage: true,
    });
    expect(fs.existsSync(outPath)).toBe(true);
  });
}
