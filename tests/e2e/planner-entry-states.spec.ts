import { expect, test } from "@playwright/test";

import {
  clearPlannerStorage,
  clearPlannerStorageInPage,
  completePlannerSetupGate,
  enterGuestPlannerWorkspace,
  getGuestPlannerStorageProjectId,
} from "./guestProjectSetup";
import {
  PLANNER_FABRIC_STAGE,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

const UUID_IN_URL =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

/**
 * P1 browser entry states (FINISH-PLAN exit gate):
 * - new: bare guest URL mints a UUID draft
 * - resume: ID URL keeps that draft identity
 * - malformed: bad id → 404
 * Two UUIDs stay independent (storage keys differ).
 */
test.describe("Planner P1 entry states", () => {
  test("new: bare /ooplanner/ redirects to a UUID-scoped draft", async ({
    page,
  }) => {
    await clearPlannerStorage(page);
    await page.goto("/ooplanner/", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page).toHaveURL(/\/ooplanner\/\?id=/);
    const id = new URL(page.url()).searchParams.get("id");
    expect(id).toMatch(UUID_IN_URL);

    await completePlannerSetupGate(page, "Entry New Draft");
    await waitForPlannerCanvas(page, { timeoutMs: 90_000 });
    await expect(page.locator(PLANNER_FABRIC_STAGE)).toBeVisible();
    expect(getGuestPlannerStorageProjectId(page)).toBe(`planner-guest-local:${id}`);
  });

  test("resume: same UUID URL keeps plan id after setup", async ({ page }) => {
    await enterGuestPlannerWorkspace(page, { projectName: "Entry Resume" });
    const firstId = new URL(page.url()).searchParams.get("id");
    expect(firstId).toMatch(UUID_IN_URL);

    await page.goto(`/ooplanner/?id=${firstId}&plannerDevTools=1`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await completePlannerSetupGate(page, "Entry Resume");
    await waitForPlannerCanvas(page, { timeoutMs: 90_000 });
    expect(new URL(page.url()).searchParams.get("id")).toBe(firstId);
  });

  test("malformed: invalid guest id returns 404", async ({ page }) => {
    await clearPlannerStorage(page);
    const response = await page.goto("/ooplanner/?id=not-a-uuid", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    expect(response?.status()).toBe(404);
    await expect(page.locator(PLANNER_FABRIC_STAGE)).toHaveCount(0);
  });

  test("new ×2: two guest UUIDs produce independent storage keys", async ({
    page,
  }) => {
    await clearPlannerStorageInPage(page).catch(() => undefined);
    await clearPlannerStorage(page);

    await page.goto("/ooplanner/?plannerDevTools=1", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page).toHaveURL(/id=/);
    const idA = new URL(page.url()).searchParams.get("id");
    expect(idA).toMatch(UUID_IN_URL);
    await completePlannerSetupGate(page, "Entry Draft A");
    await waitForPlannerCanvas(page, { timeoutMs: 90_000 });
    const keyA = getGuestPlannerStorageProjectId(page);

    // Fresh draft without wiping A's IndexedDB mid-flight: navigate bare again
    // after clearing only via a new context would be stronger; here we mint B
    // by going bare in the same browser after clearing storage once more would
    // erase A. Instead open a second UUID URL directly.
    const idB = crypto.randomUUID();
    await page.goto(`/ooplanner/?id=${idB}&plannerDevTools=1`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await completePlannerSetupGate(page, "Entry Draft B");
    await waitForPlannerCanvas(page, { timeoutMs: 90_000 });
    const keyB = getGuestPlannerStorageProjectId(page);

    expect(idA).not.toBe(idB);
    expect(keyA).toBe(`planner-guest-local:${idA}`);
    expect(keyB).toBe(`planner-guest-local:${idB}`);
    expect(keyA).not.toBe(keyB);
  });
});
