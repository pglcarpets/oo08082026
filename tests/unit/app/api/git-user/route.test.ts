import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/git-user/route";
import { createAuthServerClient } from "@/platform/supabase/server";
import { rateLimit } from "@/lib/rateLimit";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";
import { DEV_BYPASS_USER } from "@/lib/auth/devAuthBypass";
import { readGitUserIdentity } from "@/app/api/_lib/gitUser";

vi.mock("@/platform/supabase/server", () => {
  const mockSupabase = { auth: { getUser: vi.fn() } };
  return { createAuthServerClient: vi.fn(() => Promise.resolve(mockSupabase)) };
});

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(() => Promise.resolve(rateLimitResult({ success: true, reset: 0 }))),
}));

vi.mock("@/app/api/_lib/gitUser", () => ({
  readGitUserIdentity: vi.fn(() =>
    Promise.resolve({ email: "dev@oando.co.in", name: "Dev" }),
  ),
}));

const originalEnv = { ...process.env };

function forceBypassOff(): void {
  process.env = {
    ...originalEnv,
    NODE_ENV: "test",
    DEV_AUTH_BYPASS: "0",
  };
}

function forceBypassOn(): void {
  process.env = {
    ...originalEnv,
    NODE_ENV: "test",
    DEV_AUTH_BYPASS: "1",
  };
}

async function mockUser(email: string, role: string): Promise<void> {
  const supabase = await createAuthServerClient();
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: {
      user: { id: "user-1", email, app_metadata: { role }, user_metadata: {} },
    },
    error: null,
  } as never);
}

describe("GET /api/git-user (PX-S07)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    forceBypassOff();
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 0 }));
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("rejects anonymous callers with 401", async () => {
    const supabase = await createAuthServerClient();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const res = await GET(new NextRequest("http://localhost/api/git-user"));
    expect(res.status).toBe(401);
  });

  it("rejects non-admin members with 403", async () => {
    await mockUser("member@oando.co.in", "member");

    const res = await GET(new NextRequest("http://localhost/api/git-user"));
    expect(res.status).toBe(403);
  });

  it("allows admin and returns identity", async () => {
    await mockUser("ayush@oando.co.in", "admin");

    const res = await GET(new NextRequest("http://localhost/api/git-user"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ email: "dev@oando.co.in", name: "Dev" });
  });

  it("allows dev bypass (admin) and returns identity", async () => {
    forceBypassOn();
    const res = await GET(new NextRequest("http://localhost/api/git-user"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe("dev@oando.co.in");
    expect(DEV_BYPASS_USER.role).toBe("admin");
  });
});
