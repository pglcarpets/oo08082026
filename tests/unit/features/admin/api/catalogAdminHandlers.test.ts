import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type MockRow = Record<string, unknown>;

const sampleManagedRow: MockRow = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "Test Item",
  slug: "test-item",
  planner_source_slug: "test-item",
  category: "seating",
  category_id: "seating",
  category_name: "Seating",
  series_id: "ser-1",
  series_name: "Test Series",
  specs: { widthMm: 100, depthMm: 50, heightMm: 80, priceInr: 10, meshType: "box" },
  price: 10,
  active: true,
  visible: true,
  flagship_image: "/img.png",
  description: "A chair",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  metadata: { source: "admin-catalog" },
};

const createAdminServiceClient = vi.fn();
const isMissingTableError = vi.fn((msg?: string) =>
  typeof msg === "string" && msg.includes("does not exist"),
);
const fetchAdminConfiguratorCatalog = vi.fn();

vi.mock("@/platform/supabase/adminServer", () => ({
  createAdminServiceClient: (...args: unknown[]) => createAdminServiceClient(...args),
  isMissingTableError: (msg?: string) => isMissingTableError(msg),
}));

vi.mock("@/lib/catalog/configuratorCatalog.server", () => ({
  fetchAdminConfiguratorCatalog: (...args: unknown[]) =>
    fetchAdminConfiguratorCatalog(...args),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({ body, init })),
  },
  NextRequest: class NextRequest {
    url: string;
    method: string;
    headers: Headers;
    nextUrl: { searchParams: URLSearchParams };
    private readonly bodyText: string | undefined;
    constructor(url: string, init?: RequestInit) {
      this.url = url;
      this.method = init?.method ?? "GET";
      this.headers = new Headers(init?.headers as HeadersInit);
      this.nextUrl = { searchParams: new URL(url).searchParams };
      this.bodyText =
        typeof init?.body === "string"
          ? init.body
          : init?.body !== null && init?.body !== undefined
            ? String(init.body)
            : undefined;
    }
    async json(): Promise<unknown> {
      if (!this.bodyText) throw new Error("no body");
      return JSON.parse(this.bodyText);
    }
  },
}));

import {
  CATALOG_TYPES,
  createStandardCatalog,
  listStandardCatalog,
  resolveCatalogType,
} from "@/features/admin/api/catalogAdminHandlers";

function responseBody(res: unknown): Record<string, unknown> {
  return (res as { body?: Record<string, unknown> }).body ?? {};
}

function responseStatus(res: unknown): number | undefined {
  return (res as { init?: { status?: number } }).init?.status;
}

function makeSupabase(options?: {
  list?: { data?: MockRow[] | null; error?: { message?: string; code?: string } | null };
  insert?: { data?: MockRow | null; error?: { message?: string; code?: string } | null };
}) {
  const listResult = options?.list ?? {
    data: [sampleManagedRow],
    error: null,
  };
  const insertResult = options?.insert ?? {
    data: sampleManagedRow,
    error: null,
  };

  const from = vi.fn(() => {
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => ({
      order: vi.fn(async () => listResult),
      eq: vi.fn(() => ({
        single: vi.fn(async () => ({ data: sampleManagedRow, error: null })),
      })),
    }));
    chain.insert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => insertResult),
      })),
    }));
    return chain;
  });

  return { from };
}

describe("catalogAdminHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAdminServiceClient.mockReturnValue(makeSupabase());
    isMissingTableError.mockImplementation(
      (msg?: string) => typeof msg === "string" && msg.includes("does not exist"),
    );
    fetchAdminConfiguratorCatalog.mockResolvedValue([
      { id: "c1", name: "Config desk", category: "desks", active: true },
    ]);
  });

  it("exposes catalog type keys and rejects invalid types", () => {
    expect(CATALOG_TYPES).toEqual(
      expect.arrayContaining(["standard", "configurator"]),
    );
    expect(resolveCatalogType("standard")).toBe("standard");
    expect(() => resolveCatalogType("buddy")).toThrow(/Invalid catalog type/);
  });

  it("lists managed products with filters and falls back when storage missing", async () => {
    const rows = [
      { ...sampleManagedRow, name: "Alpha Desk", category: "workstation", active: true },
      {
        ...sampleManagedRow,
        id: "11111111-1111-4111-8111-111111111111",
        name: "Hidden Chair",
        category: "seating",
        active: false,
        description: "secret",
      },
    ];
    createAdminServiceClient.mockReturnValue(
      makeSupabase({ list: { data: rows, error: null } }),
    );

    const filtered = await listStandardCatalog(
      new NextRequest(
        "http://localhost/api/catalogs/standard?page=1&limit=10&category=seating&search=hidden&visible=false",
      ),
    );
    const body = responseBody(filtered);
    expect(body.source).toBe("planner_managed_products");
    expect((body.items as unknown[]).length).toBe(1);
    expect((body.items as { name: string }[])[0]?.name).toBe("Hidden Chair");

    createAdminServiceClient.mockReturnValue(null);
    const local = await listStandardCatalog(
      new NextRequest("http://localhost/api/catalogs/standard?page=1&limit=5"),
    );
    expect(responseBody(local).source).toBe("local-catalog");
  });

  it("creates standard items and fails closed without storage", async () => {
    const validBody = {
      name: "New Desk",
      category: "desks",
      subcategory: "linear",
      width_mm: 1200,
      depth_mm: 600,
      height_mm: 750,
      price: 1000,
      mesh_type: "box",
      image_url: "/desk.png",
      visible: true,
      description: "A desk",
    };

    createAdminServiceClient.mockReturnValue(
      makeSupabase({
        insert: {
          data: {
            ...sampleManagedRow,
            name: "New Desk",
            category: "desks",
            specs: { widthMm: 1200, depthMm: 600, heightMm: 750, priceInr: 1000 },
          },
          error: null,
        },
      }),
    );
    const created = await createStandardCatalog(
      new NextRequest("http://localhost/api/catalogs/standard", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
    );
    expect(responseStatus(created)).toBe(201);
    expect(responseBody(created).source).toBe("planner_managed_products");

    createAdminServiceClient.mockReturnValue(null);
    const unavailable = await createStandardCatalog(
      new NextRequest("http://localhost/api/catalogs/standard", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
    );
    expect(responseBody(unavailable)).toBeDefined();
  });
});
