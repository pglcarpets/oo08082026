/**
 * Contract tests for forked Planner project-by-id API.
 * Target surface: GET|PATCH|DELETE /api/Planner/projects/[id]
 * withAuth (member + rate limit + CSRF on mutate); CSRF/rateLimit mocked here.
 *
 * Persistence mode is pinned to `disk` rather than left to `DEV_AUTH_BYPASS`
 * parsing — these are disk-path contract tests, and the supabase branch would
 * otherwise reach the network.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteProjectFiles,
  loadProject,
  nowIso,
  writeBytes,
  writeProject,
} from "@planner/server/plannerStore";
import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { createAuthServerClient } from '@/platform/supabase/server';
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";
import { DELETE, GET, PATCH } from "@/app/api/Planner/projects/[id]/route";

vi.mock("@planner/lib/plannerPersistenceMode", () => ({
  getPlannerPersistenceMode: () => "disk",
  isPlannerPersistenceConfigured: () => true,
}));

vi.mock("@/platform/supabase/server", () => ({
  createAuthServerClient: vi.fn(),
}));

vi.mock("@planner/server/plannerStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@planner/server/plannerStore")>();
  return {
    ...actual,
    loadProject: vi.fn(),
    writeProject: vi.fn(),
    writeBytes: vi.fn(),
    deleteProjectFiles: vi.fn(),
    nowIso: vi.fn(() => "2026-07-31T15:30:00.000Z"),
  };
});

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn(),
}));

const routeContext = { params: Promise.resolve({ id: "p_office_abc123" }) };

function existingProject(overrides: Record<string, unknown> = {}) {
  return {
    id: "p_office_abc123",
    name: "Office",
    canvas_json: { objects: [{ type: "desk" }] },
    sheet: { units: "mm" },
    layers: [{ name: "base" }],
    thumbnail_url: null as string | null,
    objects_count: 1,
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("app/api/Planner/projects/[id]/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createAuthServerClient).mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
    } as never);
    vi.mocked(nowIso).mockReturnValue("2026-07-31T15:30:00.000Z");
    vi.mocked(writeProject).mockResolvedValue(undefined);
    vi.mocked(writeBytes).mockResolvedValue(undefined);
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 0 }));
    vi.mocked(validateCsrfRequest).mockResolvedValue(true);
  });

  it("returns 401 for an anonymous caller (member gate, parity with /api/plans)", async () => {
    vi.mocked(createAuthServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as never);

    const res = await GET(
      new NextRequest("http://localhost/api/Planner/projects/p_office_abc123"),
      routeContext,
    );
    expect(res.status).toBe(401);
    expect(loadProject).not.toHaveBeenCalled();
  });

  describe("GET", () => {
    it("returns 200 with the project record when found", async () => {
      const project = existingProject();
      vi.mocked(loadProject).mockResolvedValue(project);

      const res = await GET(new NextRequest("http://localhost/api/Planner/projects/p_office_abc123"), routeContext);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(project);
      expect(loadProject).toHaveBeenCalledWith("p_office_abc123");
    });

    it("returns 404 { detail: Project not found } when missing", async () => {
      vi.mocked(loadProject).mockResolvedValue(null);

      const res = await GET(new NextRequest("http://localhost/api/Planner/projects/missing"), {
        params: Promise.resolve({ id: "missing" }),
      });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ detail: "Project not found" });
    });
  });

  describe("PATCH", () => {
    const patchJson = (body: unknown, id = "p_office_abc123") =>
      new NextRequest(`http://localhost/api/Planner/projects/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

    it("returns 404 when the project does not exist", async () => {
      vi.mocked(loadProject).mockResolvedValue(null);

      const res = await PATCH(patchJson({ name: "Nope" }), routeContext);
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ detail: "Project not found" });
      expect(writeProject).not.toHaveBeenCalled();
    });

    it("updates name, canvas_json (and objects_count), sheet, layers, and updated_at", async () => {
      const project = existingProject();
      vi.mocked(loadProject).mockResolvedValue(project);

      const res = await PATCH(
        patchJson({
          name: "Renamed Office",
          canvas_json: { objects: [1, 2, 3] },
          sheet: { units: "in" },
          layers: [{ name: "furniture" }],
        }),
        routeContext,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({
        id: "p_office_abc123",
        name: "Renamed Office",
        canvas_json: { objects: [1, 2, 3] },
        sheet: { units: "in" },
        layers: [{ name: "furniture" }],
        objects_count: 3,
        updated_at: "2026-07-31T15:30:00.000Z",
        created_at: "2026-07-01T00:00:00.000Z",
      });
      expect(writeProject).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Renamed Office", objects_count: 3 }),
      );
    });

    it("sets objects_count to 0 when canvas_json has non-array objects", async () => {
      const project = existingProject({ objects_count: 5 });
      vi.mocked(loadProject).mockResolvedValue(project);

      const res = await PATCH(
        patchJson({ canvas_json: { objects: "nope" } }),
        routeContext,
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.objects_count).toBe(0);
    });

    it("does not change name when name is not a string", async () => {
      const project = existingProject({ name: "Keep Me" });
      vi.mocked(loadProject).mockResolvedValue(project);

      const res = await PATCH(patchJson({ name: 42 }), routeContext);
      expect(res.status).toBe(200);
      expect((await res.json()).name).toBe("Keep Me");
    });

    it("writes thumbnail and sets thumbnail_url under /api/files/projects", async () => {
      const project = existingProject();
      vi.mocked(loadProject).mockResolvedValue(project);
      const pngB64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

      const res = await PATCH(
        patchJson({ thumbnail_png: `data:image/png;base64,${pngB64}` }),
        routeContext,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.thumbnail_url).toBe("/api/files/projects/p_office_abc123_thumb.png");
      expect(writeBytes).toHaveBeenCalledOnce();
      const filePath = String(vi.mocked(writeBytes).mock.calls[0]![0]).replaceAll("\\", "/");
      expect(filePath).toContain("p_office_abc123_thumb.png");
    });

    it("returns 400 { detail } for malformed JSON", async () => {
      vi.mocked(loadProject).mockResolvedValue(existingProject());

      const res = await PATCH(
        new NextRequest("http://localhost/api/Planner/projects/p_office_abc123", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: "{bad",
        }),
        routeContext,
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ detail: "Malformed JSON body" });
      expect(writeProject).not.toHaveBeenCalled();
    });

    it("returns 400 { detail } for invalid thumbnail data URL", async () => {
      vi.mocked(loadProject).mockResolvedValue(existingProject());

      const res = await PATCH(patchJson({ thumbnail_png: "not-a-data-url" }), routeContext);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ detail: "Expected a data: URL" });
    });
  });

  describe("DELETE", () => {
    it("returns 200 { ok: true } when files are removed", async () => {
      vi.mocked(deleteProjectFiles).mockResolvedValue(true);

      const res = await DELETE(
        new NextRequest("http://localhost/api/Planner/projects/p_office_abc123", {
          method: "DELETE",
        }),
        routeContext,
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect(deleteProjectFiles).toHaveBeenCalledWith("p_office_abc123");
    });

    it("returns 404 { detail: Project not found } when nothing matched", async () => {
      vi.mocked(deleteProjectFiles).mockResolvedValue(false);

      const res = await DELETE(
        new NextRequest("http://localhost/api/Planner/projects/ghost", { method: "DELETE" }),
        { params: Promise.resolve({ id: "ghost" }) },
      );

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ detail: "Project not found" });
    });
  });
});
