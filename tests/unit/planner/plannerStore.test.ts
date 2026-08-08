// @vitest-environment node
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import path from "node:path";
import { promises as fs } from "node:fs";
import {
  ensureStorageDirs,
  PROJECTS_DIR,
  listProjectsFromDisk,
  writeProject,
  loadProject,
  deleteProjectFiles,
  listCatalogFromDisk,
  nowIso,
} from "@planner/server/plannerStore";

describe("plannerStore (saved plans)", () => {
  const projectId = "p_test_unit_planner";

  beforeAll(async () => {
    process.chdir(path.resolve(__dirname, "../../.."));
    await ensureStorageDirs();
  });

  afterAll(async () => {
    await deleteProjectFiles(projectId);
  });

  it("writes and loads projects", async () => {
    const now = nowIso();
    await writeProject({
      id: projectId,
      name: "Unit Plan",
      canvas_json: { objects: [{ type: "rect" }] },
      sheet: {},
      layers: [],
      objects_count: 1,
      created_at: now,
      updated_at: now,
    });
    const loaded = await loadProject(projectId);
    expect(loaded?.name).toBe("Unit Plan");
    const list = await listProjectsFromDisk();
    expect(list.some((p) => p.id === projectId)).toBe(true);
    await expect(
      fs.access(path.join(PROJECTS_DIR, `${projectId}.json`)),
    ).resolves.toBeUndefined();
  });

  it("returns null for an unknown project", async () => {
    expect(await loadProject("p_does_not_exist")).toBeNull();
  });

  it("reports false when deleting an unknown project", async () => {
    expect(await deleteProjectFiles("p_does_not_exist")).toBe(false);
  });
});

describe("plannerStore (catalog reads)", () => {
  beforeAll(async () => {
    process.chdir(path.resolve(__dirname, "../../.."));
    await ensureStorageDirs();
  });

  it("lists the furniture library the Planner places on plans", async () => {
    const items = await listCatalogFromDisk();
    expect(Array.isArray(items)).toBe(true);
    for (const item of items) {
      expect(typeof item.id).toBe("string");
    }
  });

  it("exposes dimensions on catalog entries", async () => {
    const items = await listCatalogFromDisk();
    const withDims = items.filter((i) => i.dimensions && typeof i.dimensions === "object");
    // The seeded library ships dimensioned entries.
    expect(withDims.length).toBeGreaterThan(0);
  });
});
