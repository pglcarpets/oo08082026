import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/filter/route";
import { rateLimit } from "@/lib/rateLimit";
import { getProducts } from "@/lib/catalog/site/getProducts";

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

vi.mock("@/lib/catalog/site/getProducts", () => ({
  getProducts: vi.fn(),
}));

vi.mock("@/lib/env.server", () => ({
  env: {
    OPENROUTER_API_KEY_PRIMARY: "",
    OPENROUTER_API_KEY_BACKUP: "",
    OPENAI_API_KEY: "",
  },
}));

describe("app/api/filter/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 12,
      remaining: 11,
      reset: 1,
    });
    vi.mocked(getProducts).mockResolvedValue([
      {
        id: "p1",
        slug: "p1",
        name: "Budget Chair",
        category_id: "seating",
        series: "s",
        images: [],
        specs: { dimensions: "", materials: [], features: [] },
        series_id: "s1",
        series_name: "S",
        created_at: new Date().toISOString(),
        metadata: { priceRange: "budget" },
      },
      {
        id: "p2",
        slug: "p2",
        name: "Luxury Chair",
        category_id: "seating",
        series: "s",
        images: [],
        specs: { dimensions: "", materials: [], features: [] },
        series_id: "s1",
        series_name: "S",
        created_at: new Date().toISOString(),
        metadata: { priceRange: "luxury" },
      },
    ] as never);
  });

  const createReq = (body: unknown) =>
    new NextRequest("http://localhost/api/filter", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "1.2.3.4" },
      body: JSON.stringify(body),
    });

  it("returns 429 when rate limited", async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 12,
      remaining: 0,
      reset: 55,
    });
    const res = await POST(createReq({ productIds: ["p1"], rankBy: "price" }), {});
    expect(res.status).toBe(429);
  });

  it("returns 400 when productIds or rankBy are missing", async () => {
    const res = await POST(createReq({ productIds: [] }), {});
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid rankBy", async () => {
    const res = await POST(
      createReq({
        productIds: ["p1"],
        rankBy: "invalid",
      }),
      {},
    );
    expect(res.status).toBe(400);
  });

  it("uses fallback sort when no API key is configured", async () => {
    const res = await POST(
      createReq({
        productIds: ["p1", "p2"],
        rankBy: "price",
        category: "seating",
      }),
      {},
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("fallback");
    expect(body.rankedIds).toEqual(["p1", "p2"]);
  });

  it("returns 400 when productIds do not resolve to catalog products", async () => {
    vi.mocked(getProducts).mockResolvedValueOnce([] as never);
    const res = await POST(
      createReq({
        productIds: ["missing-id"],
        rankBy: "price",
      }),
      {},
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("No matching catalog products");
  });

  it("orders ergonomic ranking by certification and adjustability", async () => {
    vi.mocked(getProducts).mockResolvedValueOnce([
      {
        id: "basic",
        slug: "basic",
        name: "Basic Chair",
        category_id: "seating",
        series: "s",
        images: [],
        specs: { dimensions: "", materials: [], features: [] },
        series_id: "s1",
        series_name: "S",
        created_at: new Date().toISOString(),
        metadata: {},
      },
      {
        id: "pro",
        slug: "pro",
        name: "Pro Chair",
        category_id: "seating",
        series: "s",
        images: [],
        specs: { dimensions: "", materials: [], features: [] },
        series_id: "s1",
        series_name: "S",
        created_at: new Date().toISOString(),
        metadata: {
          bifmaCertified: true,
          isHeightAdjustable: true,
          hasHeadrest: true,
        },
      },
    ] as never);

    const res = await POST(
      createReq({
        productIds: ["basic", "pro"],
        rankBy: "ergonomic",
      }),
      {},
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("fallback");
    expect(body.rankedIds[0]).toBe("pro");
    expect(body.rankedIds[1]).toBe("basic");
  });
});
