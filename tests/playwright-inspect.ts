import { chromium } from "@playwright/test";

type PlannerRuntimeProbe = {
  exportDraft?: () => string | null | undefined;
};

type WindowWithPlannerRuntime = Window & {
  plannerRuntime?: PlannerRuntimeProbe;
};

type FabricObjectLike = {
  name?: unknown;
  type?: unknown;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  visible?: unknown;
};

type FabricCanvasJson = {
  objects?: FabricObjectLike[];
};

type CanvasObjectSummary = {
  name: unknown;
  type: unknown;
  left: number;
  top: number;
  width: number;
  height: number;
  visible: unknown;
};

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log("Navigating to local guest planner to clear storage first...");
  await page.goto("http://localhost:3000/planner/guest/?plannerDevTools=1");

  await page.evaluate(() => {
    localStorage.clear();
    void indexedDB.deleteDatabase("planner-workspace-db");
    void indexedDB.deleteDatabase("buddy-planner-db");
  });

  console.log("Reloading page to start completely fresh...");
  await page.reload();

  console.log("Waiting for topbar or setup gate...");
  const setupHeading = page.getByRole("heading", { name: /Set up your space/i });
  const topbar = page.locator('[data-testid="topbar"]');

  await Promise.race([
    setupHeading.waitFor({ state: "visible", timeout: 15000 }),
    topbar.waitFor({ state: "visible", timeout: 15000 }),
  ]).catch(() => {});

  if (await setupHeading.isVisible()) {
    console.log("Setup gate is visible, completing setup...");
    await page.getByLabel("Project name").fill("Fresh Guest Workspace");
    await page.getByRole("button", { name: /Open planner/i }).click();
  }

  console.log("Waiting for topbar to be visible...");
  try {
    await topbar.waitFor({ state: "visible", timeout: 15000 });
    console.log("Topbar is visible!");
  } catch {
    console.log("Topbar did not become visible within 15s. URL:", page.url());
  }

  // Allow canvas/fabric to settle and render
  await page.waitForTimeout(5000);

  console.log("Checking page title:", await page.title());

  // Inspect the canvas state
  const stateInfo = await page.evaluate(() => {
    try {
      const runtime = (window as WindowWithPlannerRuntime).plannerRuntime;
      const hasRuntime = !!runtime;
      
      let canvasObjects: CanvasObjectSummary[] = [];
      if (hasRuntime && runtime.exportDraft) {
        const draft = runtime.exportDraft();
        if (draft) {
          const parsed = JSON.parse(draft) as FabricCanvasJson;
          canvasObjects = (parsed.objects || []).map((o) => ({
            name: o.name,
            type: o.type,
            left: Math.round(o.left ?? 0),
            top: Math.round(o.top ?? 0),
            width: Math.round(o.width ?? 0),
            height: Math.round(o.height ?? 0),
            visible: o.visible,
          }));
        }
      }

      return {
        hasRuntime,
        objectsCount: canvasObjects.length,
        objectsList: canvasObjects,
      };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  });

  console.log("State Info:", JSON.stringify(stateInfo, null, 2));

  // Take a screenshot and save it
  const screenshotPath = "C:\\Users\\AyushWeb\\.gemini\\antigravity-ide\\brain\\287d517a-2103-4b9d-8495-c2814b740954/scratch/playwright-screenshot.png";
  console.log("Taking screenshot and saving to:", screenshotPath);
  await page.screenshot({ path: screenshotPath });

  await browser.close();
  console.log("Browser closed successfully.");
}

main().catch(err => {
  console.error("Error in playwright script:", err);
});
