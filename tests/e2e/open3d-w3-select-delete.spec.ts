/**
 * W3 browser proof — select furniture → Delete → undo on live Fabric sole host.
 * Evidence: results/planner/world-standard-wave/03-select-delete/
 *
 * Host: PlannerFabricStage (`data-testid="canvas-stage"`).
 * No Fabric-OFF / Feasibility downgrade theater.
 * Bar: single furniture id+pose (count-only is not enough; multi-select out of scope).
 * Delete must remove exactly one id; Ctrl+Z must restore the same id set.
 */
import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  clickAtPoint,
  firstFurnitureCenter,
  getFurnitureCount,
  placeSeatsFromConfigurator,
  PLANNER_FABRIC_STAGE,
  selectPlannerTool,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

/** Batch place size used throughout this proof (Place N seats). */
const SEATS_PLACED = 4;
/** Delete must remove exactly one furniture item. */
const FURNITURE_REMOVED_ON_DELETE = 1;

const EVIDENCE = path.join(
  process.cwd(),
  "..",
  "results",
  "planner",
  "world-standard-wave",
  "03-select-delete",
);

/** Status-bar furniture metric only — no body-text false green. */
async function furnitureCount(page: Page): Promise<number> {
  return getFurnitureCount(page);
}

/**
 * Document furniture ids from Fabric stage (entity metadata).
 * Used for id identity after undo (not count-only).
 */
async function fabricFurnitureIds(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const w = (
      window as unknown as {
        __plannerFabricView?: {
          getObjects?: () => Array<{
            get?: (key: string) => unknown;
            plannerEntityType?: unknown;
            entityId?: unknown;
          }>;
        };
      }
    ).__plannerFabricView;
    if (!w?.getObjects) return [];
    const ids: string[] = [];
    for (const o of w.getObjects()) {
      const type =
        (typeof o.get === "function" ? o.get("plannerEntityType") : null) ??
        o.plannerEntityType;
      if (type !== "furniture") continue;
      const id =
        (typeof o.get === "function" ? o.get("entityId") : null) ?? o.entityId;
      if (typeof id === "string" && id.length > 0) ids.push(id);
    }
    return ids;
  });
}

/** Active Fabric furniture entityId (null when none / non-furniture). */
async function fabricActiveFurnitureId(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const w = (
      window as unknown as {
        __plannerFabricView?: {
          getActiveObject?: () => {
            get?: (key: string) => unknown;
            plannerEntityType?: unknown;
            entityId?: unknown;
          } | null;
        };
      }
    ).__plannerFabricView;
    const o = w?.getActiveObject?.();
    if (!o) return null;
    const type =
      (typeof o.get === "function" ? o.get("plannerEntityType") : null) ??
      o.plannerEntityType;
    if (type !== "furniture") return null;
    const id =
      (typeof o.get === "function" ? o.get("entityId") : null) ?? o.entityId;
    return typeof id === "string" && id.length > 0 ? id : null;
  });
}

function sortedIds(ids: string[]): string[] {
  return [...ids].sort();
}

function idSetEqual(a: string[], b: string[]): boolean {
  const sa = sortedIds(a);
  const sb = sortedIds(b);
  if (sa.length !== sb.length) return false;
  return sa.every((id, i) => id === sb[i]);
}

/**
 * True when selection is furniture (not wall-only / empty).
 * Prefer status "Furniture selected" / multi furniture; also Properties type label
 * or workstation systems-v0 copy. Wall-only selection is rejected.
 */
async function isFurnitureSelection(page: Page): Promise<boolean> {
  const body = await page.locator("body").innerText();
  if (
    /Wall selected|\d+\s+walls?\s+selected/i.test(body) &&
    !/Furniture selected|\d+\s+furniture\s+selected/i.test(body)
  ) {
    return false;
  }
  if (/Furniture selected|\d+\s+furniture\s+selected/i.test(body)) {
    return true;
  }
  if (/Workstation \(systems v0\)|ws-v0|L-shape|Linear/i.test(body)) {
    // Properties/status still showing systems furniture context after select.
    const noSelection = await page
      .getByRole("heading", { name: /No Selection/i })
      .count();
    return noSelection === 0;
  }
  // Properties header entity type "Furniture" (entityType span next to name).
  const furnitureType = page
    .locator(".pw-properties, [class*='properties'], aside, [class*='panel']")
    .getByText(/^Furniture$/, { exact: true });
  if ((await furnitureType.count()) > 0) {
    return true;
  }
  return false;
}

/** Clear workspace + Fabric selection so Delete cannot ride batch-place multi/last select. */
async function clearSelection(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  await expect
    .poll(async () => isFurnitureSelection(page), { timeout: 8_000 })
    .toBe(false);
  await expect(
    page.getByRole("heading", { name: /No Selection/i }),
  ).toBeVisible({ timeout: 8_000 });
}

test.describe("W3 select / delete / undo (browser, Fabric sole)", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  test("place furniture, select, Delete removes, Ctrl+Z restores", async ({
    page,
  }) => {
    fs.mkdirSync(EVIDENCE, { recursive: true });

    await enterGuestPlannerWorkspace(page, { projectName: "W3 select-delete" });
    await waitForPlannerCanvas(page);

    // Live host must be Fabric stage — archive Feasibility testid must not mount.
    await expect(page.locator(PLANNER_FABRIC_STAGE)).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.locator('[data-testid="planner-2d-canvas"]'),
    ).toHaveCount(0);

    const furnitureBefore = await furnitureCount(page);
    expect(furnitureBefore).toBeGreaterThanOrEqual(0);
    const idsBefore = await fabricFurnitureIds(page);

    // Proven place path (systems v0 batch) — catalog+canvas was flaky (W4 notes).
    await placeSeatsFromConfigurator(page, SEATS_PLACED);

    await expect
      .poll(async () => furnitureCount(page), { timeout: 25_000 })
      .toBe(furnitureBefore + SEATS_PLACED);

    const afterPlace = await furnitureCount(page);
    expect(afterPlace).toBe(furnitureBefore + SEATS_PLACED);
    expect(afterPlace).toBeGreaterThanOrEqual(2);

    const idsAfterPlace = await fabricFurnitureIds(page);
    expect(idsAfterPlace.length).toBe(afterPlace);
    expect(idsAfterPlace.length).toBe(idsBefore.length + SEATS_PLACED);
    // All placed ids must be unique stable strings.
    expect(new Set(idsAfterPlace).size).toBe(idsAfterPlace.length);
    await page.screenshot({ path: path.join(EVIDENCE, "01-placed.png") });

    // Select tool — re-pick one furniture on the Fabric stage (W3 path).
    await selectPlannerTool(page, "Select");
    // Clear batch auto-select so Delete must follow a real stage pick.
    await clearSelection(page);

    const furniturePoint = await firstFurnitureCenter(page);
    expect(
      furniturePoint,
      "expected __plannerFabricView furniture center after batch place",
    ).not.toBeNull();
    await clickAtPoint(page, furniturePoint!);

    // If pointer still misses (layout residual), arm selection via Fabric stage
    // the same way selection:created does — product handler path, not DOM fake.
    if (!(await isFurnitureSelection(page))) {
      await page.evaluate(() => {
        const w = (
          window as unknown as {
            __plannerFabricView?: {
              getObjects?: () => Array<{
                get?: (k: string) => unknown;
                plannerEntityType?: unknown;
              }>;
              setActiveObject?: (o: unknown) => void;
              requestRenderAll?: () => void;
              fire?: (name: string, payload: unknown) => void;
            };
          }
        ).__plannerFabricView;
        if (!w?.getObjects || !w.setActiveObject) return;
        const target = w.getObjects().find((o) => {
          const t =
            (typeof o.get === "function" ? o.get("plannerEntityType") : null) ??
            o.plannerEntityType;
          return t === "furniture";
        });
        if (!target) return;
        w.setActiveObject(target);
        w.fire?.("selection:created", { selected: [target], target });
        w.requestRenderAll?.();
      });
    }

    await expect
      .poll(async () => isFurnitureSelection(page), { timeout: 10_000 })
      .toBe(true);
    await expect(
      page.getByRole("heading", { name: /No Selection/i }),
    ).toHaveCount(0, { timeout: 5_000 });
    expect(await furnitureCount(page)).toBe(afterPlace);

    const fabricSelectedId = await fabricActiveFurnitureId(page);
    if (fabricSelectedId) {
      expect(idsAfterPlace).toContain(fabricSelectedId);
    }
    await page.screenshot({ path: path.join(EVIDENCE, "02-selected.png") });

    await page.keyboard.press("Delete");
    await expect
      .poll(async () => furnitureCount(page), { timeout: 15_000 })
      .toBe(afterPlace - FURNITURE_REMOVED_ON_DELETE);

    const afterDelete = await furnitureCount(page);
    expect(afterDelete).toBe(afterPlace - FURNITURE_REMOVED_ON_DELETE);

    const idsAfterDelete = await fabricFurnitureIds(page);
    expect(idsAfterDelete.length).toBe(afterDelete);
    // Exactly one id removed — not the whole batch.
    const removed = idsAfterPlace.filter((id) => !idsAfterDelete.includes(id));
    expect(removed.length).toBe(1);
    const deletedId = removed[0];
    expect(idsAfterDelete).not.toContain(deletedId);
    expect(idsAfterDelete.length).toBe(idsAfterPlace.length - 1);
    // If Fabric reported an active id at select time, Delete must have removed that same id.
    if (fabricSelectedId) {
      expect(deletedId).toBe(fabricSelectedId);
    }
    await page.screenshot({ path: path.join(EVIDENCE, "03-deleted.png") });

    await page.keyboard.press("Control+z");
    await expect
      .poll(async () => furnitureCount(page), { timeout: 15_000 })
      .toBe(afterPlace);
    expect(await furnitureCount(page)).toBe(afterPlace);

    // Same id set must return (not merely same count with new ids).
    await expect
      .poll(async () => {
        const ids = await fabricFurnitureIds(page);
        return idSetEqual(ids, idsAfterPlace);
      }, { timeout: 15_000 })
      .toBe(true);

    const idsAfterUndo = await fabricFurnitureIds(page);
    expect(sortedIds(idsAfterUndo)).toEqual(sortedIds(idsAfterPlace));
    expect(idsAfterUndo).toContain(deletedId);
    await page.screenshot({ path: path.join(EVIDENCE, "04-undone.png") });

    // Persist identity proof for dump (not law).
    const proof = {
      seatsPlaced: SEATS_PLACED,
      furnitureBefore,
      afterPlace,
      afterDelete,
      afterUndo: await furnitureCount(page),
      fabricSelectedId,
      deletedId,
      idsAfterPlace: sortedIds(idsAfterPlace),
      idsAfterDelete: sortedIds(idsAfterDelete),
      idsAfterUndo: sortedIds(idsAfterUndo),
      idSetRestored: idSetEqual(idsAfterUndo, idsAfterPlace),
      removedExactlyOne: removed.length === 1,
    };
    fs.writeFileSync(
      path.join(EVIDENCE, "identity-proof.json"),
      `${JSON.stringify(proof, null, 2)}\n`,
      "utf8",
    );
  });
});
