/**
 * Contract tests for forked Planner projects collection API.
 * Target surface for CRM/planner clients: GET|POST /api/Planner/projects
 *
 * Disk I/O is mocked; pure helpers (readJsonBody, BadRequestError, slugify)
 * stay real so error-path shapes match production.
 * withAuth (member + rate limit + CSRF on POST); CSRF/rateLimit mocked here.
 *
 * Persistence mode is pinned to `disk` rather than left to `DEV_AUTH_BYPASS`
 * parsing — these are disk-path contract tests, and the supabase branch would
 * otherwise reach the network.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listProjectsFromDisk,
  shortId,
  nowIso,
  writeBytes,
  writeProject,
} from "@planner/server/plannerStore";
import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { createAuthServerClient } from '@/platform/supabase/server';
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";
import { GET, POST } from "@/app/api/Planner/projects/route";

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
    listProjectsFromDisk: vi.fn(),
    writeProject: vi.fn(),
    writeBytes: vi.fn(),
    shortId: vi.fn(() => "abc123"),
    nowIso: vi.fn(() => "2026-07-31T12:00:00.000Z"),
  };
});

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn(),
}));

const sampleProject = {
  id: "p_office_abc123",
  name: "Office",
  canvas_json: { objects: [{ type: "wall" }] },
  sheet: {},
  layers: [],
  thumbnail_url: null,
  objects_count: 1,
  created_at: "2026-07-31T12:00:00.000Z",
  updated_at: "2026-07-31T12:00:00.000Z",
};

describe("app/api/Planner/projects/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createAuthServerClient).mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
    } as never);
    vi.mocked(shortId).mockReturnValue("abc123");
    vi.mocked(nowIso).mockReturnValue("2026-07-31T12:00:00.000Z");
    vi.mocked(writeProject).mockResolvedValue(undefined);
    vi.mocked(writeBytes).mockResolvedValue(undefined);
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 0 }));
    vi.mocked(validateCsrfRequest).mockResolvedValue(true);
  });

  const getReq = () =>
    new NextRequest("http://localhost/api/Planner/projects", { method: "GET" });

  describe("GET", () => {
    it("returns 200 with the project list from disk (array body, not envelope)", async () => {
      vi.mocked(listProjectsFromDisk).mockResolvedValue([sampleProject]);

      const res = await GET(getReq());
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toEqual([sampleProject]);
      expect(listProjectsFromDisk).toHaveBeenCalledOnce();
    });

    it("returns 200 with an empty array when no projects exist", async () => {
      vi.mocked(listProjectsFromDisk).mockResolvedValue([]);

      const res = await GET(getReq());
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
    });

    it("returns 401 for an anonymous caller (member gate, parity with /api/plans)", async () => {
      vi.mocked(createAuthServerClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as never);

      const res = await GET(getReq());
      expect(res.status).toBe(401);
      expect(listProjectsFromDisk).not.toHaveBeenCalled();
    });

    it("returns 429 when rate limited", async () => {
      vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: false, reset: 99 }));
      const res = await GET(getReq());
      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.error?.code ?? body.success).toBeDefined();
      expect(listProjectsFromDisk).not.toHaveBeenCalled();
    });
  });

  describe("POST", () => {
    const postJson = (body: unknown) =>
      new NextRequest("http://localhost/api/Planner/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

    it("creates a project with stable id shape and 201 response", async () => {
      const res = await POST(
        postJson({
          name: "Open Plan",
          canvas_json: { objects: [{ id: 1 }, { id: 2 }] },
          sheet: { units: "mm" },
          layers: [{ name: "walls" }],
        }),
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toMatchObject({
        id: "p_open-plan_abc123",
        name: "Open Plan",
        canvas_json: { objects: [{ id: 1 }, { id: 2 }] },
        sheet: { units: "mm" },
        layers: [{ name: "walls" }],
        thumbnail_url: null,
        objects_count: 2,
        created_at: "2026-07-31T12:00:00.000Z",
        updated_at: "2026-07-31T12:00:00.000Z",
      });
      expect(writeProject).toHaveBeenCalledWith(
        expect.objectContaining({ id: "p_open-plan_abc123", objects_count: 2 }),
      );
    });

    it("defaults name to untitled and empty canvas fields when payload is sparse", async () => {
      const res = await POST(postJson({}));

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.name).toBe("untitled");
      expect(body.id).toBe("p_untitled_abc123");
      expect(body.canvas_json).toEqual({});
      expect(body.sheet).toEqual({});
      expect(body.layers).toEqual([]);
      expect(body.objects_count).toBe(0);
      expect(body.thumbnail_url).toBeNull();
    });

    it("counts objects only when canvas_json.objects is an array", async () => {
      const res = await POST(
        postJson({
          name: "No Objects Key",
          canvas_json: { version: 1 },
        }),
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.objects_count).toBe(0);
    });

    it("persists thumbnail_png as bytes and sets /api/files/projects URL", async () => {
      // 1x1 transparent PNG
      const pngB64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      const dataUrl = `data:image/png;base64,${pngB64}`;

      const res = await POST(
        postJson({
          name: "With Thumb",
          thumbnail_png: dataUrl,
          canvas_json: { objects: [] },
        }),
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.thumbnail_url).toBe("/api/files/projects/p_with-thumb_abc123_thumb.png");
      expect(writeBytes).toHaveBeenCalledOnce();
      const [filePath, buf] = vi.mocked(writeBytes).mock.calls[0]!;
      expect(String(filePath).replaceAll("\\", "/")).toContain(
        "p_with-thumb_abc123_thumb.png",
      );
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect((buf as Buffer).length).toBeGreaterThan(0);
    });

    it("returns 403 when CSRF validation fails", async () => {
      vi.mocked(validateCsrfRequest).mockResolvedValue(false);
      const res = await POST(postJson({ name: "No CSRF" }));
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error?.code).toBe("CSRF_FAILED");
      expect(writeProject).not.toHaveBeenCalled();
    });

    it("returns 400 { detail } for malformed JSON (BadRequestError contract)", async () => {
      const res = await POST(
        new NextRequest("http://localhost/api/Planner/projects", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "not-json{",
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({ detail: "Malformed JSON body" });
      expect(writeProject).not.toHaveBeenCalled();
    });

    it("returns 400 { detail } when body is a JSON array", async () => {
      const res = await POST(
        new NextRequest("http://localhost/api/Planner/projects", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify([{ name: "x" }]),
        }),
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ detail: "Expected a JSON object body" });
    });

    it("returns 400 { detail } when thumbnail_png is not a data URL", async () => {
      const res = await POST(
        postJson({
          name: "Bad Thumb",
          thumbnail_png: "https://example.com/thumb.png",
        }),
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ detail: "Expected a data: URL" });
      expect(writeProject).not.toHaveBeenCalled();
    });
  });
});
