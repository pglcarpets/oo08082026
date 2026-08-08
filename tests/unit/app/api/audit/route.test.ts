import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/audit/route";
import { insertEvent } from "@/lib/audit/auditRepository";
import { rateLimit } from "@/lib/rateLimit";
import { createAuthServerClient } from '@/platform/supabase/server';
import { validateCsrfRequest } from "@/lib/security/csrf";
import { userBelongsToTeam } from "@/lib/audit/teamAccess";
import { API_ERROR_CODES } from "@/features/shared/api/ApiError";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";

vi.mock("@/lib/audit/teamAccess", () => ({
  isAuditTeamId: (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  userBelongsToTeam: vi.fn(),
}));

vi.mock("@/lib/audit/auditRepository", () => ({
  insertEvent: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/platform/supabase/server", () => ({
  createAuthServerClient: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn(),
}));

const TEAM_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("app/api/audit/route.ts", () => {
  let mockSupabase: { auth: { getUser: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
    };
    vi.mocked(createAuthServerClient).mockResolvedValue(mockSupabase as never);
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 1  }));
    vi.mocked(validateCsrfRequest).mockResolvedValue(true);
    vi.mocked(insertEvent).mockResolvedValue(undefined);
    vi.mocked(userBelongsToTeam).mockResolvedValue(true);
  });

  const createReq = (body: Record<string, unknown>) =>
    new NextRequest("http://localhost/api/audit", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.1" },
      body: JSON.stringify(body),
    });

  it("returns 429 envelope when rate limited", async () => {
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: false, reset: 99  }));
    const res = await POST(createReq({}));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(API_ERROR_CODES.RATE_LIMIT_EXCEEDED);
    expect(body.error.message).toBe("Too many requests");
    expect(res.headers.get("X-RateLimit-Reset")).toBe("99");
  });

  it("returns 401 envelope when unauthenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(createReq({ team_id: TEAM_ID, action: "update", target_type: "plan" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(API_ERROR_CODES.AUTH_REQUIRED);
    expect(body.error.message).toBe("Unauthorized");
  });

  it("returns 403 CSRF_FAILED envelope when CSRF is invalid", async () => {
    vi.mocked(validateCsrfRequest).mockResolvedValue(false);
    const res = await POST(createReq({ team_id: TEAM_ID, action: "update", target_type: "plan" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(API_ERROR_CODES.CSRF_FAILED);
    expect(body.error.message).toBe("Invalid or missing CSRF token");
    expect(res.headers.get("x-csrf-rejected")).toBe("1");
  });

  it("returns 400 envelope when required fields are missing", async () => {
    const res = await POST(createReq({ team_id: "t1" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(API_ERROR_CODES.MISSING_REQUIRED_FIELD);
    expect(body.error.message).toBe("Missing required fields");
  });

  it("returns 400 envelope when team_id is not a valid uuid", async () => {
    const res = await POST(createReq({ team_id: "team-abc", action: "update", target_type: "plan" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(API_ERROR_CODES.INVALID_INPUT);
    expect(body.error.message).toBe("Invalid team_id");
  });

  it("returns 403 envelope when user is not a team member", async () => {
    vi.mocked(userBelongsToTeam).mockResolvedValueOnce(false);
    const res = await POST(
      createReq({
        team_id: TEAM_ID,
        action: "publish",
        target_type: "plan",
      }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(API_ERROR_CODES.INSUFFICIENT_PERMISSIONS);
    expect(body.error.message).toBe("Forbidden");
    expect(insertEvent).not.toHaveBeenCalled();
  });

  it("records audit event for app admins without team membership check", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "admin-1",
          app_metadata: { role: "admin" },
        },
      },
      error: null,
    });

    const res = await POST(
      createReq({
        team_id: TEAM_ID,
        action: "delete",
        target_type: "catalog",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(userBelongsToTeam).not.toHaveBeenCalled();
    expect(insertEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: "admin-1",
        action: "delete",
        target_type: "catalog",
      }),
    );
  });

  it("returns 500 envelope when persistence fails", async () => {
    vi.mocked(insertEvent).mockRejectedValueOnce(new Error("db unavailable"));
    const res = await POST(
      createReq({
        team_id: TEAM_ID,
        action: "update",
        target_type: "plan",
      }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(API_ERROR_CODES.INTERNAL_ERROR);
    expect(body.error.message).toBe("Failed to record audit event");
  });

  it("records audit event and returns success envelope", async () => {
    const res = await POST(
      createReq({
        team_id: ` ${TEAM_ID} `,
        action: "publish",
        target_type: "plan",
        target_id: "plan-1",
        metadata: { source: "admin" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(insertEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        team_id: TEAM_ID,
        actor_id: "user-1",
        action: "publish",
        target_type: "plan",
        target_id: "plan-1",
      }),
    );
  });
});