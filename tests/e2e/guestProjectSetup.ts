import { expect, type Page } from "@playwright/test";

import {
  PLANNER_FABRIC_STAGE,
  PLANNER_PRIMARY_CANVAS,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

/**
 * Clears all planner-owned browser storage (localStorage + IndexedDB).
 * Scoped to planner keys only — does NOT clear auth tokens or unrelated keys.
 *
 * localStorage prefixes cleared:
 *   - "cad-suite:planner:"          (draft envelopes)
 *   - "oando-project-setup-complete-" (setup gate completion flag)
 *   - "oando-planner-startup-intent-" (consume-once starting mode)
 *   - "planner-"                    (chrome layout, preferences, claimed flag, migration flag)
 *
 * IndexedDB databases deleted:
 *   - "planner-workspace-db"        (autosave projects + history)
 *   - "buddy-planner-db"            (legacy — migrated on first open)
 *
 * Call inside page.addInitScript so it runs before any app code.
 */
const PLANNER_LS_PREFIXES = [
  "cad-suite:planner:",
  "oando-project-setup-complete-",
  "oando-planner-startup-intent-",
  "planner-",
] as const;

/**
 * Clears planner storage on the current origin (evaluate).
 * Safe for hard-reload tests: does **not** install an init script that would
 * wipe IndexedDB again on `page.reload()`.
 * Page must already be on the app origin.
 */
export async function clearPlannerStorageInPage(page: Page): Promise<void> {
  await page.evaluate(async (prefixes) => {
    for (const key of Object.keys(localStorage)) {
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
    const deleteDb = (name: string) =>
      new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(name);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    await deleteDb("planner-workspace-db");
    await deleteDb("buddy-planner-db");
  }, [...PLANNER_LS_PREFIXES]);
}

const PLANNER_STORAGE_CLEAR_INIT_KEY = "__oandoPlannerStorageClearInit";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Resolve the scoped IndexedDB key for the guest draft in the current URL. */
export function getGuestPlannerStorageProjectId(page: Page): string {
  const id = new URL(page.url()).searchParams.get("id");
  if (!id || !UUID_PATTERN.test(id)) {
    throw new Error(`Guest Planner URL is missing a valid UUID: ${page.url()}`);
  }
  return `planner-guest-local:${id}`;
}

/**
 * Clears planner storage before any app code runs (init script).
 * Re-runs on every navigation for this page — **do not** use when the test
 * needs IndexedDB to survive `page.reload()` (use `clearPlannerStorageInPage` once instead).
 *
 * Idempotent per page: repeated calls must not stack multiple init scripts (breaks IDB on repeat navigations).
 */
export async function clearPlannerStorage(page: Page): Promise<void> {
  await page.addInitScript(
    ({ prefixes, initKey }: { prefixes: string[]; initKey: string }) => {
      const root = window as unknown as Record<string, boolean>;
      if (root[initKey]) return;
      root[initKey] = true;

      for (const key of Object.keys(localStorage)) {
        if (prefixes.some((prefix) => key.startsWith(prefix))) {
          localStorage.removeItem(key);
        }
      }
      void indexedDB.deleteDatabase("planner-workspace-db");
      void indexedDB.deleteDatabase("buddy-planner-db");
    },
    {
      prefixes: [...PLANNER_LS_PREFIXES],
      initKey: PLANNER_STORAGE_CLEAR_INIT_KEY,
    },
  );
}

/**
 * Setup gate H1 differs by breakpoint:
 * - desktop/tablet aside: "Set up your space in 30 seconds"
 * - phone (sm:hidden form header): "Set up in 30 seconds"
 */
export const PLANNER_SETUP_HEADING =
  /Set up (?:your space(?: in 30 seconds)?|in 30 seconds)/i;

function plannerSetupHeading(page: Page) {
  return page.getByRole("heading", { name: PLANNER_SETUP_HEADING });
}

/** Complete the single Planner setup step when the gate is showing. */
export async function completePlannerSetupGate(
  page: Page,
  projectName: string,
): Promise<void> {
  const fabricStage = page.locator(PLANNER_FABRIC_STAGE);
  if (await fabricStage.isVisible().catch(() => false)) {
    return;
  }

  const setupHeading = plannerSetupHeading(page);
  const setupForm = page.getByRole("form", { name: /Project setup/i });
  const onMetadataStep = await Promise.race([
    setupHeading
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(() => true),
    setupForm
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(() => true),
  ]).catch(() => false);

  if (onMetadataStep) {
    const nameInput = page.getByLabel("Project name");
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill(projectName);

    const submit = page.getByRole("button", {
      name: /Open planner|Preparing workspace/i,
    });
    await expect(submit).toBeEnabled({ timeout: 60_000 });
    await submit.click();
    await setupHeading
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(async () => {
        if (await submit.isEnabled().catch(() => false)) {
          await submit.click();
        }
      });
    // Phone heading may already be gone; form is the durable gate marker.
    await setupForm
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => undefined);
  }

  await expect
    .poll(async () => fabricStage.isVisible().catch(() => false), {
      timeout: 90_000,
    })
    .toBe(true);
}

/**
 * After hard reload with preserved localStorage, wait for either the setup gate
 * or live Fabric — cold dev under contention can exceed a single 25s canvas wait.
 */
export async function resumeGuestPlannerAfterReload(
  page: Page,
  projectName: string,
): Promise<void> {
  const fabricStage = page.locator(PLANNER_FABRIC_STAGE);
  await expect
    .poll(
      async () => {
        if (await fabricStage.isVisible().catch(() => false)) return "canvas";
        if (
          await plannerSetupHeading(page)
            .isVisible()
            .catch(() => false)
        ) {
          return "setup";
        }
        if (
          await page
            .getByRole("form", { name: /Project setup/i })
            .isVisible()
            .catch(() => false)
        ) {
          return "setup";
        }
        if (await page.locator('[data-testid="topbar"]').isVisible().catch(() => false)) {
          return "chrome";
        }
        return "";
      },
      { timeout: 60_000 },
    )
    .not.toBe("");

  await completePlannerSetupGate(page, projectName);
  await waitForPlannerCanvas(page, { timeoutMs: 60_000 });
}

async function navigatePlannerWorkspace(page: Page): Promise<void> {
  // Phase 3a audit correction (2026-08-02): "/planner/guest/" and "/planner/canvas/"
  // are not real routes in site/app — proxy.ts 308-redirects both to "/ooplanner"
  // (confirmed live). "?plannerDevTools=1" maps to no feature flag anywhere in
  // site/ (grep: zero matches) — it is dead query-string plumbing. Go straight
  // to the real route so this helper does not depend on redirect behavior.
  await page.goto("/ooplanner", { waitUntil: "domcontentloaded", timeout: 60_000 });
}

/**
 * Complete the guest project setup gate when it appears (fresh session).
 *
 * `reloadSafe: true` clears storage once in-page (no init-script wipe on later
 * `page.reload()`). Use for persistence / hard-reload journeys.
 */
export async function enterGuestPlannerWorkspace(
  page: Page,
  options: {
    projectName?: string;
    navigate?: boolean;
    preservePlannerState?: boolean;
    /** One-shot in-page clear so IndexedDB survives reload. */
    reloadSafe?: boolean;
  } = {},
): Promise<void> {
  if (options.reloadSafe) {
    if (options.navigate !== false) {
      await navigatePlannerWorkspace(page);
    }
    if (!options.preservePlannerState) {
      await clearPlannerStorageInPage(page);
      await navigatePlannerWorkspace(page);
    }
  } else {
    if (!options.preservePlannerState) {
      await clearPlannerStorage(page);
    }
    if (options.navigate !== false) {
      await navigatePlannerWorkspace(page);
    }
  }

  const fabricStage = page.locator(PLANNER_FABRIC_STAGE);
  const setupHeading = plannerSetupHeading(page);
  const setupForm = page.getByRole("form", { name: /Project setup/i });

  await Promise.race([
    page.locator('[data-testid="topbar"]').waitFor({ state: "visible", timeout: 60_000 }),
    fabricStage.waitFor({ state: "visible", timeout: 60_000 }),
    setupHeading.waitFor({ state: "visible", timeout: 60_000 }),
    setupForm.waitFor({ state: "visible", timeout: 60_000 }),
  ]);

  await completePlannerSetupGate(
    page,
    options.projectName ?? "E2E guest workspace",
  );

  const canvasReady = async (): Promise<boolean> =>
    page.locator(PLANNER_PRIMARY_CANVAS).isVisible().catch(() => false);

  if (!(await canvasReady())) {
    await navigatePlannerWorkspace(page);
    await completePlannerSetupGate(
      page,
      options.projectName ?? "E2E guest workspace",
    );
  }

  // Canvas is the gate — TopBar can lag Fabric on cold dev; metrics specs poll topbar separately.
  await waitForPlannerCanvas(page, { timeoutMs: 60_000 });
}
