/**
 * P06 Symbols inventory slice — guest planner browser verification.
 * Evidence: results/planner/world-standard-wave/06-symbols-inventory/
 */
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  placeCatalogOnCanvas,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

const EVIDENCE = path.join(
  process.cwd(),
  "..",
  "results",
  "planner",
  "world-standard-wave",
  "06-symbols-inventory",
);

test.describe.configure({ mode: "serial", timeout: 180_000 });

test("P06 symbols inventory slice on guest planner", async ({ page, request }) => {
  fs.mkdirSync(EVIDENCE, { recursive: true });

  const api = await request.get("/api/planner/catalog/svg-blocks/");
  expect(api.ok()).toBeDefined();
  const envelope = (await api.json()) as {
    items?: Array<{ slug?: string }>;
    total?: number;
  };
  const items = envelope.items ?? [];
  expect(items.length).toBe(5);
  expect(items.some((i) => i.slug === "chaise-lounge-001")).toBeDefined();
  expect(items.some((i) => i.slug === "desk-linear-1200-001")).toBeDefined();
  fs.writeFileSync(
    path.join(EVIDENCE, "api-svg-blocks.json"),
    `${JSON.stringify({ total: items.length, slugs: items.map((i) => i.slug) }, null, 2)}\n`,
  );

  await enterGuestPlannerWorkspace(page, { projectName: "P06 symbols inventory" });
  await waitForPlannerCanvas(page);
  await page.getByRole("radio", { name: "2D", exact: true }).click();
  await waitForPlannerCanvas(page);

  await page.screenshot({
    path: path.join(EVIDENCE, "01-workspace-ready.png"),
    fullPage: false,
  });

  const categoriesNav = page.getByRole("navigation", { name: "Inventory categories" });
  const symbolsBtn = categoriesNav.getByRole("button", { name: "Symbols" });
  await expect(symbolsBtn).toBeVisible({ timeout: 15_000 });
  await symbolsBtn.click();

  const svgCatalogBtn = categoriesNav.getByRole("button", { name: "SVG catalog" });
  await expect(svgCatalogBtn).toBeVisible({ timeout: 10_000 });
  await svgCatalogBtn.click();

  await page.screenshot({
    path: path.join(EVIDENCE, "02-symbols-svg-catalog.png"),
    fullPage: false,
  });

  const catalog = page.getByRole("region", { name: "Catalog browser" });
  await expect(page.getByText("No elements found")).not.toBeVisible({ timeout: 15_000 });
  await expect(catalog.getByText("Chaise Lounge")).toBeVisible({ timeout: 15_000 });
  await expect(catalog.getByText("Desk Linear 1200")).toBeVisible({ timeout: 15_000 });

  await page.screenshot({
    path: path.join(EVIDENCE, "03-inventory-items.png"),
    fullPage: false,
  });

  const furnitureBefore = await page
    .locator(".pw-status-bar > span")
    .filter({ hasText: /^\d+ furniture$/ })
    .textContent()
    .then((t) => Number.parseInt(t?.match(/^(\d+)/)?.[1] ?? "0", 10));

  await placeCatalogOnCanvas(page, 0.45, 0.42, /Add Chaise Lounge to canvas/i);
  await expect
    .poll(
      async () => {
        const t = await page
          .locator(".pw-status-bar > span")
          .filter({ hasText: /^\d+ furniture$/ })
          .textContent();
        return Number.parseInt(t?.match(/^(\d+)/)?.[1] ?? "0", 10);
      },
      { timeout: 25_000 },
    )
    .toBeGreaterThan(furnitureBefore);

  await page.screenshot({
    path: path.join(EVIDENCE, "04-chaise-placed.png"),
    fullPage: false,
  });

  const mid = await page
    .locator(".pw-status-bar > span")
    .filter({ hasText: /^\d+ furniture$/ })
    .textContent()
    .then((t) => Number.parseInt(t?.match(/^(\d+)/)?.[1] ?? "0", 10));

  await placeCatalogOnCanvas(page, 0.58, 0.52, /Add Desk Linear 1200 to canvas/i);
  await expect
    .poll(
      async () => {
        const t = await page
          .locator(".pw-status-bar > span")
          .filter({ hasText: /^\d+ furniture$/ })
          .textContent();
        return Number.parseInt(t?.match(/^(\d+)/)?.[1] ?? "0", 10);
      },
      { timeout: 25_000 },
    )
    .toBeGreaterThan(mid);

  await page.screenshot({
    path: path.join(EVIDENCE, "05-desk-placed.png"),
    fullPage: false,
  });
  await page.locator('[data-testid="planner-2d-canvas"] canvas').screenshot({
    path: path.join(EVIDENCE, "06-canvas-both.png"),
  });

  fs.writeFileSync(
    path.join(EVIDENCE, "run.json"),
    `${JSON.stringify(
      {
        phase: "P06-symbols-inventory",
        date: new Date().toISOString(),
        apiItems: items.length,
        slugs: items.map((i) => i.slug),
        furnitureAfter: await page
          .locator(".pw-status-bar > span")
          .filter({ hasText: /^\d+ furniture$/ })
          .textContent(),
        status: "pass",
      },
      null,
      2,
    )}\n`,
  );
});
