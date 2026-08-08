// @vitest-environment node
/**
 * Route-level evidence for GET /api/admin/price-books.
 * Proves admin gate + books list envelope for live pricing surface (08a).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";
import { setNodeEnv } from "@/tests/helpers/setNodeEnv";

const listAdminPriceBooks = vi.hoisted(() => vi.fn());

vi.mock("@/platform/supabase/server", () => ({
  createAuthServerClient: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/features/admin/pricing/priceBookAdmin.server", () => ({
  listAdminPriceBooks,
}));

import { createAuthServerClient } from '@/platform/supabase/server';
import { rateLimit } from "@/lib/rateLimit";
import { GET } from "@/app/api/admin/price-books/route";

describe("GET /api/admin/price-books", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, DEV_AUTH_BYPASS: "0" };
    setNodeEnv("test");
    vi.mocked(rateLimit).mockResolvedValue(
      rateLimitResult({ success: true, reset: 1 }),
    );
    listAdminPriceBooks.mockResolvedValue(["pb-linear-2026-q3"]);
  });

  function mockUser(
    user: {
      id: string;
      email?: string;
      app_metadata?: Record<string, unknown>;
    } | null,
  ) {
    vi.mocked(createAuthServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user },
          error: null,
        }),
      },
    } as never);
  }

  const createReq = (): NextRequest =>
    new NextRequest("http://localhost/api/admin/price-books", {
      method: "GET",
    });

  it("returns 401 when unauthenticated", async () => {
    mockUser(null);
    const res = await GET(createReq());
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("AUTH_REQUIRED");
    expect(listAdminPriceBooks).not.toHaveBeenCalled();
  });

  it("returns 403 when authenticated non-admin", async () => {
    mockUser({
      id: "member-1",
      email: "member@example.com",
      app_metadata: { role: "member" },
    });
    const res = await GET(createReq());
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(listAdminPriceBooks).not.toHaveBeenCalled();
  });

  it("returns 200 with books list for admin", async () => {
    mockUser({
      id: "admin-1",
      email: "admin@example.com",
      app_metadata: { role: "admin" },
    });
    const res = await GET(createReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.books).toEqual(["pb-linear-2026-q3"]);
    expect(listAdminPriceBooks).toHaveBeenCalledTimes(1);
    expect(rateLimit).toHaveBeenCalledWith(
      expect.stringMatching(/^price-books:list:/),
      60,
      60_000,
    );
  });

  it("returns 429 when rate limited", async () => {
    mockUser({
      id: "admin-1",
      email: "admin@example.com",
      app_metadata: { role: "admin" },
    });
    vi.mocked(rateLimit).mockResolvedValue(
      rateLimitResult({ success: false, reset: 77 }),
    );
    const res = await GET(createReq());
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(listAdminPriceBooks).not.toHaveBeenCalled();
  });
});
