/**
 * Contract: GET /api/categories — public rate-limited category list.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/categories/route";
import { getCatalog } from "@/lib/catalog/site/getProducts";
import { buildRequestedCategoryCatalog } from "@/lib/catalog/site/categories";
import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";

vi.mock("@/app/api/_lib/public", () => ({
  enforcePublicApiRateLimit: vi.fn(),
}));

vi.mock("@/lib/catalog/site/getProducts", () => ({
  getCatalog: vi.fn(),
}));

vi.mock("@/lib/catalog/site/categories", () => ({
  buildRequestedCategoryCatalog: vi.fn(),
  Catalog_CATEGORY_ORDER: ["seating", "tables"],
}));

describe("app/api/categories/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforcePublicApiRateLimit).mockResolvedValue(null);
    vi.mocked(getCatalog).mockResolvedValue([] as never);
    vi.mocked(buildRequestedCategoryCatalog).mockReturnValue([
      {
        id: "seating",
        name: "Seating",
        series: [{ products: [{ id: "p1" }, { id: "p2" }] }],
      },
      {
        id: "tables",
        name: "Tables",
        series: [{ products: [{ id: "t1" }] }],
      },
    ] as never);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(enforcePublicApiRateLimit).mockResolvedValue(
      new Response(JSON.stringify({ error: "rate" }), { status: 429 }) as never,
    );
    const res = await GET(new Request("http://localhost/api/categories/"));
    expect(res.status).toBe(429);
  });

  it("returns sorted category id/name/count list", async () => {
    const res = await GET(new Request("http://localhost/api/categories/"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([
      { id: "seating", name: "Seating", count: 2 },
      { id: "tables", name: "Tables", count: 1 },
    ]);
    expect(enforcePublicApiRateLimit).toHaveBeenCalledWith(
      expect.anything(),
      "categories:get",
      30,
    );
  });
});
