/**
 * TST-S24 / AUDIT-SHOWROOMS-01 — /showrooms must not throw a hydration/DOM
 * mutation crash. Regression: GSAP ScrollTrigger ran before React's render
 * settled and removed a node out-of-band → `Cannot read properties of null
 * (reading 'removeChild')` ×2 page errors. Fix: gate the scroll reveal on
 * `motionReady` (same as ContactPageView) + clearProps.
 */
import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const EVIDENCE = path.join(
  process.cwd(),
  "..",
  "results",
  "showrooms",
  "console-clean",
);

const REMOVE_CHILD_RE = /removeChild/i;

type Monitors = {
  pageErrors: string[];
  consoleErrors: string[];
};

function attachMonitors(page: Page): Monitors {
  const monitors: Monitors = { pageErrors: [], consoleErrors: [] };
  page.on("pageerror", (err) => {
    monitors.pageErrors.push(String(err?.message ?? err));
  });
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      monitors.consoleErrors.push(msg.text());
    }
  });
  return monitors;
}

test.describe("showrooms runtime clean (TST-S24)", () => {
  test("no removeChild page error, no console errors", async ({ page }) => {
    fs.mkdirSync(EVIDENCE, { recursive: true });
    const monitors = attachMonitors(page);

    await page.goto("/showrooms", { waitUntil: "load" });
    // Let hero + scroll-reveal animations run.
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(EVIDENCE, "showrooms.png"),
      fullPage: true,
    });

    const report = {
      capturedAt: new Date().toISOString(),
      route: page.url(),
      pageErrors: monitors.pageErrors,
      consoleErrors: monitors.consoleErrors,
    };
    fs.mkdirSync(EVIDENCE, { recursive: true });
    fs.writeFileSync(
      path.join(EVIDENCE, "report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );

    expect(
      monitors.pageErrors,
      `pageerror on /showrooms must not contain removeChild: ${JSON.stringify(monitors.pageErrors)}`,
    ).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(REMOVE_CHILD_RE) as unknown as string,
      ]),
    );
    expect(monitors.pageErrors).toEqual([]);
    expect(
      monitors.consoleErrors,
      `console errors on /showrooms: ${JSON.stringify(monitors.consoleErrors)}`,
    ).toEqual([]);
  });
});
