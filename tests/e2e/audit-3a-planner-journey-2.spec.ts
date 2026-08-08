/**
 * Phase 3a audit script, part 2 (temporary, evidence-gathering only — not a
 * permanent gate). Covers phase-3a.md checklist sections 3 (canvas), 4
 * (projects flow), 5 (BOQ + handoff), 6 (sketch-to-plan), 7 (workflow +
 * validation), 8 (perf, best-effort), 9 (accessibility beyond tab-order),
 * 11 (narrow/viewport extras). Drives real interactions against /ooplanner
 * and captures screenshots + a click log so findings are backed by an
 * interacted journey, not a probe.
 *
 * Companion to tests/e2e/audit-3a-planner-journey.spec.ts (first-60/catalog/
 * narrow/keyboard-tab-order). Split into a second file to keep each file a
 * manageable size — same EVIDENCE folder, same click-log convention.
 *
 * Evidence: results/planner/audit-3a/
 */
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const EVIDENCE = path.join(process.cwd(), "..", "results", "planner", "audit-3a");
const CANVAS_STAGE = '[data-testid="canvas-stage"]';
const PRIMARY_CANVAS = '[data-testid="canvas-stage"] canvas.upper-canvas';

let clickLog: string[] = [];
function logClick(label: string) {
  clickLog.push(`${clickLog.length + 1}. ${label}`);
}

test.describe.configure({ mode: "serial", timeout: 180_000 });

test.beforeAll(() => {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  // Append to the same click-log the part-1 file wrote, rather than clobber it.
  const existing = path.join(EVIDENCE, "click-log.txt");
  clickLog = fs.existsSync(existing)
    ? fs.readFileSync(existing, "utf8").split("\n").filter((l) => /^\d+\./.test(l))
    : [];
});

test.afterAll(() => {
  fs.writeFileSync(
    path.join(EVIDENCE, "click-log.txt"),
    clickLog.join("\n") + `\n\nTotal clicks: ${clickLog.length}\n`,
  );
});

async function gotoWorkspace(page: import("@playwright/test").Page) {
  await page.goto("/ooplanner");
  await expect(page.getByTestId("planner-workspace")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(CANVAS_STAGE)).toBeVisible({ timeout: 20_000 });
}

async function switchStep(page: import("@playwright/test").Page, step: "draw" | "place" | "review") {
  await page.locator(`.pw-step-bar__btn[data-step="${step}"]`).click();
  await expect(page.locator(".pw-step-bar")).toHaveAttribute("data-current", step);
}

/** Place one catalog item via native HTML5 DnD — the only working placement path (see part 1 finding). */
async function placeOneItemViaDrag(page: import("@playwright/test").Page): Promise<string | null> {
  await switchStep(page, "place");
  await expect
    .poll(async () => page.locator(".catalog-item").count(), { timeout: 20_000 })
    .toBeGreaterThan(0);
  const item = page.locator(".catalog-item").first();
  const itemTestId = await item.getAttribute("data-testid");
  const canvasBox = await page.locator(PRIMARY_CANVAS).boundingBox();
  if (!canvasBox) return null;
  await page.evaluate(
    ({ itemSel, cx, cy }) => {
      const el = document.querySelector(itemSel) as HTMLElement | null;
      const target = document.elementFromPoint(cx, cy);
      if (!el || !target) return;
      const dt = new DataTransfer();
      el.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt }));
      target.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: cx, clientY: cy }));
      target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: cx, clientY: cy }));
    },
    { itemSel: `[data-testid="${itemTestId}"]`, cx: canvasBox.x + canvasBox.width / 2, cy: canvasBox.y + canvasBox.height / 2 },
  );
  await page.waitForTimeout(500);
  return itemTestId;
}

async function layerCount(page: import("@playwright/test").Page): Promise<number> {
  await switchStep(page, "review");
  const count = await page.getByTestId("layers-panel").locator("[data-testid^='layer-']").count();
  return count;
}

// ---------------------------------------------------------------------------
// 3. Plan canvas
// ---------------------------------------------------------------------------

test("canvas — pan, zoom, wall draw, snap toggle, undo/redo", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoWorkspace(page);
  await switchStep(page, "draw");

  // Zoom buttons.
  const zoomLabelBefore = await page.getByTestId("vp-zoom-100").innerText();
  await page.getByTestId("vp-zoom-in").click();
  logClick("viewport: zoom in (vp-zoom-in)");
  await page.waitForTimeout(150);
  await page.getByTestId("vp-zoom-in").click();
  logClick("viewport: zoom in x2");
  await page.waitForTimeout(150);
  const zoomLabelAfterIn = await page.getByTestId("vp-zoom-100").innerText();
  await page.getByTestId("vp-zoom-out").click();
  await page.getByTestId("vp-zoom-out").click();
  await page.getByTestId("vp-zoom-out").click();
  logClick("viewport: zoom out x3");
  await page.waitForTimeout(150);
  const zoomLabelAfterOut = await page.getByTestId("vp-zoom-100").innerText();
  await page.getByTestId("vp-zoom-100").click();
  logClick("viewport: reset to 100% (vp-zoom-100)");
  await page.waitForTimeout(150);
  const zoomLabelAfterReset = await page.getByTestId("vp-zoom-100").innerText();

  // Pan tool + drag on empty canvas.
  await page.locator('[data-testid="tool-pan"]').click();
  logClick("tool-rail: select Pan tool");
  const stageBox = await page.locator(CANVAS_STAGE).boundingBox();
  let cursorDuringPan = "";
  if (stageBox) {
    const cx = stageBox.x + stageBox.width / 2;
    const cy = stageBox.y + stageBox.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 80, cy + 40, { steps: 10 });
    cursorDuringPan = await page
      .locator(PRIMARY_CANVAS)
      .evaluate((el) => window.getComputedStyle(el).cursor)
      .catch(() => "n/a");
    await page.mouse.up();
    logClick("canvas: drag-pan 80,40px with Pan tool active");
  }

  // Wall draw.
  await page.locator('[data-testid="tool-wall"]').click();
  logClick("tool-rail: select Wall tool");
  const wallsBefore = await layerCount(page);
  await switchStep(page, "draw");
  const box = await page.locator(PRIMARY_CANVAS).boundingBox();
  if (box) {
    const start = { x: box.x + box.width * 0.3, y: box.y + box.height * 0.3 };
    const end = { x: box.x + box.width * 0.6, y: box.y + box.height * 0.3 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 12 });
    await page.mouse.up();
    logClick(`canvas: drag-draw wall from (${Math.round(start.x)},${Math.round(start.y)}) to (${Math.round(end.x)},${Math.round(end.y)})`);
  }
  await page.waitForTimeout(300);
  const wallsAfter = await layerCount(page);

  // Snap toggle.
  await switchStep(page, "draw");
  const snapBefore = await page.getByTestId("toggle-snap").getAttribute("data-active");
  const snapLabelBefore = await page.getByTestId("snap-status-label").innerText();
  await page.getByTestId("toggle-snap").click();
  logClick("canvas overlay: toggle Snap");
  const snapAfter = await page.getByTestId("toggle-snap").getAttribute("data-active");
  const snapLabelAfter = await page.getByTestId("snap-status-label").innerText();
  await page.getByTestId("toggle-snap").click(); // restore
  logClick("canvas overlay: toggle Snap back");

  // Undo/redo — draw a second wall, undo, confirm count drops, redo, confirm it returns.
  const beforeSecondWall = await layerCount(page);
  await switchStep(page, "draw");
  await page.locator('[data-testid="tool-wall"]').click();
  const box2 = await page.locator(PRIMARY_CANVAS).boundingBox();
  if (box2) {
    await page.mouse.move(box2.x + box2.width * 0.3, box2.y + box2.height * 0.6);
    await page.mouse.down();
    await page.mouse.move(box2.x + box2.width * 0.6, box2.y + box2.height * 0.6, { steps: 8 });
    await page.mouse.up();
    logClick("canvas: drag-draw second wall");
  }
  await page.waitForTimeout(300);
  const afterSecondWall = await layerCount(page);
  await switchStep(page, "draw");
  await page.getByTestId("btn-undo").click();
  logClick("toolrail extras: Undo");
  await page.waitForTimeout(300);
  const afterUndo = await layerCount(page);
  await switchStep(page, "draw");
  await page.getByTestId("btn-redo").click();
  logClick("toolrail extras: Redo");
  await page.waitForTimeout(300);
  const afterRedo = await layerCount(page);

  await page.screenshot({ path: path.join(EVIDENCE, "05-canvas-interactions.png"), fullPage: false });
  fs.writeFileSync(
    path.join(EVIDENCE, "05-canvas-interactions-dom.txt"),
    [
      `zoom label before: ${zoomLabelBefore}`,
      `zoom label after 2x zoom-in: ${zoomLabelAfterIn}`,
      `zoom label after 3x zoom-out (from the +2 state): ${zoomLabelAfterOut}`,
      `zoom label after reset (vp-zoom-100): ${zoomLabelAfterReset}`,
      `cursor on upper-canvas mid-drag with Pan tool active: ${cursorDuringPan}`,
      `wall layer count before draw: ${wallsBefore}, after one wall drawn: ${wallsAfter}`,
      `snap toggle data-active before: ${snapBefore} label: "${snapLabelBefore}" -> after: ${snapAfter} label: "${snapLabelAfter}"`,
      `undo/redo: before 2nd wall ${beforeSecondWall} -> after draw ${afterSecondWall} -> after undo ${afterUndo} -> after redo ${afterRedo}`,
    ].join("\n"),
  );
});

test("canvas — selection model (single, multi shift-click, right-click context menu) and rotate via properties", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoWorkspace(page);

  await placeOneItemViaDrag(page);
  await switchStep(page, "place");
  // Second placement at a different canvas point so the two objects don't overlap.
  await expect.poll(async () => page.locator(".catalog-item").count(), { timeout: 20_000 }).toBeGreaterThan(0);
  const secondItem = page.locator(".catalog-item").nth(1);
  const secondTestId = await secondItem.getAttribute("data-testid");
  const canvasBox = await page.locator(PRIMARY_CANVAS).boundingBox();
  if (canvasBox && secondTestId) {
    await page.evaluate(
      ({ itemSel, cx, cy }) => {
        const el = document.querySelector(itemSel) as HTMLElement | null;
        const target = document.elementFromPoint(cx, cy);
        if (!el || !target) return;
        const dt = new DataTransfer();
        el.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt }));
        target.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: cx, clientY: cy }));
        target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: cx, clientY: cy }));
      },
      { itemSel: `[data-testid="${secondTestId}"]`, cx: canvasBox.x + canvasBox.width * 0.7, cy: canvasBox.y + canvasBox.height * 0.7 },
    );
    logClick(`catalog: drag-drop second item ${secondTestId} onto canvas (offset point)`);
    await page.waitForTimeout(500);
  }

  const layersAfterTwoPlacements = await layerCount(page);
  await switchStep(page, "review");
  const firstLayer = page.getByTestId("layers-panel").locator("[data-testid^='layer-']").first();
  const firstLayerVisible = await firstLayer.isVisible().catch(() => false);

  // Single selection via layer click, check Properties reflects it (right dock at review has props too).
  let propsVisibleAfterLayerClick = false;
  let angleValueBefore = "";
  if (firstLayerVisible) {
    await firstLayer.click();
    logClick("layers-panel: click first layer to select it");
    await page.waitForTimeout(200);
    propsVisibleAfterLayerClick = await page.getByTestId("properties-panel").isVisible().catch(() => false);
    if (propsVisibleAfterLayerClick) {
      angleValueBefore = await page.getByTestId("prop-angle").inputValue().catch(() => "");
    }
  }

  // Rotate via the numeric Rotation field (drag-handle rotation is not reliably scriptable
  // without exact fabric-object screen coordinates; the properties field is the documented,
  // keyboard-reachable alternative and is what PlannerPropertiesPanel actually exposes).
  let angleValueAfter = "";
  if (propsVisibleAfterLayerClick) {
    const angleInput = page.getByTestId("prop-angle");
    await angleInput.fill("45");
    await angleInput.dispatchEvent("change");
    logClick("properties-panel: set Rotation to 45 via prop-angle input");
    await page.waitForTimeout(200);
    angleValueAfter = await angleInput.inputValue().catch(() => "");
  }

  // Right-click on canvas for context menu.
  const stageBox = await page.locator(CANVAS_STAGE).boundingBox();
  let contextMenuVisible = false;
  if (stageBox) {
    await page.mouse.click(stageBox.x + stageBox.width / 2, stageBox.y + stageBox.height / 2, { button: "right" });
    logClick("canvas: right-click at center for context menu");
    await page.waitForTimeout(300);
    contextMenuVisible = await page.getByTestId("context-menu").isVisible().catch(() => false);
  }

  await page.screenshot({ path: path.join(EVIDENCE, "06-selection-rotate-context.png"), fullPage: false });
  fs.writeFileSync(
    path.join(EVIDENCE, "06-selection-rotate-context-dom.txt"),
    [
      `layer count after two drag-drop placements: ${layersAfterTwoPlacements}`,
      `first layer row visible in layers-panel: ${firstLayerVisible}`,
      `properties-panel visible after clicking first layer: ${propsVisibleAfterLayerClick}`,
      `prop-angle before: "${angleValueBefore}" -> after setting 45: "${angleValueAfter}"`,
      `context-menu visible after right-click on canvas: ${contextMenuVisible}`,
    ].join("\n"),
  );
});

// ---------------------------------------------------------------------------
// 4. Projects flow
// ---------------------------------------------------------------------------

test("projects — save, appears in list, open, delete, refresh survival", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoWorkspace(page);

  const uniqueName = `Audit3a Project ${Date.now()}`;
  const nameInput = page.getByTestId("project-name");
  await nameInput.fill(uniqueName);
  logClick(`topbar: rename plan to "${uniqueName}" via project-name input`);
  const saveBtn = page.getByTestId("btn-save");
  await saveBtn.click();
  logClick("topbar: click Save (btn-save)");
  await expect(saveBtn).toBeEnabled({ timeout: 15_000 });
  await page.waitForTimeout(500);
  const urlAfterSave = page.url();

  // Refresh survival — does reloading keep the saved project bound?
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("planner-workspace")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(800);
  const nameAfterReload = await page.getByTestId("project-name").inputValue().catch(() => "");
  const urlAfterReload = page.url();

  // Projects list.
  await page.goto("/ooplanner/projects");
  await expect(page.getByTestId("projects-page")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(500);
  const projectCards = page.locator('[data-testid^="project-"]');
  const cardCount = await projectCards.count();
  const matchingCard = page.locator('[data-testid^="project-"]').filter({ hasText: uniqueName });
  const foundInList = (await matchingCard.count()) > 0;
  logClick("navigate to /ooplanner/projects to verify save appears in list");

  let deletedOk = false;
  let deletedOkAfterReload = false;
  let toastAfterDelete = "";
  if (foundInList) {
    const card = matchingCard.first();
    const testId = await card.getAttribute("data-testid");
    const id = testId?.replace("project-", "");
    page.on("dialog", (d) => d.accept());
    if (id) {
      await page.getByTestId(`del-${id}`).click();
      logClick(`projects list: delete "${uniqueName}" (del-${id}) + accept native confirm`);
      await page.waitForTimeout(1_500);
      toastAfterDelete = (await page.locator(".pw-toast, .toast").first().innerText().catch(() => "")) || "(no toast found)";
      deletedOk = (await page.locator(`[data-testid="project-${id}"]`).count()) === 0;
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("projects-page")).toBeVisible({ timeout: 20_000 });
      await page.waitForTimeout(500);
      deletedOkAfterReload = (await page.locator(`[data-testid="project-${id}"]`).count()) === 0;
    }
  }

  await page.screenshot({ path: path.join(EVIDENCE, "07-projects-flow.png"), fullPage: false });
  fs.writeFileSync(
    path.join(EVIDENCE, "07-projects-flow-dom.txt"),
    [
      `URL right after Save: ${urlAfterSave}`,
      `URL after hard reload: ${urlAfterReload}`,
      `project-name value after hard reload: "${nameAfterReload}" (expected "${uniqueName}")`,
      `project cards in /ooplanner/projects: ${cardCount}`,
      `saved project "${uniqueName}" found in list: ${foundInList}`,
      `delete via del-{id} removed the card (500ms->1500ms after click): ${deletedOk}`,
      `toast text seen after delete click: "${toastAfterDelete}"`,
      `card still gone after a full page reload: ${deletedOkAfterReload}`,
    ].join("\n"),
  );
});

// ---------------------------------------------------------------------------
// 5. BOQ + handoff
// ---------------------------------------------------------------------------

test("BOQ panel and handoff dialog", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoWorkspace(page);
  await placeOneItemViaDrag(page);
  await switchStep(page, "review");

  const boqTab = page.locator('[data-testid="dock-tab-boq"]');
  const boqTabVisible = await boqTab.isVisible().catch(() => false);
  const boqTabCount = await boqTab.count();
  if (boqTabVisible) {
    await boqTab.click();
    logClick("review dock: open BOQ tab");
  }
  const dockShellAppeared = await page
    .getByTestId("dock-shell")
    .waitFor({ state: "visible", timeout: 8_000 })
    .then(() => true)
    .catch(() => false);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(EVIDENCE, "08-boq-debug-after-click.png"), fullPage: false });
  const rightDockHtml = await page.getByTestId("planner-side-panel").innerHTML().catch(() => "(not found)");
  fs.writeFileSync(path.join(EVIDENCE, "08-boq-debug-right-dock.html"), rightDockHtml.slice(0, 6000));
  const boqPanelVisible = await page.getByTestId("boq-panel").isVisible().catch(() => false);
  const boqEmptyVisible = await page.getByTestId("boq-empty").isVisible().catch(() => false);
  const boqLineCount = await page.getByTestId("review-boq-lines").locator("li").count().catch(() => 0);
  const boqTotalsVisible = await page.getByTestId("boq-totals").isVisible().catch(() => false);

  let handoffOpened = false;
  let handoffSubmitDisabledEmpty = "n/a";
  let handoffSuccessVisible = false;
  const handoffBtn = page.getByTestId("boq-handoff");
  if (await handoffBtn.isVisible().catch(() => false)) {
    await handoffBtn.click();
    logClick("BOQ panel: click 'Request quote' (boq-handoff)");
    await page.waitForTimeout(300);
    handoffOpened = await page.getByTestId("planner-handoff-dialog").isVisible().catch(() => false);
  }
  if (handoffOpened) {
    const submit = page.getByTestId("handoff-submit");
    handoffSubmitDisabledEmpty = String(await submit.isDisabled().catch(() => "n/a"));
    await page.getByTestId("handoff-name").fill("Audit 3a Tester");
    await page.getByTestId("handoff-email").fill("audit3a@example.com");
    await page.getByTestId("handoff-phone").fill("+1 555 0100");
    logClick("handoff dialog: fill name/email/phone");
    await submit.click();
    logClick("handoff dialog: submit");
    await page.waitForTimeout(800);
    handoffSuccessVisible = await page.getByTestId("handoff-success").isVisible().catch(() => false);
  }

  await page.screenshot({ path: path.join(EVIDENCE, "08-boq-handoff.png"), fullPage: false });
  fs.writeFileSync(
    path.join(EVIDENCE, "08-boq-handoff-dom.txt"),
    [
      `dock-tab-boq count in DOM: ${boqTabCount}, visible: ${boqTabVisible}`,
      `dock-shell appeared within 8s of clicking the BOQ tab: ${dockShellAppeared}`,
      `boq-panel visible: ${boqPanelVisible}`,
      `boq-empty visible (no BOQ lines): ${boqEmptyVisible}`,
      `boq line items rendered: ${boqLineCount}`,
      `boq-totals visible: ${boqTotalsVisible}`,
      `handoff dialog opened from boq-handoff button: ${handoffOpened}`,
      `handoff submit disabled with empty form (checked before fill): ${handoffSubmitDisabledEmpty}`,
      `handoff-success message visible after submit: ${handoffSuccessVisible}`,
    ].join("\n"),
  );
});

// ---------------------------------------------------------------------------
// 6. Sketch-to-plan (reached via the AI panel's sketch section)
// ---------------------------------------------------------------------------

test("sketch-to-plan — discoverability and upload affordance", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoWorkspace(page);

  await page.getByTestId("toggle-ai-float").click();
  logClick("canvas overlay: open AI panel (toggle-ai-float)");
  await page.waitForTimeout(300);
  const aiPanelVisible = await page.getByTestId("planner-ai-panel").isVisible().catch(() => false);
  const sketchSectionVisible = await page.getByTestId("planner-sketch-section").isVisible().catch(() => false);
  const sketchUploadVisible = await page.getByTestId("planner-sketch-upload").isVisible().catch(() => false);
  const sketchFileInputAccept = await page
    .getByTestId("planner-sketch-file")
    .getAttribute("accept")
    .catch(() => null);

  let closedOnEsc = false;
  if (aiPanelVisible) {
    await page.keyboard.press("Escape");
    logClick("AI panel: press Escape");
    await page.waitForTimeout(200);
    closedOnEsc = !(await page.getByTestId("planner-ai-panel").isVisible().catch(() => false));
  }

  await page.screenshot({ path: path.join(EVIDENCE, "09-sketch-to-plan.png"), fullPage: false });
  fs.writeFileSync(
    path.join(EVIDENCE, "09-sketch-to-plan-dom.txt"),
    [
      `AI panel opened via toggle-ai-float: ${aiPanelVisible}`,
      `sketch-to-plan section visible inside AI panel: ${sketchSectionVisible}`,
      `sketch upload control visible: ${sketchUploadVisible}`,
      `sketch file input accept attribute: ${sketchFileInputAccept}`,
      `AI panel closes on Escape: ${closedOnEsc}`,
    ].join("\n"),
  );
});

// ---------------------------------------------------------------------------
// 7. Workflow bar (3-step) + validation panel
// ---------------------------------------------------------------------------

test("workflow bar — step navigation, forward-warning, validation panel", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoWorkspace(page);

  const stepBar = page.locator(".pw-step-bar");
  await expect(stepBar).toHaveAttribute("data-current", "draw");

  // On an empty plan, jump straight to review — the bar should be able to warn
  // that draw is incomplete (seen live in evidence 02-placement-attempt.png:
  // "Draw room is incomplete. You can continue, but review and quote may remain blocked").
  await page.locator('.pw-step-bar__btn[data-step="review"]').click();
  logClick("workflow bar: jump from Draw straight to Review on an empty plan");
  await page.waitForTimeout(300);
  const warningVisible = await page.locator(".pw-step-bar__warn").isVisible().catch(() => false);
  const warningText = warningVisible ? await page.locator(".pw-step-bar__warn").innerText() : "";

  const validationEmptyVisible = await page.getByTestId("planner-validation-empty").isVisible().catch(() => false);
  const validationTabVisible = await page.locator('[data-testid="dock-tab-validation"]').isVisible().catch(() => false);

  // "Continue" button walk: draw -> place -> review via planner-step-next.
  await page.locator('.pw-step-bar__btn[data-step="draw"]').click();
  await expect(stepBar).toHaveAttribute("data-current", "draw");
  const nextBtn = page.getByTestId("planner-step-next");
  await nextBtn.click();
  logClick("workflow bar: click Continue (planner-step-next) from Draw");
  await expect(stepBar).toHaveAttribute("data-current", "place");
  await nextBtn.click();
  logClick("workflow bar: click Continue from Place");
  await expect(stepBar).toHaveAttribute("data-current", "review");

  await page.screenshot({ path: path.join(EVIDENCE, "10-workflow-validation.png"), fullPage: false });
  fs.writeFileSync(
    path.join(EVIDENCE, "10-workflow-validation-dom.txt"),
    [
      `forward-skip warning shown when jumping Draw->Review empty: ${warningVisible}`,
      `warning text: "${warningText}"`,
      `planner-validation-empty visible: ${validationEmptyVisible}`,
      `dock-tab-validation exists as a distinct dock tab: ${validationTabVisible}`,
      `Continue button walks Draw -> Place -> Review correctly: true`,
    ].join("\n"),
  );
});

// ---------------------------------------------------------------------------
// 9. Accessibility beyond tab order — labels, command palette
// ---------------------------------------------------------------------------

test("accessibility — icon button labels, command palette (Ctrl+K), extended tab order", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoWorkspace(page);

  // Icon-only controls: every one in the tool rail + viewport controls should have an aria-label.
  const iconButtonSelectors = [
    "tool-select", "tool-pan", "tool-wall", "tool-door", "tool-window", "tool-line", "tool-dimension", "tool-text",
    "vp-zoom-in", "vp-zoom-out", "vp-zoom-100", "vp-fit", "vp-fullscreen",
    "toggle-grid", "toggle-snap", "toggle-ai-float", "btn-undo", "btn-redo",
  ];
  const missingLabels: string[] = [];
  for (const id of iconButtonSelectors) {
    const el = page.locator(`[data-testid="${id}"]`).first();
    if (!(await el.count())) continue;
    const label = await el.getAttribute("aria-label");
    const title = await el.getAttribute("title");
    if (!label && !title) missingLabels.push(id);
  }

  // Command palette — Ctrl+K.
  await page.keyboard.press("Control+k");
  logClick("keyboard: Ctrl+K to open command palette");
  await page.waitForTimeout(300);
  const paletteVisible = await page.getByTestId("planner-command-palette").isVisible().catch(() => false);
  let paletteQueryFocused = false;
  let paletteClosedOnEsc = false;
  if (paletteVisible) {
    paletteQueryFocused = await page
      .getByTestId("planner-command-query")
      .evaluate((el) => el === document.activeElement)
      .catch(() => false);
    await page.keyboard.press("Escape");
    logClick("command palette: press Escape");
    await page.waitForTimeout(200);
    paletteClosedOnEsc = !(await page.getByTestId("planner-command-palette").isVisible().catch(() => false));
  }

  // Extended tab order (40 stops) from a clean load, on the "place" step so the
  // primary drawing surface (tool rail + catalog) is reachable in-sequence.
  await switchStep(page, "place");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
  const focusedSequence: string[] = [];
  for (let i = 0; i < 40; i++) {
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
  const toolRailTabIndex = focusedSequence.findIndex((l) => l.includes("tool-select") || l.includes("tool-wall"));
  const catalogItemTabIndex = focusedSequence.findIndex((l) => l.includes("catalog-item-"));
  const unwiredToolbarTabIndex = focusedSequence.findIndex((l) => l.includes("planner-toolbar-"));

  await page.screenshot({ path: path.join(EVIDENCE, "11-a11y-extended.png"), fullPage: false });
  fs.writeFileSync(
    path.join(EVIDENCE, "11-a11y-extended-dom.txt"),
    [
      `icon buttons missing BOTH aria-label and title: ${missingLabels.length ? missingLabels.join(", ") : "(none)"}`,
      `command palette opens on Ctrl+K: ${paletteVisible}`,
      `command palette query input auto-focused on open: ${paletteQueryFocused}`,
      `command palette closes on Escape: ${paletteClosedOnEsc}`,
      ``,
      `-- extended tab order (40 stops, from Place step) --`,
      ...focusedSequence,
      ``,
      `first tool-rail drawing-tool stop at tab #: ${toolRailTabIndex === -1 ? "never in 40 tabs" : toolRailTabIndex + 1}`,
      `first catalog-item stop at tab #: ${catalogItemTabIndex === -1 ? "never in 40 tabs" : catalogItemTabIndex + 1}`,
      `first PlannerTopToolbar (data-unwired duplicate row) stop at tab #: ${unwiredToolbarTabIndex === -1 ? "never in 40 tabs (buttons may be excluded from tab order or not yet reached)" : unwiredToolbarTabIndex + 1}`,
    ].join("\n"),
  );
});

// ---------------------------------------------------------------------------
// Duplicate/unwired top toolbar — interacted proof (mirrors the Studio 2a
// finding #4 pattern: data-unwired="true", no onClick, shipped to real users).
// ---------------------------------------------------------------------------

test("unwired duplicate top toolbar — clicking New/Save/Undo does nothing", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoWorkspace(page);

  const nameInput = page.getByTestId("project-name");
  await nameInput.fill("Should not be discarded");
  logClick('topbar: set plan name to "Should not be discarded"');

  const unwiredNew = page.getByTestId("planner-toolbar-new");
  const isUnwired = await unwiredNew.getAttribute("data-unwired");
  await unwiredNew.click({ timeout: 3_000, force: true }).catch(() => undefined);
  logClick("PlannerTopToolbar (row 2): click 'New' (planner-toolbar-new)");
  await page.waitForTimeout(300);
  // A real "New" click asks window.confirm(...) and clears the name to "Untitled Plan".
  const nameAfterClickingUnwiredNew = await nameInput.inputValue();

  const unwiredSave = page.getByTestId("planner-toolbar-save");
  const saveHadClickHandler = await unwiredSave.evaluate((el) => {
    // React attaches synthetic handlers; a real click target with no app-level
    // onClick still won't change any app state — verified via the name check above
    // and this data-unwired flag co-located with the same PlannerTopToolbar item.
    return el.getAttribute("data-unwired");
  });

  await page.screenshot({ path: path.join(EVIDENCE, "12-unwired-toolbar.png"), fullPage: false });
  fs.writeFileSync(
    path.join(EVIDENCE, "12-unwired-toolbar-dom.txt"),
    [
      `planner-toolbar-new has data-unwired="true": ${isUnwired}`,
      `plan name BEFORE clicking the unwired "New" button: "Should not be discarded"`,
      `plan name AFTER clicking the unwired "New" button: "${nameAfterClickingUnwiredNew}"`,
      `(if unchanged, the button is confirmed dead — a real New wipes the canvas via window.confirm + resets the name to "Untitled Plan")`,
      `planner-toolbar-save also carries data-unwired: ${saveHadClickHandler}`,
    ].join("\n"),
  );
});

// ---------------------------------------------------------------------------
// 11. Narrow/viewport — auto-arrange dialog + canvas usability at 390px
// ---------------------------------------------------------------------------

test("narrow viewport — auto-arrange dialog and canvas usability at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoWorkspace(page);
  await switchStep(page, "place");
  await page.waitForTimeout(500);

  const autoArrangeBtn = page.locator('[data-testid="btn-auto-arrange"]').first();
  let dialogVisible = false;
  let dialogBox: unknown = null;
  let normalClickBlockedByOverlap = false;
  if (await autoArrangeBtn.isVisible().catch(() => false)) {
    try {
      await autoArrangeBtn.click({ timeout: 4_000 });
      logClick("narrow (390px): open Auto-arrange dialog");
    } catch {
      normalClickBlockedByOverlap = true;
      logClick("narrow (390px): normal click on Auto-arrange INTERCEPTED by an overlapping panel — forced via DOM click to continue the audit");
      await autoArrangeBtn.evaluate((el: HTMLElement) => el.click());
    }
    await page.waitForTimeout(300);
    dialogVisible = await page.getByTestId("auto-arrange-dialog").isVisible().catch(() => false);
    dialogBox = await page.getByTestId("auto-arrange-dialog").boundingBox().catch(() => null);
  }

  const canvasBox = await page.locator(CANVAS_STAGE).boundingBox().catch(() => null);
  const viewportControlsBox = await page.getByTestId("viewport-controls").boundingBox().catch(() => null);

  await page.screenshot({ path: path.join(EVIDENCE, "13-narrow-auto-arrange.png"), fullPage: false });
  fs.writeFileSync(
    path.join(EVIDENCE, "13-narrow-auto-arrange-dom.txt"),
    [
      `viewport: 390x844, step: place`,
      `normal click on Auto-arrange button was intercepted by an overlapping panel (real pointer-event, not forced): ${normalClickBlockedByOverlap}`,
      `auto-arrange-dialog opened: ${dialogVisible}`,
      `auto-arrange-dialog box: ${JSON.stringify(dialogBox)}`,
      `dialog fits within 390px width: ${dialogBox ? (dialogBox as { x: number; width: number }).x + (dialogBox as { width: number }).width <= 390 : "n/a"}`,
      `canvas-stage box at 390px: ${JSON.stringify(canvasBox)}`,
      `canvas-stage visible/usable (nonzero area): ${canvasBox ? canvasBox.width > 0 && canvasBox.height > 0 : false}`,
      `viewport-controls box at 390px: ${JSON.stringify(viewportControlsBox)}`,
      `viewport-controls reachable (not off-screen): ${viewportControlsBox ? viewportControlsBox.x >= 0 && viewportControlsBox.x < 390 : "n/a"}`,
    ].join("\n"),
  );
});
