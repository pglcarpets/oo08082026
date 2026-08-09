/** @vitest-environment node */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  enforceAdminRateLimit,
  requireAdminSession,
} from "@/app/api/admin/_lib/server";
import {
  createAdminServiceClient,
  getClientIp,
  isMissingTableError,
} from "@/platform/supabase/adminServer";
import { rateLimit } from "@/lib/rateLimit";
import { createAuthServerClient } from '@/platform/supabase/server';
import { setNodeEnv } from "@/tests/helpers/setNodeEnv";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/platform/supabase/server", () => ({
  createAuthServerClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: { persistSession: false } })),
}));

describe("app/api/admin/_lib/server.ts", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.DEV_AUTH_BYPASS = "0";
    setNodeEnv("test");
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("rate-limits and requires admin session (401/403/null)", async () => {
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 1  }));
    expect(await enforceAdminRateLimit(new NextRequest("http://localhost"), "plans:get")).toBeNull();

    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: false, reset: 42  }));
    const limited = await enforceAdminRateLimit(
      new NextRequest("http://localhost"),
      "plans:get",
    );
    expect(limited?.status).toBe(429);

    vi.mocked(createAuthServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as never);
    expect((await requireAdminSession())?.status).toBe(401);

    vi.mocked(createAuthServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "member-1",
              email: "member@example.com",
              app_metadata: { role: "member" },
            },
          },
          error: null,
        }),
      },
    } as never);
    expect((await requireAdminSession())?.status).toBe(403);

    vi.mocked(createAuthServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "admin-1",
              email: "admin@example.com",
              app_metadata: { role: "admin" },
            },
          },
          error: null,
        }),
      },
    } as never);
    expect(await requireAdminSession()).toBeNull();

    expect(getClientIp(new NextRequest("http://localhost", {
      headers: { "cf-connecting-ip": "1.1.1.1" },
    }))).toBe("1.1.1.1");
    expect(isMissingTableError("relation foo does not exist")).toBe(true);
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(createAdminServiceClient()).toBeNull();
  });
});
