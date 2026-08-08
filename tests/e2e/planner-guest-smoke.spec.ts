/**
 * R3 — Guest Playwright smoke (optional / isolated).
 *
 * Soft-skips when BASE_URL is unset or the target server is unreachable.
 * Not on the release:gate Playwright list (audit-gate-skips allows skip here).
 *
 * Run:
 *   pnpm --filter oando-site exec playwright test -c config/build/playwright.config.ts tests/e2e/planner-guest-smoke.spec.ts
 */
import { expect, test } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";

const envBaseURL =
  process.env.PLAYWRIGHT_BASE_URL?.trim() ||
  process.env.BASE_URL?.trim() ||
  "";

test.describe("Planner guest smoke (R3)", () => {
  test("guest loads topbar, first-use, or help control", async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(120_000);
    const targetBase = (baseURL ?? envBaseURL).trim();
    test.skip(!targetBase, "No BASE_URL / PLAYWRIGHT_BASE_URL — skip guest smoke");

    try {
      const probe = await request.get("/", {
        timeout: 8_000,
        failOnStatusCode: false,
      });
      test.skip(
        probe.status() === 0 || probe.status() >= 500,
        `Server down (status ${probe.status()}) — skip guest smoke`,
      );
    } catch {
      test.skip(true, "Server down / unreachable — skip guest smoke");
    }

    // Uses enterGuestPlannerWorkspace: races topbar/fabric/setup (guest auto-skip OK).
    await enterGuestPlannerWorkspace(page, { projectName: "R3 guest smoke" });

    const shellControl = page.locator(
      [
        '[data-testid="planner-topbar"]',
        '[data-testid="planner-first-use"]',
        '[data-testid="planner-toggle-help"]',
        '[data-testid="planner-toggle-help-desktop"]',
      ].join(", "),
    );
    await expect(shellControl.first()).toBeVisible({ timeout: 45_000 });
  });
});
