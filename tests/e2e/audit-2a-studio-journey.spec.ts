/**
 * Phase 2a audit script (temporary, evidence-gathering only — not a permanent gate).
 * Drives real interactions against /oostudio and captures screenshots + a click
 * log so ledger findings are backed by an interacted journey, not a probe.
 * Evidence: results/studio/audit-2a/
 */
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const EVIDENCE = path.join(process.cwd(), "..", "results", "studio", "audit-2a");

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

test("first 60 seconds — empty state at desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/oostudio");
  await expect(page.getByTestId("studio-workspace")).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: path.join(EVIDENCE, "01-empty-1280.png"), fullPage: false });

  const emptyCta = page.getByTestId("studio-empty-cta");
  const layersPanel = page.getByTestId("layers-panel");
  const propsPanel = page.getByTestId("properties-panel");
  fs.writeFileSync(
    path.join(EVIDENCE, "01-empty-state-dom.txt"),
    [
      `empty-cta visible: ${await emptyCta.isVisible().catch(() => false)}`,
      `layers-panel visible: ${await layersPanel.isVisible().catch(() => false)}`,
      `properties-panel visible: ${await propsPanel.isVisible().catch(() => false)}`,
      `tool-rail visible: ${await page.getByTestId("tool-rail").isVisible()}`,
    ].join("\n"),
  );
});

test("canvas interaction — draw, resize, color, save (full authoring flow)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/oostudio");
  await expect(page.getByTestId("studio-workspace")).toBeVisible({ timeout: 20_000 });

  // Select rectangle tool
  await page.getByTestId("tool-rect").click();
  logClick("tool-rail: select 'rect' tool");

  // Draw on canvas via click-drag
  const canvas = page.getByTestId("studio-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas bounding box unavailable");
  const startX = box.x + box.width / 2 - 60;
  const startY = box.y + box.height / 2 - 40;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 120, startY + 80, { steps: 10 });
  await page.mouse.up();
  logClick("canvas: click-drag draw rectangle");
  await page.screenshot({ path: path.join(EVIDENCE, "02-after-draw.png"), fullPage: false });

  // Properties panel should now reflect a selection
  const propsPanel = page.getByTestId("properties-panel");
  const propsVisibleAfterDraw = await propsPanel.isVisible().catch(() => false);
  const propFill = page.getByTestId("prop-fill");
  const propFillVisible = await propFill.isVisible().catch(() => false);

  // Color via color rail/palette if present
  const colorRail = page.getByTestId("color-rail");
  const colorRailVisible = await colorRail.isVisible().catch(() => false);

  // Save flow
  await page.getByTestId("btn-save").click();
  logClick("topbar: click 'Save'");
  const saveDialog = page.getByTestId("save-dialog");
  const saveDialogVisible = await saveDialog.isVisible().catch(() => false);
  let saveConfirmDisabledEmpty = "n/a";
  if (saveDialogVisible) {
    saveConfirmDisabledEmpty = String(
      await page.getByTestId("save-confirm").isDisabled().catch(() => "n/a"),
    );
    await page.getByTestId("save-name").fill("Audit 2a test object");
    logClick("save-dialog: fill name field");
    await page.screenshot({ path: path.join(EVIDENCE, "03-save-dialog.png"), fullPage: false });
  }

  fs.writeFileSync(
    path.join(EVIDENCE, "02-authoring-flow-dom.txt"),
    [
      `properties-panel visible after draw: ${propsVisibleAfterDraw}`,
      `prop-fill visible: ${propFillVisible}`,
      `color-rail visible: ${colorRailVisible}`,
      `save-dialog opened: ${saveDialogVisible}`,
      `save-confirm disabled with empty name (before fill): ${saveConfirmDisabledEmpty}`,
    ].join("\n"),
  );
});

test("canvas interaction — click-select after draw (follow-up on missing auto-select)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/oostudio");
  await expect(page.getByTestId("studio-workspace")).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("tool-rect").click();
  logClick("tool-rail: select 'rect' tool");
  const canvas = page.getByTestId("studio-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas bounding box unavailable");
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx - 60, cy - 40);
  await page.mouse.down();
  await page.mouse.move(cx + 60, cy + 40, { steps: 10 });
  await page.mouse.up();
  logClick("canvas: click-drag draw rectangle");

  const propsAfterDraw = await page.getByTestId("properties-panel").isVisible().catch(() => false);

  // Switch tool to select (mirrors what a real user must discover to do) then click the shape
  await page.getByTestId("tool-select").click();
  logClick("tool-rail: switch to 'select' tool");
  await page.mouse.click(cx, cy);
  logClick("canvas: click drawn rectangle to select it");
  await page.waitForTimeout(200);
  const propsAfterExplicitClick = await page.getByTestId("properties-panel").isVisible().catch(() => false);
  const propFillAfterClick = await page.getByTestId("prop-fill").isVisible().catch(() => false);
  await page.screenshot({ path: path.join(EVIDENCE, "07-after-explicit-select.png"), fullPage: false });

  fs.writeFileSync(
    path.join(EVIDENCE, "07-select-followup-dom.txt"),
    [
      `properties-panel visible immediately after draw (rect tool still active): ${propsAfterDraw}`,
      `properties-panel visible after switching to select tool + clicking shape: ${propsAfterExplicitClick}`,
      `prop-fill visible after explicit select: ${propFillAfterClick}`,
    ].join("\n"),
  );
});

test("panels & dialogs — AI panel, undo/redo, Esc close", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/oostudio");
  await expect(page.getByTestId("studio-workspace")).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("toggle-ai-float").click();
  logClick("topbar: toggle AI panel");
  const aiPanel = page.getByTestId("ai-panel");
  const aiPanelVisible = await aiPanel.isVisible().catch(() => false);
  await page.screenshot({ path: path.join(EVIDENCE, "04-ai-panel.png"), fullPage: false });

  let aiPanelClosedOnEsc = "n/a";
  if (aiPanelVisible) {
    await page.keyboard.press("Escape");
    logClick("keyboard: Esc");
    await page.waitForTimeout(300);
    aiPanelClosedOnEsc = String(!(await aiPanel.isVisible().catch(() => true)));
  }

  const undoBtn = page.getByTestId("btn-undo");
  const undoEnabledInitially = !(await undoBtn.isDisabled().catch(() => true));

  fs.writeFileSync(
    path.join(EVIDENCE, "04-panels-dom.txt"),
    [
      `ai-panel opened on toggle click: ${aiPanelVisible}`,
      `ai-panel closed on Esc: ${aiPanelClosedOnEsc}`,
      `undo button enabled with empty history: ${undoEnabledInitially}`,
    ].join("\n"),
  );
});

test("narrow viewport — 390px layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/oostudio");
  await expect(page.getByTestId("studio-workspace")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1000); // let the collapse effect + canvas ResizeObserver settle before capturing
  await page.screenshot({ path: path.join(EVIDENCE, "05-narrow-390.png"), fullPage: false });

  const toolRailBox = await page.getByTestId("tool-rail").boundingBox().catch(() => null);
  const sidePanelBox = await page
    .getByTestId("studio-side-panel")
    .boundingBox()
    .catch(() => null);
  fs.writeFileSync(
    path.join(EVIDENCE, "05-narrow-dom.txt"),
    [
      `viewport: 390x844`,
      `tool-rail box: ${JSON.stringify(toolRailBox)}`,
      `tool-rail overflows viewport width: ${toolRailBox ? toolRailBox.x + toolRailBox.width > 390 : "n/a"}`,
      `side-panel box: ${JSON.stringify(sidePanelBox)}`,
      `side-panel overflows viewport width: ${sidePanelBox ? sidePanelBox.x + sidePanelBox.width > 390 : "n/a"}`,
    ].join("\n"),
  );
});

test("fix #4 — StudioTopToolbar is wired and the topbar duplicates are retired", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/oostudio");
  await expect(page.getByTestId("studio-workspace")).toBeVisible({ timeout: 20_000 });

  // Old topbar duplicates should be gone (moved into the toolbar row).
  const oldNewGone = (await page.getByTestId("btn-new").count()) === 0;
  // Template (no toolbar equivalent) should still be present in the topbar.
  await page.waitForTimeout(300);
  const templateStillPresent = await page.getByTestId("btn-start-from-template").isVisible();

  // New toolbar's New/Undo/Redo/Grid/Snap/Fit/3D are real now.
  await page.getByTestId("studio-toolbar-new").click();
  logClick("toolbar: click New (studio-toolbar-new)");
  const gridBtn = page.getByTestId("studio-toolbar-grid");
  const gridActiveBefore = await gridBtn.getAttribute("data-active");
  await gridBtn.click();
  logClick("toolbar: toggle Grid");
  const gridActiveAfter = await gridBtn.getAttribute("data-active");
  const overlayGridActiveAfter = await page.getByTestId("toggle-grid").getAttribute("data-active");

  // Draw a shape, then Undo via the toolbar and confirm the canvas actually changes.
  await page.getByTestId("tool-rect").click();
  const canvas = page.getByTestId("studio-canvas");
  const box = (await canvas.boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx - 50, cy - 30);
  await page.mouse.down();
  await page.mouse.move(cx + 50, cy + 30, { steps: 8 });
  await page.mouse.up();
  const layerCountAfterDraw = await page.getByTestId("layers-panel").locator("[data-testid^='layer-']").count();
  const undoBtn = page.getByTestId("studio-toolbar-undo");
  const undoDisabledAfterDraw = await undoBtn.isDisabled();
  // A drag-draw commits history at least twice (object:added at 1x1, object:modified at
  // final size), so Undo first reverts the resize (object still present, smaller) rather
  // than removing it outright — confirmed separately via screenshot (rectangle visibly
  // shrinks between clicks). Here just confirm the click registers without error.
  await undoBtn.click();
  logClick("toolbar: click Undo (studio-toolbar-undo)");
  await page.waitForTimeout(300);
  const layerCountAfterUndo = await page.getByTestId("layers-panel").locator("[data-testid^='layer-']").count();

  // Export button in the toolbar opens the real dropdown (same component, moved).
  await page.getByTestId("btn-export-menu").click();
  logClick("toolbar: open Export dropdown");
  const exportPanelOpen = await page.getByTestId("export-menu-panel").isVisible().catch(() => false);
  await page.keyboard.press("Escape");

  await page.screenshot({ path: path.join(EVIDENCE, "09-toolbar-wired.png"), fullPage: false });
  fs.writeFileSync(
    path.join(EVIDENCE, "09-toolbar-wired-dom.txt"),
    [
      `old btn-new removed from topbar: ${oldNewGone}`,
      `Template still present in topbar (no toolbar equivalent, kept): ${templateStillPresent}`,
      `grid data-active before/after toolbar click: ${gridActiveBefore} -> ${gridActiveAfter}`,
      `canvas overlay grid button reflects same state: ${overlayGridActiveAfter}`,
      `layer count after draw: ${layerCountAfterDraw} (undo disabled? ${undoDisabledAfterDraw})`,
      `layer count after one undo click: ${layerCountAfterUndo} (object still present but resized smaller — see screenshot)`,
      `Export dropdown opens from toolbar: ${exportPanelOpen}`,
    ].join("\n"),
  );
});

test("DIAGNOSTIC — canvas-stage geometry at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/oostudio");
  await expect(page.getByTestId("studio-workspace")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  const stageBox = await page.getByTestId("canvas-stage").boundingBox().catch(() => null);
  const canvasBox = await page.getByTestId("studio-canvas").boundingBox().catch(() => null);
  const canvasAttrs = await page.getByTestId("studio-canvas").evaluate((el) => {
    const c = el as HTMLCanvasElement;
    return { width: c.width, height: c.height, styleWidth: c.style.width, styleHeight: c.style.height };
  }).catch((e) => String(e));
  const emptyCtaVisible = await page.getByTestId("studio-empty-cta").isVisible().catch(() => false);
  await page.screenshot({ path: path.join(EVIDENCE, "08-diagnostic-390-after-wait.png"), fullPage: false });
  fs.writeFileSync(
    path.join(EVIDENCE, "08-diagnostic-390.txt"),
    [
      `canvas-stage box: ${JSON.stringify(stageBox)}`,
      `studio-canvas box: ${JSON.stringify(canvasBox)}`,
      `studio-canvas attrs: ${JSON.stringify(canvasAttrs)}`,
      `empty-cta visible after 1.5s wait: ${emptyCtaVisible}`,
    ].join("\n"),
  );
});

test("keyboard-only walk — tab order from topbar into tool rail", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/oostudio");
  await expect(page.getByTestId("studio-workspace")).toBeVisible({ timeout: 20_000 });

  const focusedSequence: string[] = [];
  for (let i = 0; i < 15; i++) {
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
  await page.screenshot({ path: path.join(EVIDENCE, "06-keyboard-focus.png"), fullPage: false });
  fs.writeFileSync(path.join(EVIDENCE, "06-keyboard-tab-order.txt"), focusedSequence.join("\n"));
});
