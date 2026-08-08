import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/nav-search/route";
import { getCatalog } from "@/lib/catalog/site/getProducts";
import { buildRequestedCategoryCatalog } from "@/lib/catalog/site/categories";
import { rateLimit } from "@/lib/rateLimit";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";

vi.mock("@/lib/catalog/site/getProducts", () => ({
  getCatalog: vi.fn(),
}));

vi.mock("@/lib/catalog/site/categories", () => ({
  buildRequestedCategoryCatalog: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

describe("app/api/nav-search/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 1  }));
    vi.mocked(getCatalog).mockResolvedValue([] as never);
    vi.mocked(buildRequestedCategoryCatalog).mockReturnValue([
      {
        id: "seating",
        name: "Seating",
        description: "Chairs",
        series: [
          {
            name: "Executive",
            products: [{ id: "p1", slug: "exec-chair", name: "Executive Chair", description: "Ergonomic" }],
          },
        ],
      },
    ] as never);
  });

  it("GET returns 429 when rate limited", async () => {
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: false, reset: 77  }));
    const res = await GET(new NextRequest("http://localhost/api/nav-search?q=chair"));
    expect(res.status).toBe(429);
  });

  it("GET returns 400 for short query", async () => {
    const res = await GET(new NextRequest("http://localhost/api/nav-search?q=a"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("QUERY_TOO_SHORT");
  });

  it("GET returns local search results", async () => {
    const res = await GET(new NextRequest("http://localhost/api/nav-search?q=exec"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results[0].title).toContain("Executive");
    expect(body.rankingMode).toBe("local");
  });

  it("POST returns 400 for short query", async () => {
    const req = new NextRequest("http://localhost/api/nav-search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "x" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
