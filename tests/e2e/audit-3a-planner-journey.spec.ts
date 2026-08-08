/**
 * Phase 3a audit script (temporary, evidence-gathering only — not a permanent gate).
 * Drives real interactions against /ooplanner and captures screenshots + a click
 * log so ledger findings are backed by an interacted journey, not a probe.
 * Evidence: results/planner/audit-3a/
 */
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import { PLANNER_FABRIC_STAGE } from "./plannerCanvasHelpers";

const EVIDENCE = path.join(process.cwd(), "..", "results", "planner", "audit-3a");

let clickLog: string[] = [];
function logClick(label: string) {
  clickLog.push(`${clickLog.length + 1}. ${label}`);
}

test.describe.configure({ mode: "serial", timeout: 120_000 });

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

test("first 60 seconds — guest workspace, empty state, workflow bar", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await enterGuestPlannerWorkspace(page, { projectName: "Audit 3a" });
  logClick("enter guest planner workspace");
  await page.screenshot({ path: path.join(EVIDENCE, "01-guest-empty-1280.png"), fullPage: false });

  const workflowBar = page.getByTestId("planner-workflow-bar");
  const catalogRail = page.locator(".catalog-grid");
  const catalogItemCount = await catalogRail.locator(".catalog-item").count();
  fs.writeFileSync(
    path.join(EVIDENCE, "01-first60-dom.txt"),
    [
      `workflow-bar visible: ${await workflowBar.isVisible().catch(() => false)}`,
      `catalog items rendered for guest: ${catalogItemCount}`,
      `fabric-stage visible: ${await page.locator(PLANNER_FABRIC_STAGE).isVisible().catch(() => false)}`,
    ].join("\n"),
  );
});

test("catalog rail — search, filter, and both placement paths (drag vs keyboard)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await enterGuestPlannerWorkspace(page, { projectName: "Audit 3a placement" });

  // Correction (this session): the catalog only mounts during the "Place furniture"
  // workflow step — Planner.tsx swaps the left dock's contents by `plannerStep`, and
  // the default landing step is "draw" (Sheet panel), not "place" (Catalog panel).
  // Advance the workflow bar first, or catalog-item count is always 0 by design, not a bug.
  const placeStepBtn = page.locator('.pw-step-bar__btn[data-step="place"]');
  await placeStepBtn.click();
  logClick("workflow bar: advance to 'Place furniture' step");
  await expect(page.locator(".pw-step-bar")).toHaveAttribute("data-current", "place");

  // Catalog data loads async (useCatalogStore.refresh()) — wait for real items
  // before testing search, or a cold-compile route makes "0 results" a false
  // positive (this happened on the first run of this spec this session).
  await expect
    .poll(async () => page.locator(".catalog-item").count(), { timeout: 20_000 })
    .toBeGreaterThan(0);
  const catalogLoadedCount = await page.locator(".catalog-item").count();

  const search = page.getByTestId("catalog-search");
  const searchVisible = await search.isVisible().catch(() => false);
  if (searchVisible) {
    await search.fill("chair");
    logClick("catalog: search 'chair'");
  }
  await page.waitForTimeout(400);
  const resultsAfterSearch = await page.locator(".catalog-item").count();
  if (searchVisible) await search.fill("");
  await page.waitForTimeout(300);

  const firstItem = page.locator(".catalog-item").first();
  await expect(firstItem).toBeVisible({ timeout: 10_000 });
  const itemTestId = await firstItem.getAttribute("data-testid");

  // layers-panel only mounts on the "review" step (Planner.tsx swaps right-dock
  // contents by plannerStep) — read the count there, not on "place".
  async function layerCountViaReview(): Promise<number> {
    await page.locator('.pw-step-bar__btn[data-step="review"]').click();
    await expect(page.locator(".pw-step-bar")).toHaveAttribute("data-current", "review");
    const count = await page.getByTestId("layers-panel").locator("[data-testid^='layer-']").count();
    await page.locator('.pw-step-bar__btn[data-step="place"]').click();
    await expect(page.locator(".pw-step-bar")).toHaveAttribute("data-current", "place");
    return count;
  }

  const layerCountBefore = await layerCountViaReview();

  // Path 1: keyboard — focus the item, press Enter (role=button, tabIndex=0, onKeyDown wired to onItemClick).
  await firstItem.focus();
  await page.keyboard.press("Enter");
  logClick(`catalog: keyboard focus + Enter on ${itemTestId}`);
  await page.waitForTimeout(500);
  const layerCountAfterKeyboard = await layerCountViaReview();

  // Path 2: native HTML5 drag-and-drop onto the canvas.
  const canvas = page.locator(PLANNER_FABRIC_STAGE);
  const canvasBox = await canvas.boundingBox();
  const itemBox = await firstItem.boundingBox();
  let layerCountAfterDrag = -1;
  if (canvasBox && itemBox) {
    await page.evaluate(
      ({ itemSel, cx, cy }) => {
        const el = document.querySelector(itemSel) as HTMLElement | null;
        const target = document.elementFromPoint(cx, cy);
        if (!el || !target) return;
        const dt = new DataTransfer();
        const dragStart = new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt });
        el.dispatchEvent(dragStart);
        const dragOver = new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: cx, clientY: cy });
        target.dispatchEvent(dragOver);
        const drop = new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: cx, clientY: cy });
        target.dispatchEvent(drop);
      },
      { itemSel: `[data-testid="${itemTestId}"]`, cx: canvasBox.x + canvasBox.width / 2, cy: canvasBox.y + canvasBox.height / 2 },
    );
    logClick(`catalog: dispatch dragstart/dragover/drop for ${itemTestId} onto canvas center`);
    await page.waitForTimeout(500);
    layerCountAfterDrag = await layerCountViaReview();
  }

  await page.screenshot({ path: path.join(EVIDENCE, "02-placement-attempt.png"), fullPage: false });
  fs.writeFileSync(
    path.join(EVIDENCE, "02-placement-dom.txt"),
    [
      `catalog items loaded (guest, place step): ${catalogLoadedCount}`,
      `search box present: ${searchVisible}`,
      `results after searching 'chair': ${resultsAfterSearch}`,
      `layer count BEFORE any placement (review step): ${layerCountBefore}`,
      `layer count after KEYBOARD Enter on catalog item (onItemClick path): ${layerCountAfterKeyboard}`,
      `layer count after DRAG-DROP dispatch (dataTransfer path): ${layerCountAfterDrag}`,
    ].join("\n"),
  );
});

test("narrow viewport — 390px layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterGuestPlannerWorkspace(page, { projectName: "Audit 3a narrow" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(EVIDENCE, "03-narrow-390.png"), fullPage: false });

  const toolRailBox = await page.getByTestId("tool-rail").boundingBox().catch(() => null);
  const catalogBox = await page.locator(".catalog-grid").boundingBox().catch(() => null);
  fs.writeFileSync(
    path.join(EVIDENCE, "03-narrow-dom.txt"),
    [
      `viewport: 390x844`,
      `tool-rail box: ${JSON.stringify(toolRailBox)}`,
      `tool-rail overflows viewport width: ${toolRailBox ? toolRailBox.x + toolRailBox.width > 390 : "n/a"}`,
      `catalog-grid box: ${JSON.stringify(catalogBox)}`,
      `catalog-grid overflows viewport width: ${catalogBox ? catalogBox.x + catalogBox.width > 390 : "n/a"}`,
    ].join("\n"),
  );
});

test("keyboard-only walk — tab order from topbar into tool rail and catalog", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await enterGuestPlannerWorkspace(page, { projectName: "Audit 3a keyboard" });

  const focusedSequence: string[] = [];
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return "null";
      const testId = el.getAttribute("data-testid");
      const ariaLabel = el.getAttribute("aria-label");
      const tag = el.tagName.toLowerCase();
      return `${tag}${testId ? `[data-testid=${testId}]` : ""}${ariaLabel ? `[aria-label="${ariaLabel}"]` : ""}`;
    });
    focusedSequence.push(`Tab ${i + 1}: ${info}`);
  }
  await page.screenshot({ path: path.join(EVIDENCE, "04-keyboard-focus.png"), fullPage: false });
  fs.writeFileSync(path.join(EVIDENCE, "04-keyboard-tab-order.txt"), focusedSequence.join("\n"));
});
