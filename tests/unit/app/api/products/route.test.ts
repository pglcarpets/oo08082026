import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/products/route";
import { getProducts } from "@/lib/catalog/site/getProducts";
import { getCatalogProductHref } from "@/lib/catalog/site/categories";
import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";

vi.mock("@/app/api/_lib/public", () => ({
  enforcePublicApiRateLimit: vi.fn(),
}));

vi.mock("@/lib/catalog/site/getProducts", () => ({
  getProducts: vi.fn(),
}));

vi.mock("@/lib/catalog/site/categories", () => ({
  getCatalogProductHref: vi.fn((cat, slug) => `/catalog/${cat}/${slug}`),
}));

describe("app/api/products/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforcePublicApiRateLimit).mockResolvedValue(null);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(enforcePublicApiRateLimit).mockResolvedValue(
      Response.json({ error: "Too many requests" }, { status: 429 }) as never,
    );
    const res = await GET(new NextRequest("http://localhost/api/products"));
    expect(res.status).toBe(429);
  });

  it("returns filtered products with pagination metadata", async () => {
    vi.mocked(getProducts).mockResolvedValue([
      {
        id: "p1",
        slug: "chair-a",
        name: "Chair A",
        category_id: "seating",
        description: "A comfortable chair",
        images: ["/img/chair.jpg"],
        metadata: { priceRange: "mid", sustainabilityScore: 7 },
      },
    ] as never);

    const res = await GET(
      new NextRequest("http://localhost/api/products?category=seating&limit=10&offset=0"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.products).toHaveLength(1);
    expect(body.products[0].href).toBe("/catalog/seating/chair-a");
    expect(body.products[0].priceRange).toBe("mid");
    expect(getCatalogProductHref).toHaveBeenCalledWith("seating", "chair-a");
  });

  it("returns 500 with empty list when getProducts throws", async () => {
    vi.mocked(getProducts).mockRejectedValue(new Error("catalog down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await GET(new NextRequest("http://localhost/api/products"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.products).toEqual([]);
    expect(body.error).toBe("Unable to load products right now.");
    spy.mockRestore();
  });
});
