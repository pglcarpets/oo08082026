import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withAuth, resolveAuthContext } from "@/features/shared/api/withAuth";
import { NextRequest } from "next/server";
import { createAuthServerClient } from "@/platform/supabase/server";
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { success } from "@/features/shared/api/apiResponse";
import { DEV_BYPASS_USER } from "@/lib/auth/devAuthBypass";
import { setNodeEnv } from "@/tests/helpers/setNodeEnv";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";

vi.mock("@/platform/supabase/server", () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  };
  return {
    createAuthServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  };
});

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(() => Promise.resolve(rateLimitResult({ success: true, reset: 0  }))),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn(() => Promise.resolve(true)),
}));

const originalEnv = { ...process.env };

describe("withAuth middleware", () => {
  beforeEach(async () => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockReset();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 0  }));
    vi.mocked(validateCsrfRequest).mockResolvedValue(true);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns 429 with rate-limit envelope when limited", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce(rateLimitResult({ success: false, reset: 100 }));
    const handler = vi.fn();
    const wrapped = withAuth(handler, { rateLimitScope: "test-scope" });

    const response = await wrapped(new NextRequest("http://localhost/api/test"), {});
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(response.headers.get("X-RateLimit-Reset")).toBe("100");
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 401 when member auth is required but user is missing", async () => {
    const handler = vi.fn();
    const wrapped = withAuth(handler, { rateLimitScope: "test-scope", role: "member" });

    const response = await wrapped(new NextRequest("http://localhost/api/test"), {});
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("AUTH_REQUIRED");
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 403 when admin role is required but user is only a member", async () => {
    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: {
        user: {
          id: "user-1",
          email: "member@example.com",
          app_metadata: { role: "member" },
        },
      },
      error: null,
    } as never);

    const handler = vi.fn();
    const wrapped = withAuth(handler, { rateLimitScope: "test-scope", role: "admin" });

    const response = await wrapped(new NextRequest("http://localhost/api/test"), {});
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 403 when CSRF validation fails on mutating requests", async () => {
    // Bypass off so CSRF gate is active.
    setNodeEnv("development");
    delete process.env.DEV_AUTH_BYPASS;

    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: {
        user: {
          id: "admin-1",
          email: "admin@example.com",
          app_metadata: { role: "admin" },
        },
      },
      error: null,
    } as never);
    vi.mocked(validateCsrfRequest).mockResolvedValueOnce(false);

    const handler = vi.fn();
    const wrapped = withAuth(handler, {
      rateLimitScope: "test-scope",
      role: "admin",
      requireCsrf: true,
    });

    const response = await wrapped(
      new NextRequest("http://localhost/api/test", { method: "POST" }),
      {},
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.message).toContain("CSRF");
    expect(handler).not.toHaveBeenCalled();
    expect(validateCsrfRequest).toHaveBeenCalled();
  });

  it("skips CSRF validation when DEV_AUTH_BYPASS is enabled (mutating + requireCsrf)", async () => {
    setNodeEnv("development");
    process.env.DEV_AUTH_BYPASS = "1";
    // Would fail if CSRF were evaluated.
    vi.mocked(validateCsrfRequest).mockResolvedValue(false);

    const handler = vi.fn(async (_req, auth) =>
      success({ userId: auth.user?.id, isAdmin: auth.isAdmin }),
    );
    const wrapped = withAuth(handler, {
      rateLimitScope: "test-scope",
      role: "admin",
      requireCsrf: true,
    });

    const response = await wrapped(
      new NextRequest("http://localhost/api/test", { method: "POST" }),
      {},
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.userId).toBe(DEV_BYPASS_USER.id);
    expect(body.isAdmin).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(validateCsrfRequest).not.toHaveBeenCalled();
  });

  it("still enforces CSRF when bypass env is set but NODE_ENV=production without allow flag", async () => {
    setNodeEnv("production");
    process.env.DEV_AUTH_BYPASS = "1";

    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: {
        user: {
          id: "admin-1",
          email: "admin@example.com",
          app_metadata: { role: "admin" },
        },
      },
      error: null,
    } as never);
    vi.mocked(validateCsrfRequest).mockResolvedValueOnce(false);

    const handler = vi.fn();
    const wrapped = withAuth(handler, {
      rateLimitScope: "test-scope",
      role: "admin",
      requireCsrf: true,
    });

    const response = await wrapped(
      new NextRequest("http://localhost/api/test", { method: "POST" }),
      {},
    );

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    expect(validateCsrfRequest).toHaveBeenCalled();
  });

  it("invokes handler with resolved auth context for authenticated admin", async () => {
    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: {
        user: {
          id: "admin-1",
          email: "admin@example.com",
          app_metadata: { roles: ["admin"] },
        },
      },
      error: null,
    } as never);

    const handler = vi.fn(async (_req, auth) =>
      success({ userId: auth.user?.id, isAdmin: auth.isAdmin }),
    );
    const wrapped = withAuth(handler, { rateLimitScope: "test-scope", role: "admin" });

    const response = await wrapped(new NextRequest("http://localhost/api/test"), {});
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.userId).toBe("admin-1");
    expect(body.isAdmin).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("resolveAuthContext allows guest routes without a session", async () => {
    const auth = await resolveAuthContext("guest");
    expect(auth.user).toBeNull();
    expect(auth.isAdmin).toBe(false);
    expect(auth.requiredRole).toBe("guest");
  });
});
