import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/plans/route";
import { createAuthServerClient } from '@/platform/supabase/server';
import {
  listPlannerDocumentsFromStore,
  savePlannerDocumentToStore,
  type PlannerSaveSummary,
} from "@planner/lib/projectsStore";
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";

vi.mock("@/platform/supabase/server", () => ({
  createAuthServerClient: vi.fn(),
}));

vi.mock("@planner/lib/projectsStore", () => ({
  listPlannerDocumentsFromStore: vi.fn(),
  savePlannerDocumentToStore: vi.fn(),
  buildPlannerDocumentFromPortalPublishData: vi.fn((data, opts) => ({
    ...data,
    ...opts,
    mockDoc: true,
  })),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn(),
}));

vi.mock("@/features/shared/api/routeObservability", () => ({
  applyPlannerRouteTelemetry: vi.fn((res: Response) => res),
}));

function createReq(
  method: string,
  url = "http://localhost/api/plans",
  options: RequestInit = {},
) {
  return new NextRequest(url, {
    method,
    ...options,
  } as ConstructorParameters<typeof NextRequest>[1]);
}

function jsonPost(body: unknown) {
  return createReq("POST", "http://localhost/api/plans", {
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("app/api/plans/route.ts", () => {
  let mockSupabase: { auth: { getUser: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user123" } } }),
      },
    };
    vi.mocked(createAuthServerClient).mockResolvedValue(mockSupabase as never);
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 12345 }));
    vi.mocked(validateCsrfRequest).mockResolvedValue(true);
  });

  describe("GET", () => {
    it("returns 429 when rate limited", async () => {
      vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: false, reset: 999 }));
      const res = await GET(
        createReq("GET", "http://localhost/api/plans", {
          headers: { "cf-connecting-ip": "10.0.0.1" },
        }),
      );
      expect(res.status).toBe(429);
      const data = await res.json() as {
        success: boolean;
        error: { code: string; message: string };
      };
      expect(data).toMatchObject({
        success: false,
        error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests" },
      });
      expect(res.headers.get("X-RateLimit-Reset")).toBe("999");
      expect(rateLimit).toHaveBeenCalledWith("plans:get:10.0.0.1", 20, 60000);
    });

    it("returns 401 when unauthenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const res = await GET(createReq("GET"));
      expect(res.status).toBe(401);
      const data = await res.json() as {
        success: boolean;
        error: { code: string };
      };
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("AUTH_REQUIRED");
    });

    it("returns 500 when listing fails", async () => {
      vi.mocked(listPlannerDocumentsFromStore).mockRejectedValue(new Error("DB failure"));
      const res = await GET(createReq("GET"));
      expect(res.status).toBe(500);
      const data = await res.json() as {
        success: boolean;
        error: { code: string; message: string };
      };
      expect(data).toMatchObject({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to list plans: DB failure",
        },
      });
    });

    it("returns documents for the authenticated user", async () => {
      const docs: PlannerSaveSummary[] = [
        {
          id: "doc1",
          name: "Plan 1",
          item_count: 0,
          updated_at: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "doc2",
          name: "Plan 2",
          item_count: 2,
          updated_at: "2026-01-02T00:00:00.000Z",
        },
      ];
      vi.mocked(listPlannerDocumentsFromStore).mockResolvedValue(docs);

      const res = await GET(createReq("GET"));
      expect(res.status).toBe(200);
      const data = await res.json() as {
        success: boolean;
        documents: PlannerSaveSummary[];
      };
      expect(data.success).toBe(true);
      expect(data.documents).toEqual(docs);
      expect(listPlannerDocumentsFromStore).toHaveBeenCalledWith({ userId: "user123" });
    });
  });

  describe("POST", () => {
    it("returns 429 when rate limited", async () => {
      vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: false, reset: 111 }));
      const res = await POST(createReq("POST"));
      expect(res.status).toBe(429);
      const data = await res.json() as {
        success: boolean;
        error: { code: string };
      };
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("returns 403 when CSRF fails", async () => {
      vi.mocked(validateCsrfRequest).mockResolvedValue(false);
      const res = await POST(createReq("POST"));
      expect(res.status).toBe(403);
      const data = await res.json() as {
        success: boolean;
        error: { code: string };
      };
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("CSRF_FAILED");
      expect(res.headers.get("x-csrf-rejected")).toBe("1");
    });

    it("rejects invalid JSON and missing required fields", async () => {
      const badJson = await POST(
        createReq("POST", "http://localhost/api/plans", {
          headers: { "content-type": "application/json" },
          body: "not json",
        }),
      );
      expect(badJson.status).toBe(400);
      await expect(badJson.json()).resolves.toMatchObject({
        success: false,
        error: { code: "INVALID_INPUT", message: "Invalid JSON body" },
      });

      const missingId = await POST(jsonPost({ projectName: "P", data: {} }));
      expect(missingId.status).toBe(400);
      await expect(missingId.json()).resolves.toMatchObject({
        error: { code: "MISSING_REQUIRED_FIELD", message: "Plan id is required" },
      });

      const missingData = await POST(jsonPost({ id: "123", projectName: "P" }));
      expect(missingData.status).toBe(400);
      await expect(missingData.json()).resolves.toMatchObject({
        error: { code: "MISSING_REQUIRED_FIELD", message: "Plan data is required" },
      });
    });

    it("returns 401 when unauthenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const res = await POST(jsonPost({ id: "123", projectName: "P", data: {} }));
      expect(res.status).toBe(401);
      const data = await res.json() as {
        success: boolean;
        error: { code: string };
      };
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("AUTH_REQUIRED");
    });

    it("publishes a draft with default empty arrays", async () => {
      const res = await POST(
        jsonPost({ id: "123", projectName: "P", data: {}, status: "draft" }),
      );
      expect(res.status).toBe(200);
      const data = await res.json() as {
        success: boolean;
        id: string;
        portalPath: string;
      };
      expect(data).toMatchObject({
        success: true,
        id: "123",
        portalPath: "/portal/123",
      });
      expect(savePlannerDocumentToStore).toHaveBeenCalledWith(
        expect.objectContaining({
          projectName: "P",
          walls: [],
          rooms: [],
          furniture: [],
          doors: [],
          windows: [],
          measurements: [],
          zones: [],
          textLabels: [],
          structuralElements: [],
          backgroundImage: null,
          status: "draft",
          mockDoc: true,
        }),
        { userId: "user123", saveId: "123" },
      );
    });

    it("returns 500 when save fails", async () => {
      vi.mocked(savePlannerDocumentToStore).mockRejectedValue(new Error("Save failed"));
      const res = await POST(jsonPost({ id: "123", projectName: "P", data: {} }));
      expect(res.status).toBe(500);
      const data = await res.json() as {
        success: boolean;
        error: { code: string; message: string };
      };
      expect(data).toMatchObject({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to publish plan: Save failed",
        },
      });
    });
  });
});
