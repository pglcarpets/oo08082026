import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "@/app/api/customer-queries/manage/route";
import { createSupabaseAuthAdminClient } from "@/platform/supabase/auth-admin";
import { createAuthServerClient } from '@/platform/supabase/server';
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { API_ERROR_CODES } from "@/features/shared/api/ApiError";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";

vi.mock("@/platform/supabase/auth-admin", () => ({
  createSupabaseAuthAdminClient: vi.fn(),
}));

vi.mock("@/platform/supabase/server", () => ({
  createAuthServerClient: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn(),
}));

describe("app/api/customer-queries/manage/route.ts", () => {
  let mockAdmin: {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAdmin = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [{ id: "q1" }], error: null }),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "q1", status: "closed" }, error: null }),
    };
    vi.mocked(createSupabaseAuthAdminClient).mockReturnValue(mockAdmin as never);
    vi.mocked(createAuthServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { app_metadata: { role: "admin" } } },
          error: null,
        }),
      },
    } as never);
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 1  }));
    vi.mocked(validateCsrfRequest).mockResolvedValue(true);
  });

  it("GET returns 401 for unauthorized callers", async () => {
    vi.mocked(createAuthServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never);
    const res = await GET(new NextRequest("http://localhost/api/customer-queries/manage"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(API_ERROR_CODES.AUTH_REQUIRED);
  });

  it("GET returns query items for admin session", async () => {
    const res = await GET(new NextRequest("http://localhost/api/customer-queries/manage"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.items).toEqual([{ id: "q1" }]);
  });

  it("PATCH returns 403 when CSRF is invalid", async () => {
    vi.mocked(validateCsrfRequest).mockResolvedValue(false);
    const req = new NextRequest("http://localhost/api/customer-queries/manage", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "q1",
        status: "closed",
        followUpChannel: "none",
      }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(API_ERROR_CODES.CSRF_FAILED);
    expect(res.headers.get("x-csrf-rejected")).toBe("1");
  });

  it("PATCH returns 400 when id is missing", async () => {
    const req = new NextRequest("http://localhost/api/customer-queries/manage", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "closed", followUpChannel: "none" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(API_ERROR_CODES.MISSING_REQUIRED_FIELD);
  });

  it("PATCH updates query for authorized admin", async () => {
    const req = new NextRequest("http://localhost/api/customer-queries/manage", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "q1",
        status: "closed",
        followUpChannel: "none",
      }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.item.status).toBe("closed");
  });
});