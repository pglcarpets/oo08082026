import { setNodeEnv } from "@/tests/helpers/setNodeEnv";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";
/**
 * Name-mirror: features/shared/api/withAuth
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resolveAuthContext, withAuth } from "@/features/shared/api/withAuth";
import { success } from "@/features/shared/api/apiResponse";
import { createAuthServerClient } from '@/platform/supabase/server';
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { DEV_BYPASS_USER } from "@/lib/auth/devAuthBypass";

vi.mock("@/platform/supabase/server", () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: null }),
      ),
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

function forceBypassOff(): void {
  process.env = {
    ...originalEnv,
    NODE_ENV: "test",
    DEV_AUTH_BYPASS: "0",
  };
}

describe("withAuth", () => {
  beforeEach(async () => {
    forceBypassOff();
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

  it("returns 429 when rate limited before invoking the handler", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce(rateLimitResult({ success: false, reset: 100 }));
    const handler = vi.fn();
    const wrapped = withAuth(handler, { rateLimitScope: "mirror:get" });

    const response = await wrapped(
      new NextRequest("http://localhost/api/test"),
      {},
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 401 for member routes without a session", async () => {
    const handler = vi.fn();
    const wrapped = withAuth(handler, {
      rateLimitScope: "mirror:member",
      role: "member",
    });
    const response = await wrapped(
      new NextRequest("http://localhost/api/test"),
      {},
    );
    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 401 for admin routes without a session when DEV_AUTH_BYPASS is off", async () => {
    const handler = vi.fn();
    const wrapped = withAuth(handler, {
      rateLimitScope: "admin:unauth",
      role: "admin",
    });
    const response = await wrapped(
      new NextRequest("http://localhost/api/admin/plans"),
      {},
    );
    const body = await response.json();
    expect(response.status).toBe(401);
    const errorCode =
      typeof body.error === "object" && body.error !== null && "code" in body.error
        ? String((body.error as { code: unknown }).code)
        : String(body.error ?? "");
    expect(errorCode.length).toBeGreaterThan(0);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 403 when admin is required but user is a member", async () => {
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
    const wrapped = withAuth(handler, {
      rateLimitScope: "mirror:admin",
      role: "admin",
    });
    const response = await wrapped(
      new NextRequest("http://localhost/api/admin/plans"),
      {},
    );
    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("invokes handler with auth context for authenticated admin", async () => {
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
    const wrapped = withAuth(handler, {
      rateLimitScope: "mirror:admin-ok",
      role: "admin",
    });
    const response = await wrapped(
      new NextRequest("http://localhost/api/test"),
      {},
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.userId).toBe("admin-1");
    expect(body.isAdmin).toBe(true);
  });

  it("serializes thrown errors from the handler", async () => {
    setNodeEnv("development");
    process.env.DEV_AUTH_BYPASS = "1";

    const handler = vi.fn(async () => {
      throw new Error("handler failed");
    });
    const wrapped = withAuth(handler, {
      rateLimitScope: "handler-serialize-error",
      role: "guest",
    });
    const response = await wrapped(
      new NextRequest("http://localhost/api/test"),
      {},
    );
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error.message).toBe("handler failed");
  });
});

describe("resolveAuthContext", () => {
  beforeEach(async () => {
    forceBypassOff();
    vi.clearAllMocks();
    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("allows guest routes without a session", async () => {
    const auth = await resolveAuthContext("guest");
    expect(auth.user).toBeNull();
    expect(auth.isAdmin).toBe(false);
    expect(auth.requiredRole).toBe("guest");
  });

  it("uses dev bypass user when enabled", async () => {
    setNodeEnv("development");
    process.env.DEV_AUTH_BYPASS = "1";
    const auth = await resolveAuthContext("admin");
    expect(auth.user?.id).toBe(DEV_BYPASS_USER.id);
    expect(auth.isAdmin).toBe(true);
  });

  it("rejects unauthenticated admin role when DEV_AUTH_BYPASS is off", async () => {
    process.env.DEV_AUTH_BYPASS = "0";
    setNodeEnv("test");
    await expect(resolveAuthContext("admin")).rejects.toMatchObject({
      status: 401,
    });
  });

  it("rejects non-admin users for admin role when bypass is off", async () => {
    process.env.DEV_AUTH_BYPASS = "0";
    setNodeEnv("test");
    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: {
        user: {
          id: "user-2",
          email: "member@example.com",
          app_metadata: { role: "member" },
        },
      },
      error: null,
    } as never);

    await expect(resolveAuthContext("admin")).rejects.toMatchObject({
      status: 403,
    });
  });
});
