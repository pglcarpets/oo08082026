/**
 * Site P02 — marketing + planner entry chrome reachable at desktop and 375×812.
 */
import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const EVIDENCE = path.join(process.cwd(), "..", "results", "site", "phase-02");

async function assertMarketingChrome(page: Page): Promise<void> {
  await expect(page.locator("header").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("footer").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: /Products|Solutions|About/i }).first()).toBeVisible();
}

test.describe("Site chrome parity — desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("marketing home has header, nav, footer", async ({ page }) => {
    fs.mkdirSync(EVIDENCE, { recursive: true });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await assertMarketingChrome(page);
    await page.screenshot({ path: path.join(EVIDENCE, "desktop-home-light.png") });
  });

  test("planner entry has marketing chrome", async ({ page }) => {
    await page.goto("/planner/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Plan your office/i);
    await assertMarketingChrome(page);
    await page.screenshot({ path: path.join(EVIDENCE, "desktop-planner-entry.png") });
  });
});

test.describe("Site chrome parity — mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("marketing home chrome not clipped on phone", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.width).toBeGreaterThan(200);
    await page.screenshot({ path: path.join(EVIDENCE, "mobile-home-375.png"), fullPage: true });
  });

  test("planner entry chrome not clipped on phone", async ({ page }) => {
    await page.goto("/planner/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    await page.screenshot({
      path: path.join(EVIDENCE, "mobile-planner-entry-375.png"),
      fullPage: true,
    });
  });
});
