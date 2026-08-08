import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveCatalogType, listStandardCatalog } from "@/features/admin/api/catalogAdminHandlers";
import { NextRequest } from "next/server";

vi.mock("@/platform/supabase/adminServer", () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [{
          id: "00000000-0000-0000-0000-000000000000",
          name: "Test Item",
          slug: "test-item",
          planner_source_slug: "test-item",
          category: "seating",
          category_id: "seating",
          category_name: "Seating",
          series_id: "ser-1",
          series_name: "Test Series",
          specs: { widthMm: 100, depthMm: 50, heightMm: 80 },
          price: 10,
          visible: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          metadata: null,
        }], error: null })),
      })),
    })),
  };
  return {
    createAdminServiceClient: vi.fn(() => mockSupabase),
    isMissingTableError: vi.fn(() => false),
  };
});

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
  NextRequest: class NextRequest {
    url: string;
    method: string;
    headers: Headers;
    constructor(url: string, init?: RequestInit) {
      this.url = url;
      this.method = init?.method ?? 'GET';
      this.headers = new Headers(init?.headers as HeadersInit);
    }
    nextUrl = { searchParams: new URLSearchParams(new URL('http://localhost/api/catalogs/standard?page=1&limit=10').search) };
  },
}));

describe("catalogAdminHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves catalog types correctly", () => {
    expect(() => resolveCatalogType("buddy")).toThrow(/Invalid catalog type/);
    expect(resolveCatalogType("standard")).toBe("standard");
    expect(resolveCatalogType("configurator")).toBe("configurator");
    expect(() => resolveCatalogType("invalid")).toThrow();
  });

  it("lists standard catalog items", async () => {
    const req = new NextRequest("http://localhost/api/catalogs/standard?page=1&limit=10");
    const response = await listStandardCatalog(req);
    expect(response).toBeDefined();
    const body = (response as unknown as { body?: { items?: unknown[] } }).body;
    expect(body?.items?.length ?? 0).toBeGreaterThan(0);
  });
});
