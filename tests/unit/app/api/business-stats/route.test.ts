import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/business-stats/route";
import { getBusinessStats } from "@/features/crm/businessStats";
import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";

vi.mock("@/app/api/_lib/public", () => ({
  enforcePublicApiRateLimit: vi.fn(),
}));

vi.mock("@/features/crm/businessStats", () => ({
  getBusinessStats: vi.fn(),
}));

describe("app/api/business-stats/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforcePublicApiRateLimit).mockResolvedValue(null);
    vi.mocked(getBusinessStats).mockResolvedValue({ clients: 10, projects: 5 } as never);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(enforcePublicApiRateLimit).mockResolvedValue(
      Response.json({ error: "Too many requests" }, { status: 429 }) as never,
    );
    const res = await GET(new Request("http://localhost/api/business-stats"));
    expect(res.status).toBe(429);
  });

  it("returns business stats with cache headers", async () => {
    const res = await GET(new Request("http://localhost/api/business-stats"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clients).toBe(10);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");
    expect(getBusinessStats).toHaveBeenCalledWith({ forceLive: false });
  });

  it("passes forceLive when live=1 query param is set", async () => {
    await GET(new Request("http://localhost/api/business-stats?live=1"));
    expect(getBusinessStats).toHaveBeenCalledWith({ forceLive: true });
  });
});
