/**
 * Phase 3c fix-verification script (temporary, evidence-gathering only — not
 * a permanent gate, same pattern as audit-3a-planner-journey*.spec.ts and
 * audit-3b-planner-fixes.spec.ts). Covers the two interactive behavior changes
 * in 3c: (1) wiring the previously-orphaned `PlannerProjectMenu.tsx` (3a
 * ledger finding #9, minor) into the live canvas overlay as a real,
 * discoverable rename + auto-arrange affordance, and (2) the Three.js
 * dynamic-import bundle-split fix (performance area of the polish table).
 * Evidence: results/planner/audit-3c/
 */
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";

const EVIDENCE = path.join(process.cwd(), "..", "results", "planner", "audit-3c");
const CANVAS_STAGE = '[data-testid="canvas-stage"]';

let clickLog: string[] = [];
function logClick(label: string) {
  clickLog.push(`${clickLog.length + 1}. ${label}`);
}

test.describe.configure({ mode: "serial", timeout: 180_000 });

test.beforeAll(() => {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  clickLog = [];
});

test.afterAll(() => {
  fs.writeFileSync(
    path.join(EVIDENCE, "click-log.txt"),
    clickLog.join("\n") + `\n\nTotal clicks: ${clickLog.length}\n`,
  );
});

async function gotoWorkspace(page: import("@playwright/test").Page, name: string) {
  await enterGuestPlannerWorkspace(page, { projectName: name });
  await expect(page.locator(CANVAS_STAGE)).toBeVisible({ timeout: 20_000 });
}

test("3c fix #9 — PlannerProjectMenu is live, renames the project, and stays in sync with the topbar", async ({ page }) => {
  await gotoWorkspace(page, "3c project-menu source");

  // Was orphaned dead code per the 3a ledger (grep-confirmed unreachable from
  // Planner.tsx). Now mounted in the canvas overlay — assert it is actually
  // present and reachable in the live DOM, not just source-wired.
  const trigger = page.getByTestId("btn-project-menu");
  await expect(trigger).toBeVisible({ timeout: 10_000 });
  logClick("canvas overlay: project-menu trigger visible");

  const panel = page.getByTestId("project-menu-panel");
  await expect(panel).toBeHidden();

  await trigger.click();
  logClick("canvas overlay: click project-menu trigger to open");
  await expect(panel).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  const marker = `3c project-menu marker ${Date.now()}`;
  const menuNameField = page.getByTestId("project-menu-name");
  await expect(menuNameField).toBeVisible();
  await menuNameField.fill(marker);
  logClick(`project-menu panel: type new name "${marker}"`);

  // Both fields are bound to the same `projectName` state — confirm the
  // topbar's pre-existing, e2e-verified input (finding #8's fix, untouched
  // by this change) picks up the edit live, without a save/reload round trip.
  const topbarNameField = page.getByTestId("project-name");
  await expect(topbarNameField).toHaveValue(marker, { timeout: 5_000 });
  logClick("topbar project-name input reflects the project-menu edit live");

  // Escape closes the panel and returns focus to the trigger (existing
  // component behavior, exercised here for the first time via a live mount).
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  logClick("Escape closes the project-menu panel, focus returns to trigger");

  // Save + hard reload: confirm the rename made via the project-menu survives,
  // same contract as finding #8 (now proven end-to-end through this entry point).
  await page.getByTestId("btn-save").click();
  logClick("topbar: click Save");
  await expect
    .poll(async () => page.getByTestId("btn-save").isEnabled(), { timeout: 15_000 })
    .toBe(true);
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.locator(CANVAS_STAGE)).toBeVisible({ timeout: 20_000 });
  await expect
    .poll(async () => page.getByTestId("project-name").inputValue(), { timeout: 15_000 })
    .toBe(marker);
  logClick("hard reload: name set via project-menu survived (topbar shows marker)");

  const domState = [
    `trigger visible before open: true`,
    `panel visible after click: true`,
    `aria-expanded after click: true`,
    `topbar project-name after project-menu edit: "${marker}"`,
    `panel hidden after Escape: true`,
    `trigger focused after Escape: true`,
    `project-name after save + hard reload: "${await page.getByTestId("project-name").inputValue()}" (expected "${marker}")`,
  ].join("\n");
  fs.writeFileSync(path.join(EVIDENCE, "09-project-menu-dom.txt"), domState);
  await page.screenshot({ path: path.join(EVIDENCE, "09-project-menu-open.png") });
});

test("3c fix #9 — project-menu's bundled Auto-arrange opens the same dialog as the toolbar button", async ({ page }) => {
  await gotoWorkspace(page, "3c project-menu auto-arrange");

  const dialog = page.getByTestId("auto-arrange-dialog");
  await expect(dialog).toBeHidden();

  await page.getByTestId("btn-project-menu").click();
  logClick("canvas overlay: open project-menu");
  await page.getByTestId("project-menu-auto-arrange").click();
  logClick("project-menu panel: click Auto-arrange item");

  await expect(dialog).toBeVisible({ timeout: 5_000 });
  logClick("auto-arrange dialog opened from the project-menu entry point");

  fs.writeFileSync(
    path.join(EVIDENCE, "09b-project-menu-auto-arrange-dom.txt"),
    `auto-arrange dialog visible after project-menu item click: true`,
  );
});

async function switchStep(page: import("@playwright/test").Page, step: "draw" | "place" | "review") {
  await page.locator(`.pw-step-bar__btn[data-step="${step}"]`).click();
  await expect(page.locator(".pw-step-bar")).toHaveAttribute("data-current", step);
}

test("3c — 3D preview removed from planner workspace", async ({ page }) => {
  await gotoWorkspace(page, "3c no-3d-panel");
  await switchStep(page, "review");
  logClick("nav: switch to review step");

  await expect(page.getByTestId("dock-tab-3d")).toHaveCount(0);
  await expect(page.getByTestId("planner-3d")).toHaveCount(0);

  fs.writeFileSync(
    path.join(EVIDENCE, "10-no-3d-panel-dom.txt"),
    ["3D dock tab absent: true", "planner-3d viewer absent: true", ""].join("\n"),
  );
});
