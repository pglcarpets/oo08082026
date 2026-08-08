import { expect, test, type Page } from "@playwright/test";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  getObjectCount,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 90_000 });

async function openAiAssist(page: Page): Promise<void> {
  const aiBtn = page.getByRole("button", { name: /^AI assist$/i });
  await expect(aiBtn).toBeVisible({ timeout: 15_000 });
  await aiBtn.click();
  await expect(
    page
      .getByRole("region", { name: /AI assistant panel/i })
      .or(page.locator('[aria-label="AI Assist"]'))
      .or(page.locator(".pw-ai-drawer")),
  ).toBeVisible({ timeout: 10_000 });
}

test.describe("J5 — AI layout assist", () => {
  test("AI drawer accessible from workspace", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    await openAiAssist(page);
    await expect(page.getByRole("button", { name: /Suggest layout|Close AI assist/i }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("Suggest layout control is available in AI drawer", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    await openAiAssist(page);

    const suggest = page.getByRole("button", { name: /Suggest layout/i });
    await expect(suggest).toBeVisible({ timeout: 10_000 });
    await expect(suggest).toBeEnabled();
  });

  test("AI assist can be closed without losing canvas objects", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    const before = await getObjectCount(page);
    await openAiAssist(page);

    const close = page.getByRole("button", { name: /Close AI assist/i });
    if (await close.isVisible().catch(() => false)) {
      await close.click();
      await expect(close).toBeHidden({ timeout: 5_000 });
    } else {
      // Embedded drawer may collapse via the same AI assist toggle.
      await page.getByRole("button", { name: /^AI assist$/i }).click();
    }

    await waitForPlannerCanvas(page);
    const after = await getObjectCount(page);
    expect(after).toBe(before);
  });

  test("status bar still reports object metrics with AI chrome present", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);

    await openAiAssist(page);

    const count = await getObjectCount(page);
    const statusText = await page.locator(".pw-status-bar").textContent();

    expect(count).toBeGreaterThanOrEqual(0);
    expect(statusText).toMatch(/\d+\s+objects/i);
  });
});
