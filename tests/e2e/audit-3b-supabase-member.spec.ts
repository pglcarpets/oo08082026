/**
 * WRK-S09 — Member Planner path without DEV_AUTH_BYPASS.
 *
 * Real Supabase member session (E2E_SUPABASE_USER_*), not guest entry.
 * Flow: list → create → load → save → hard reload.
 * Evidence: results/planner/audit-3b-supabase/
 */
import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import {
  completePlannerSetupGate,
  clearPlannerStorageInPage,
} from "./guestProjectSetup";
import {
  dragOnCanvas,
  ensurePlannerCanvasOnScreen,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

/** Prefer repo-root `results/` when Playwright is launched from the monorepo root. */
const EVIDENCE = fs.existsSync(path.join(process.cwd(), "package.json"))
  ? path.join(process.cwd(), "results", "planner", "audit-3b-supabase")
  : path.join(process.cwd(), "..", "results", "planner", "audit-3b-supabase");

const CANVAS_STAGE = '[data-testid="canvas-stage"]';

function requireMemberCreds(): { email: string; password: string } {
  const email = process.env.E2E_SUPABASE_USER_EMAIL?.trim() ?? "";
  const password = process.env.E2E_SUPABASE_USER_PASSWORD?.trim() ?? "";
  if (!email || !password) {
    throw new Error(
      "WRK-S09 requires E2E_SUPABASE_USER_EMAIL and E2E_SUPABASE_USER_PASSWORD",
    );
  }
  return { email, password };
}

function assertBypassOff(): void {
  const bypass = process.env.DEV_AUTH_BYPASS;
  if (bypass === "1") {
    throw new Error(
      "WRK-S09 forbids DEV_AUTH_BYPASS=1 — set DEV_AUTH_BYPASS=0 (or unset) for this suite",
    );
  }
}

async function signInAsMember(
  page: Page,
  creds: { email: string; password: string },
  nextPath: string,
): Promise<void> {
  const next = encodeURIComponent(nextPath);
  // networkidle: AccessForm is a client server-action; native form POST before
  // hydration drops the session and leaves us on /access (no cookies).
  await page.goto(`/access?next=${next}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  await expect(page.getByTestId("access-sign-in-page")).toBeVisible({
    timeout: 30_000,
  });
  const emailInput = page.locator("#access-email");
  const passwordInput = page.locator("#access-password");
  const submit = page.getByRole("button", { name: /^Sign In$/i });
  await expect(emailInput).toBeEnabled({ timeout: 15_000 });
  await expect(submit).toBeEnabled({ timeout: 15_000 });
  await emailInput.fill(creds.email);
  await passwordInput.fill(creds.password);
  await expect(emailInput).toHaveValue(creds.email);
  await submit.click();
  await page.waitForURL((url) => !url.pathname.includes("/access"), {
    timeout: 60_000,
  });
  // Session cookie from admin/auth Supabase project.
  const cookies = await page.context().cookies();
  const hasAuthCookie = cookies.some((c) =>
    /auth-token|sb-.*-auth/i.test(c.name),
  );
  if (!hasAuthCookie) {
    throw new Error(
      "Member sign-in completed navigation but no Supabase auth cookie was set",
    );
  }
}

function writeEvidence(name: string, body: string): void {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.writeFileSync(path.join(EVIDENCE, name), body, "utf8");
}

test.describe.configure({ mode: "serial", timeout: 180_000 });

test.describe("WRK-S09 member Planner (no DEV_AUTH_BYPASS)", () => {
  test.beforeAll(() => {
    assertBypassOff();
    fs.mkdirSync(EVIDENCE, { recursive: true });
    writeEvidence(
      "00-env.txt",
      [
        `DEV_AUTH_BYPASS=${JSON.stringify(process.env.DEV_AUTH_BYPASS ?? "")}`,
        `NODE_ENV=${process.env.NODE_ENV ?? ""}`,
        `PLAYWRIGHT_BASE_URL=${process.env.PLAYWRIGHT_BASE_URL ?? ""}`,
        `has_E2E_USER=${Boolean(process.env.E2E_SUPABASE_USER_EMAIL?.trim())}`,
        `timestamp=${new Date().toISOString()}`,
      ].join("\n") + "\n",
    );
  });

  test("member list → create → load → save → reload via Supabase", async ({
    page,
  }) => {
    const creds = requireMemberCreds();
    const projectName = `WRK-S09 member ${Date.now()}`;
    const log: string[] = [];
    const step = (msg: string) => {
      log.push(`${log.length + 1}. ${msg}`);
    };

    // --- sign in (real member, not guest) ---
    await signInAsMember(page, creds, "/ooplanner/projects");
    step(`signed in as member → ${page.url()}`);
    await expect(page).toHaveURL(/\/ooplanner\/projects/, { timeout: 30_000 });
    await expect(page.getByTestId("projects-page")).toBeVisible({
      timeout: 30_000,
    });
    // Must not be guest entry — projects list uses member API (role: member).
    const listStatus = await page.evaluate(async () => {
      const res = await fetch("/api/Planner/projects/", {
        credentials: "include",
        cache: "no-store",
      });
      return { status: res.status, ok: res.ok };
    });
    step(
      `list projects API status=${listStatus.status} ok=${listStatus.ok}`,
    );
    expect(listStatus.status).toBe(200);
    await page.screenshot({
      path: path.join(EVIDENCE, "01-member-projects-list.png"),
      fullPage: false,
    });

    // --- create (new plan from list) ---
    await page.getByTestId("btn-new-project").click();
    step("clicked New plan");
    await expect(page).toHaveURL(/\/ooplanner\/?(\?|$)/, { timeout: 30_000 });
    // Clear only planner draft storage once; keep auth cookies.
    await clearPlannerStorageInPage(page);
    await page.goto("/ooplanner", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await completePlannerSetupGate(page, projectName);
    await waitForPlannerCanvas(page, { timeoutMs: 90_000 });
    step(`workspace open with setup name "${projectName}"`);
    await page.screenshot({
      path: path.join(EVIDENCE, "02-member-workspace-created.png"),
      fullPage: false,
    });

    // --- seed geometry (top toolbar Draw group — not Canvas tools rail) ---
    await page
      .locator('.pw-step-bar__btn[data-step="draw"]')
      .click()
      .catch(async () => {
        await page
          .getByRole("button", { name: /Draw room/i })
          .first()
          .click({ force: true });
      });
    await ensurePlannerCanvasOnScreen(page);
    const wallTool = page
      .getByTestId("tool-wall")
      .or(
        page
          .getByRole("toolbar", { name: "Planner toolbar" })
          .getByRole("button", { name: /^Wall/i }),
      );
    await expect(wallTool.first()).toBeVisible({ timeout: 15_000 });
    await wallTool.first().click({ force: true });
    step("armed Wall tool");
    await dragOnCanvas(page, { rx: 0.25, ry: 0.4 }, { rx: 0.75, ry: 0.55 });
    await page.waitForTimeout(400);
    step("dragged wall on canvas");

    // --- save (createProject → Supabase oando_plans, CSRF via browserApiFetch) ---
    const nameInput = page
      .getByTestId("project-name")
      .or(page.getByRole("textbox", { name: /Plan name/i }));
    await nameInput.first().fill(projectName);
    step(`set project-name to "${projectName}"`);
    const saveBtn = page
      .getByTestId("btn-save")
      .or(
        page
          .getByRole("toolbar", { name: "Planner toolbar" })
          .getByRole("button", { name: /^Save$/i }),
      );
    await saveBtn.first().click();
    step("clicked save");
    await expect
      .poll(async () => saveBtn.first().isEnabled(), { timeout: 45_000 })
      .toBe(true);
    // Detect save failure toast early.
    const saveFailed = await page
      .getByText(/Save failed/i)
      .isVisible()
      .catch(() => false);
    expect(saveFailed).toBe(false);
    await expect(page).toHaveURL(/\/ooplanner\/projects\/[^/]+/, {
      timeout: 45_000,
    });
    const urlAfterSave = page.url();
    const projectId =
      new URL(urlAfterSave).pathname.match(
        /\/ooplanner\/projects\/([^/]+)/,
      )?.[1] ?? "";
    expect(projectId.length).toBeGreaterThan(8);
    step(`saved → ${urlAfterSave}`);

    // Member GET by id (proves load path, not guest cookie storage).
    const getStatus = await page.evaluate(async (id: string) => {
      const res = await fetch(
        `/api/Planner/projects/${encodeURIComponent(id)}/`,
        { credentials: "include", cache: "no-store" },
      );
      let name = "";
      try {
        const body = (await res.json()) as { name?: string };
        name = body.name ?? "";
      } catch {
        /* ignore */
      }
      return { status: res.status, name };
    }, projectId);
    step(
      `get project API status=${getStatus.status} name=${JSON.stringify(getStatus.name)}`,
    );
    expect(getStatus.status).toBe(200);
    expect(getStatus.name).toBe(projectName);
    await page.screenshot({
      path: path.join(EVIDENCE, "03-member-after-save.png"),
      fullPage: false,
    });

    // --- hard reload (URL binding + server load) ---
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(CANVAS_STAGE)).toBeVisible({ timeout: 60_000 });
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });
    const nameField = page
      .getByTestId("project-name")
      .or(page.getByRole("textbox", { name: /Plan name/i }));
    await expect
      .poll(async () => nameField.first().inputValue(), { timeout: 30_000 })
      .toBe(projectName);
    const nameAfterReload = await nameField.first().inputValue();
    step(`reload: name="${nameAfterReload}" url=${page.url()}`);
    await page.screenshot({
      path: path.join(EVIDENCE, "04-member-after-reload.png"),
      fullPage: false,
    });

    // --- list again: project card present ---
    await page.goto("/ooplanner/projects", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByTestId("projects-page")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId(`project-${projectId}`)).toBeVisible({
      timeout: 30_000,
    });
    step(`projects list shows project-${projectId}`);
    await page.screenshot({
      path: path.join(EVIDENCE, "05-member-list-has-project.png"),
      fullPage: false,
    });

    // --- open from list (load) ---
    await page.getByTestId(`project-${projectId}`).click();
    await expect(page).toHaveURL(
      new RegExp(`/ooplanner/projects/${projectId}`),
      { timeout: 30_000 },
    );
    await waitForPlannerCanvas(page, { timeoutMs: 60_000 });
    await expect
      .poll(async () => nameField.first().inputValue(), { timeout: 30_000 })
      .toBe(projectName);
    step("opened project from list; name bound");
    await page.screenshot({
      path: path.join(EVIDENCE, "06-member-open-from-list.png"),
      fullPage: false,
    });

    writeEvidence(
      "journey.txt",
      [
        "WRK-S09 member Planner journey",
        `projectName=${projectName}`,
        `projectId=${projectId}`,
        `urlAfterSave=${urlAfterSave}`,
        `nameAfterReload=${nameAfterReload}`,
        `DEV_AUTH_BYPASS=${JSON.stringify(process.env.DEV_AUTH_BYPASS ?? "")}`,
        "",
        "steps:",
        ...log,
      ].join("\n") + "\n",
    );
    writeEvidence("click-log.txt", log.join("\n") + "\n");

    expect(nameAfterReload).toBe(projectName);
  });
});
