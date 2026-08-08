import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getProductsFresh = vi.hoisted(() => vi.fn());
const resolveAdvisorModelChain = vi.hoisted(() => vi.fn());
const requestAdvisorText = vi.hoisted(() => vi.fn());

const authCapture = vi.hoisted(() => ({
  options: null as Record<string, unknown> | null,
}));

vi.mock("@/features/shared/api/withAuth", () => ({
  withAuth: (
    handler: (req: NextRequest) => Promise<Response>,
    options: Record<string, unknown>,
  ) => {
    authCapture.options = options;
    return handler;
  },
}));

vi.mock("@/lib/catalog/site/getProducts", () => ({
  getProductsFresh,
}));

vi.mock("@/lib/ai/mastra", () => ({
  resolveAdvisorModelChain,
  requestAdvisorText,
}));

vi.mock("@/platform/supabase/auth-admin", () => ({
  createSupabaseAuthAdminClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

import { POST } from "@/app/api/ai-advisor/route";

describe("app/api/ai-advisor/route.ts", () => {
  it("requires CSRF protection on the mutating guest route", () => {
    expect(authCapture.options).toEqual(
      expect.objectContaining({ requireCsrf: true, role: "guest" }),
    );
  });
  beforeEach(() => {
    vi.clearAllMocks();
    getProductsFresh.mockResolvedValue([
      { id: "p1", slug: "chair-a", name: "Chair A", category_id: "seating", description: "Ergonomic" },
    ]);
    resolveAdvisorModelChain.mockReturnValue([]);
  });

  const createReq = (body: unknown) =>
    new NextRequest("http://localhost/api/ai-advisor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("returns 400 when query is missing", async () => {
    const res = await POST(createReq({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns heuristic fallback when no providers are configured", async () => {
    const res = await POST(createReq({ query: "ergonomic chairs for 20 people" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.fallbackUsed).toBe(true);
    expect(body.recommendations.length).toBeGreaterThan(0);
  });
});
