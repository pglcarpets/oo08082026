import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/csrf/route";
import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";
import { generateCsrfToken, setCsrfTokenCookie } from "@/lib/security/csrf";

vi.mock("@/lib/security/csrf", () => ({
  generateCsrfToken: vi.fn(() => "test-csrf-token"),
  setCsrfTokenCookie: vi.fn(),
}));

vi.mock("@/app/api/_lib/public", () => ({
  enforcePublicApiRateLimit: vi.fn(),
}));

describe("app/api/csrf/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforcePublicApiRateLimit).mockResolvedValue(null);
  });

  it("returns generated token and sets cookie", async () => {
    const req = new Request("http://localhost/api/csrf");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe("test-csrf-token");
    expect(generateCsrfToken).toHaveBeenCalled();
    expect(setCsrfTokenCookie).toHaveBeenCalledWith("test-csrf-token");
    expect(enforcePublicApiRateLimit).toHaveBeenCalledWith(req, "csrf:get", 60);
  });

  it("returns 429 when rate limited", async () => {
    const { NextResponse } = await import("next/server");
    vi.mocked(enforcePublicApiRateLimit).mockResolvedValue(
      NextResponse.json({ error: "Too many requests" }, { status: 429 }),
    );
    const req = new Request("http://localhost/api/csrf");
    const res = await GET(req);
    expect(res.status).toBe(429);
    expect(generateCsrfToken).not.toHaveBeenCalled();
  });
});
