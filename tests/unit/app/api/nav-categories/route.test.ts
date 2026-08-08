import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/nav-categories/route";
import { getCatalog } from "@/lib/catalog/site/getProducts";
import {
  classifyToRequestedCategory,
  classifyToRequestedSubcategory,
  getCanonicalSubcategoryId,
  getCatalogCategoryLabel,
} from "@/lib/catalog/site/categories";
import { groupCategories } from "@/lib/navigation";
import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: never[]) => unknown) => fn,
}));

vi.mock("@/app/api/_lib/public", () => ({
  enforcePublicApiRateLimit: vi.fn(),
}));

vi.mock("@/lib/catalog/site/getProducts", () => ({
  getCatalog: vi.fn(),
}));

vi.mock("@/lib/catalog/site/categories", () => ({
  Catalog_CATEGORY_ORDER: ["seating"],
  Catalog_SUBCATEGORY_LABELS: { seating: ["Executive"] },
  classifyToRequestedCategory: vi.fn(() => "seating"),
  classifyToRequestedSubcategory: vi.fn(() => "Executive"),
  getCanonicalSubcategoryId: vi.fn(() => "executive"),
  getCatalogCategoryLabel: vi.fn((_id, fallback) => fallback),
}));

vi.mock("@/lib/navigation", () => ({
  groupCategories: vi.fn((categories) => [{ label: "All", categories }]),
}));

describe("app/api/nav-categories/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforcePublicApiRateLimit).mockResolvedValue(null);
    vi.mocked(getCatalog).mockResolvedValue([
      {
        id: "base-seating",
        series: [
          {
            name: "Exec",
            products: [{ id: "p1", name: "Chair", slug: "chair" }],
          },
        ],
      },
    ] as never);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(enforcePublicApiRateLimit).mockResolvedValue(
      Response.json({ error: "Too many requests" }, { status: 429 }) as never,
    );
    const res = await GET(new Request("http://localhost/api/nav-categories"));
    expect(res.status).toBe(429);
  });

  it("returns grouped categories payload", async () => {
    const res = await GET(new Request("http://localhost/api/nav-categories"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.groups).toHaveLength(1);
    expect(body.categories[0].id).toBe("seating");
    expect(body.categories[0].count).toBe(1);
    expect(classifyToRequestedCategory).toHaveBeenCalled();
    expect(groupCategories).toHaveBeenCalled();
    expect(getCanonicalSubcategoryId).toHaveBeenCalled();
    expect(getCatalogCategoryLabel).toHaveBeenCalled();
    expect(classifyToRequestedSubcategory).toHaveBeenCalled();
  });

  it("returns 500 when catalog fetch fails", async () => {
    vi.mocked(getCatalog).mockRejectedValue(new Error("catalog unavailable"));
    const res = await GET(new Request("http://localhost/api/nav-categories"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("catalog unavailable");
  });
});
