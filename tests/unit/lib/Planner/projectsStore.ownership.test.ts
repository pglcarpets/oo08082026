/**
 * Ownership enforcement for member-scoped store helpers (IDOR guard).
 * Disk I/O mocked; pure filter/ownership logic is the contract under test.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteProjectFiles,
  listProjectsFromDisk,
  loadProject,
  writeProject,
} from "@planner/server/plannerStore";
import {
  deletePlannerDocumentFromStore,
  listPlannerDocumentsFromStore,
  loadPlannerDocumentFromStore,
  savePlannerDocumentToStore,
} from "@planner/lib/projectsStore";

vi.mock("@planner/lib/plannerPersistenceMode", () => ({
  getPlannerPersistenceMode: vi.fn(() => "disk"),
  isPlannerPersistenceConfigured: vi.fn(() => true),
}));

vi.mock("@planner/server/plannerStore", () => ({
  listProjectsFromDisk: vi.fn(),
  loadProject: vi.fn(),
  writeProject: vi.fn(),
  deleteProjectFiles: vi.fn(),
  nowIso: vi.fn(() => "2026-07-31T18:00:00.000Z"),
}));

const alice = "user-alice";
const bob = "user-bob";

function projectRow(
  id: string,
  userId: string | null,
  name = id,
): Record<string, unknown> {
  return {
    id,
    name,
    user_id: userId,
    canvas_json: { objects: [] },
    objects_count: 0,
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
    status: "active",
  };
}

describe("projectsStore ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(writeProject).mockResolvedValue(undefined);
    vi.mocked(deleteProjectFiles).mockResolvedValue(true);
  });

  describe("listPlannerDocumentsFromStore", () => {
    it("returns all projects when userId is omitted (admin)", async () => {
      vi.mocked(listProjectsFromDisk).mockResolvedValue([
        projectRow("a", alice),
        projectRow("b", bob),
        projectRow("legacy", null),
      ]);
      const docs = await listPlannerDocumentsFromStore();
      expect(docs.map((d) => d.id).sort()).toEqual(["a", "b", "legacy"]);
    });

    it("filters to owner when userId is set; excludes null owner", async () => {
      vi.mocked(listProjectsFromDisk).mockResolvedValue([
        projectRow("a", alice),
        projectRow("b", bob),
        projectRow("legacy", null),
      ]);
      const docs = await listPlannerDocumentsFromStore({ userId: alice });
      expect(docs.map((d) => d.id)).toEqual(["a"]);
    });
  });

  describe("loadPlannerDocumentFromStore", () => {
    it("returns null for non-owner when userId is set", async () => {
      vi.mocked(loadProject).mockResolvedValue(projectRow("a", alice));
      expect(await loadPlannerDocumentFromStore("a", bob)).toBeNull();
    });

    it("returns null for legacy null owner when userId is set", async () => {
      vi.mocked(loadProject).mockResolvedValue(projectRow("legacy", null));
      expect(await loadPlannerDocumentFromStore("legacy", alice)).toBeNull();
    });

    it("returns document for matching owner", async () => {
      vi.mocked(loadProject).mockResolvedValue(projectRow("a", alice, "Alice Plan"));
      const doc = await loadPlannerDocumentFromStore("a", alice);
      expect(doc?.id).toBe("a");
      expect(doc?.name).toBe("Alice Plan");
    });

    it("returns any document when userId is omitted (admin)", async () => {
      vi.mocked(loadProject).mockResolvedValue(projectRow("b", bob));
      const doc = await loadPlannerDocumentFromStore("b");
      expect(doc?.id).toBe("b");
    });
  });

  describe("deletePlannerDocumentFromStore", () => {
    it("refuses delete for non-owner", async () => {
      vi.mocked(loadProject).mockResolvedValue(projectRow("a", alice));
      expect(await deletePlannerDocumentFromStore("a", bob)).toBe(false);
      expect(deleteProjectFiles).not.toHaveBeenCalled();
    });

    it("deletes for matching owner", async () => {
      vi.mocked(loadProject).mockResolvedValue(projectRow("a", alice));
      expect(await deletePlannerDocumentFromStore("a", alice)).toBe(true);
      expect(deleteProjectFiles).toHaveBeenCalledWith("a");
    });

    it("deletes without ownership check when userId omitted", async () => {
      expect(await deletePlannerDocumentFromStore("a")).toBe(true);
      expect(deleteProjectFiles).toHaveBeenCalledWith("a");
      expect(loadProject).not.toHaveBeenCalled();
    });
  });

  describe("savePlannerDocumentToStore", () => {
    it("throws when overwriting another user's plan", async () => {
      vi.mocked(loadProject).mockResolvedValue(projectRow("a", alice));
      await expect(
        savePlannerDocumentToStore(
          {
            id: "a",
            name: "Hijack",
            status: "active",
            projectName: "Hijack",
            itemCount: 0,
            scene: {},
            payload: {},
          },
          { userId: bob },
        ),
      ).rejects.toThrow(/FORBIDDEN/);
      expect(writeProject).not.toHaveBeenCalled();
    });

    it("writes with user_id for new plan under member", async () => {
      vi.mocked(loadProject).mockResolvedValue(null);
      await savePlannerDocumentToStore(
        {
          id: "new-1",
          name: "Mine",
          status: "active",
          projectName: "Mine",
          itemCount: 0,
          scene: { objects: [] },
          payload: {},
        },
        { userId: alice, saveId: "new-1" },
      );
      expect(writeProject).toHaveBeenCalledWith(
        expect.objectContaining({ id: "new-1", user_id: alice, name: "Mine" }),
      );
    });
  });
});
