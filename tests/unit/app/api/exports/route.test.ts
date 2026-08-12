import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/exports/route";
import { createAuthServerClient } from "@/platform/supabase/server";
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";
import { DEV_BYPASS_USER } from "@/lib/auth/devAuthBypass";

vi.mock("@/platform/supabase/server", () => {
  const mockSupabase = {
    auth: { getUser: vi.fn() },
  };
  return { createAuthServerClient: vi.fn(() => Promise.resolve(mockSupabase)) };
});

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(() => Promise.resolve(rateLimitResult({ success: true, reset: 0 }))),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn(() => Promise.resolve(true)),
}));

const originalEnv = { ...process.env };

function forceBypassOn(): void {
  process.env = {
    ...originalEnv,
    NODE_ENV: "test",
    DEV_AUTH_BYPASS: "1",
  };
}

function forceBypassOff(): void {
  process.env = {
    ...originalEnv,
    NODE_ENV: "test",
    DEV_AUTH_BYPASS: "0",
  };
}

describe("POST /api/exports (TST-S22)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    forceBypassOn();
    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockReset();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: DEV_BYPASS_USER.id,
          email: DEV_BYPASS_USER.email,
          app_metadata: {},
          user_metadata: {},
        },
      },
      error: null,
    } as never);
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 0 }));
    vi.mocked(validateCsrfRequest).mockResolvedValue(true);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("rejects unauthenticated requests with 401", async () => {
    forceBypassOff();
    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const res = await POST(new NextRequest("http://localhost/api/exports", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited before the handler runs", async () => {
    forceBypassOff();
    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "ayush@oando.co.in",
          app_metadata: {},
          user_metadata: {},
        },
      },
      error: null,
    } as never);
    vi.mocked(rateLimit).mockResolvedValueOnce(
      rateLimitResult({ success: false, reset: 100 }),
    );

    const res = await POST(
      new NextRequest("http://localhost/api/exports", { method: "POST" }),
    );
    expect(res.status).toBe(429);
  });

  it("rejects missing CSRF token with 403 when bypass is off", async () => {
    forceBypassOff();
    vi.mocked(validateCsrfRequest).mockResolvedValueOnce(false);
    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "ayush@oando.co.in",
          app_metadata: {},
          user_metadata: {},
        },
      },
      error: null,
    } as never);

    const res = await POST(
      new NextRequest("http://localhost/api/exports", {
        method: "POST",
        body: JSON.stringify({ data_url: "data:image/png;base64,AAAA" }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when data_url is missing (bypass on)", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/exports", {
        method: "POST",
        body: JSON.stringify({ name: "x" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 503 in production (no DEV_AUTH_BYPASS) — read-only FS", async () => {
    forceBypassOff();
    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "ayush@oando.co.in",
          app_metadata: {},
          user_metadata: {},
        },
      },
      error: null,
    } as never);

    const res = await POST(
      new NextRequest("http://localhost/api/exports", {
        method: "POST",
        body: JSON.stringify({ data_url: "data:image/png;base64,AAAA" }),
      }),
    );
    expect(res.status).toBe(503);
  });
});
