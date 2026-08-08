import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/generate-alt/route";
import { rateLimit } from "@/lib/rateLimit";

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/platform/supabase/server", () => ({
  createAuthServerClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: {
              user: {
                id: "user-1",
                email: "test@example.com",
                app_metadata: { role: "member" },
              },
            },
            error: null,
          }),
        ),
      },
    }),
  ),
}));

vi.mock("@/lib/env.server", () => ({
  env: {
    OPENROUTER_API_KEY_PRIMARY: "",
    OPENROUTER_API_KEY_BACKUP: "",
    OPENAI_API_KEY: "",
  },
}));

describe("app/api/generate-alt/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: 1,
    });
  });

  const createReq = (body: unknown) =>
    new NextRequest("http://localhost/api/generate-alt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("returns 429 when rate limited", async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 12,
    });
    const res = await POST(createReq({ category: "seating", name: "Chair" }), {});
    expect(res.status).toBe(429);
  });

  it("returns 400 when category or name is missing", async () => {
    const res = await POST(createReq({ category: "seating" }), {});
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("category and name are required");
  });

  it("returns fallback alt text when no AI key is configured", async () => {
    const res = await POST(
      createReq({ category: "mesh-chair", name: "Aero Mesh", description: "Breathable mesh" }),
      {},
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.altText).toContain("Aero Mesh");
    expect(body.altText).toContain("mesh ergonomic office chair");
  });

  it("returns 500 when request body is not valid JSON", async () => {
    const req = new NextRequest("http://localhost/api/generate-alt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-json",
    });
    const res = await POST(req, {});
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/Failed to generate alt text/i);
  });
});
