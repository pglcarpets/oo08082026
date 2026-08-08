/**
 * Planner AI Assist drawer — the advisor surface the PNG-cutover program keeps
 * (lock L8: Mastra / LanceDB / Orama).
 *
 * Proves the drawer is actually mounted in the workspace and that all three
 * modes expose their primary control. Provider calls are not made here: the
 * retrieval layer is unit-tested (`tests/unit/lib/ai/mastra/catalogRetrieval.test.ts`)
 * and a live LLM answer needs provider keys.
 */

import { expect, test, type Locator } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";

test.describe("Planner AI Assist", () => {
  test.describe.configure({ timeout: 300_000 });

  test("drawer opens and every advisor mode exposes its primary control", async ({
    page,
  }) => {
    /** Sticky planner chrome can cover controls; keyboard activation is exact. */
    const activate = async (locator: Locator) => {
      await locator.scrollIntoViewIfNeeded();
      await locator.focus();
      await page.keyboard.press("Enter");
    };

    // Warm the planner chunks before the helper's own 60s budget.
    await page.goto("/ooplanner/?plannerDevTools=1", {
      waitUntil: "domcontentloaded",
      timeout: 180_000,
    });
    await page
      .getByTestId("canvas-stage")
      .waitFor({ state: "visible", timeout: 240_000 })
      .catch(() => undefined);

    await enterGuestPlannerWorkspace(page);

    await activate(page.getByRole("button", { name: /AI assist/i }).first());

    const drawer = page.getByRole("region", { name: "AI Assist" });
    await expect(drawer).toBeVisible({ timeout: 30_000 });
    await expect(drawer.getByRole("tab")).toHaveText(["Suggest", "Match", "Chat"]);

    await activate(drawer.getByRole("tab", { name: /Chat/i }));
    await expect(
      drawer.getByRole("textbox", { name: /Chat message input/i }),
    ).toBeVisible();
    await expect(drawer.getByRole("button", { name: /Send message/i })).toBeVisible();

    await activate(drawer.getByRole("tab", { name: /Match/i }));
    await expect(drawer.getByRole("button", { name: /Match catalog/i })).toBeVisible();

    await activate(drawer.getByRole("tab", { name: /Suggest/i }));
    await expect(drawer.getByRole("button", { name: /Suggest layout/i })).toBeVisible();
    await expect(drawer.getByLabel("Seat count")).toBeVisible();
    await expect(drawer.getByLabel("Room purpose")).toBeVisible();
    await expect(drawer.getByLabel("Floor area (sq ft)")).toBeVisible();
  });
});
