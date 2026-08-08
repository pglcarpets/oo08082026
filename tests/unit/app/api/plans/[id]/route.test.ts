import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "@/app/api/plans/[id]/route";
import { createAuthServerClient } from '@/platform/supabase/server';
import {
  loadPlannerDocumentFromStore,
  savePlannerDocumentToStore,
  deletePlannerDocumentFromStore,
} from "@planner/lib/projectsStore";
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";

function createEmptyPlannerDocument(
  input: string | { id?: string; name?: string } = "plan-1",
) {
  const id = typeof input === "string" ? input : input.id ?? "plan-1";
  const name =
    typeof input === "string" ? "Untitled" : input.name ?? "Untitled";
  return {
    id,
    name,
    status: "draft" as const,
    itemCount: 0,
    scene: {},
    payload: {},
  };
}

vi.mock("@/platform/supabase/server", () => ({
  createAuthServerClient: vi.fn(),
}));

vi.mock("@planner/lib/projectsStore", () => ({
  loadPlannerDocumentFromStore: vi.fn(),
  savePlannerDocumentToStore: vi.fn(),
  deletePlannerDocumentFromStore: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn(),
}));

vi.mock("@/features/shared/api/routeObservability", () => ({
  applyPlannerRouteTelemetry: vi.fn((res) => res),
}));

const routeContext = { params: Promise.resolve({ id: "plan-1" }) };

describe("app/api/plans/[id]/route.ts", () => {
  let mockSupabase: { auth: { getUser: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
    };
    vi.mocked(createAuthServerClient).mockResolvedValue(mockSupabase as never);
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 1  }));
    vi.mocked(validateCsrfRequest).mockResolvedValue(true);
  });

  it("GET returns 401 when unauthenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(new NextRequest("http://localhost/api/plans/plan-1"), routeContext);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("AUTH_REQUIRED");
    expect(body.error.message).toBe("Authentication required");
  });

  it("GET returns 404 when plan is missing", async () => {
    vi.mocked(loadPlannerDocumentFromStore).mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/plans/plan-1"), routeContext);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    expect(body.error.message).toBe("Plan not found");
  });

  it("GET scopes load to the authenticated owner (blocks enumeration)", async () => {
    vi.mocked(loadPlannerDocumentFromStore).mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/plans/plan-1"), routeContext);
    expect(res.status).toBe(404);
    expect(loadPlannerDocumentFromStore).toHaveBeenCalledWith("plan-1", "user-1");
  });

  it("GET returns document when found", async () => {
    vi.mocked(loadPlannerDocumentFromStore).mockResolvedValue({ id: "plan-1" } as never);
    const res = await GET(new NextRequest("http://localhost/api/plans/plan-1"), routeContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.document.id).toBe("plan-1");
  });

  it("PUT returns 403 when CSRF is invalid", async () => {
    vi.mocked(validateCsrfRequest).mockResolvedValue(false);
    const req = new NextRequest("http://localhost/api/plans/plan-1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ document: { id: "plan-1", walls: [], rooms: [] } }),
    });
    const res = await PUT(req, routeContext);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("CSRF_FAILED");
    expect(body.error.message).toBe("Invalid or missing CSRF token");
    expect(res.headers.get("x-csrf-rejected")).toBe("1");
  });

  it("PUT returns 404 when foreign plan id cannot be overwritten", async () => {
    const ownershipError = Object.assign(new Error("Document not found or not owned by caller"), {
      code: "FORBIDDEN",
    });
    vi.mocked(savePlannerDocumentToStore).mockRejectedValue(ownershipError);
    const document = createEmptyPlannerDocument({ id: "plan-1", name: "Takeover" });
    const req = new NextRequest("http://localhost/api/plans/plan-1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ document }),
    });
    const res = await PUT(req, routeContext);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    expect(savePlannerDocumentToStore).toHaveBeenCalled();
  });

  it("DELETE returns 404 when plan does not exist", async () => {
    vi.mocked(loadPlannerDocumentFromStore).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/plans/plan-1", { method: "DELETE" });
    const res = await DELETE(req, routeContext);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    expect(body.error.message).toBe("Plan not found");
    expect(deletePlannerDocumentFromStore).not.toHaveBeenCalled();
  });

  it("DELETE removes existing plan with owner-scoped store delete", async () => {
    vi.mocked(loadPlannerDocumentFromStore).mockResolvedValue({ id: "plan-1" } as never);
    vi.mocked(deletePlannerDocumentFromStore).mockResolvedValue(true);
    const req = new NextRequest("http://localhost/api/plans/plan-1", { method: "DELETE" });
    const res = await DELETE(req, routeContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.source).toBe("disk_planner_projects");
    expect(savePlannerDocumentToStore).not.toHaveBeenCalled();
    // IDOR guard: delete must pass authenticated userId.
    expect(deletePlannerDocumentFromStore).toHaveBeenCalledWith("plan-1", "user-1");
    expect(loadPlannerDocumentFromStore).toHaveBeenCalledWith("plan-1", "user-1");
  });
});

