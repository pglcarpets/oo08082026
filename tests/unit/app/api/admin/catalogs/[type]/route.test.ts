// @vitest-environment node
/**
 * Route-level evidence for GET /api/admin/catalogs/[type].
 * Proves admin gate + type dispatch for live catalog surface (08a).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";
import { setNodeEnv } from "@/tests/helpers/setNodeEnv";

const listStandardCatalog = vi.hoisted(() => vi.fn());
const listConfiguratorCatalog = vi.hoisted(() => vi.fn());
const resolveCatalogType = vi.hoisted(() => vi.fn());
const createStandardCatalog = vi.hoisted(() => vi.fn());
const createConfiguratorCatalog = vi.hoisted(() => vi.fn());

vi.mock("@/platform/supabase/server", () => ({
  createAuthServerClient: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn(),
}));

vi.mock("@/features/admin/api/catalogAdminHandlers", () => ({
  listStandardCatalog,
  listConfiguratorCatalog,
  resolveCatalogType,
  createStandardCatalog,
  createConfiguratorCatalog,
}));

import { createAuthServerClient } from '@/platform/supabase/server';
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { GET, POST } from "@/app/api/admin/catalogs/[type]/route";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";

describe("GET /api/admin/catalogs/[type]", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, DEV_AUTH_BYPASS: "0" };
    setNodeEnv("test");
    vi.mocked(rateLimit).mockResolvedValue(
      rateLimitResult({ success: true, reset: 1 }),
    );
    resolveCatalogType.mockImplementation((raw: string) => {
      if (raw === "standard" || raw === "configurator") return raw;
      throw new ApiError(
        400,
        API_ERROR_CODES.INVALID_INPUT,
        `Invalid catalog type: ${raw}`,
      );
    });
    listStandardCatalog.mockResolvedValue(
      NextResponse.json({
        success: true,
        items: [{ id: "item-1", name: "Desk" }],
        source: "local-catalog",
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      }),
    );
    listConfiguratorCatalog.mockResolvedValue(
      NextResponse.json({
        success: true,
        items: [{ id: "cfg-1", name: "Config desk" }],
        total: 1,
        source: "configurator_products",
      }),
    );
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

  function adminUser() {
    mockUser({
      id: "admin-1",
      email: "admin@example.com",
      app_metadata: { role: "admin" },
    });
  }

  const createReq = (type: string): NextRequest =>
    new NextRequest(`http://localhost/api/admin/catalogs/${type}`, {
      method: "GET",
    });

  const context = (type: string) => ({
    params: Promise.resolve({ type }),
  });

  it("returns 401 when unauthenticated", async () => {
    mockUser(null);
    const res = await GET(createReq("standard"), context("standard"));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("AUTH_REQUIRED");
    expect(listStandardCatalog).not.toHaveBeenCalled();
  });

  it("returns 403 when authenticated non-admin", async () => {
    mockUser({
      id: "member-1",
      email: "member@example.com",
      app_metadata: { role: "member" },
    });
    const res = await GET(createReq("standard"), context("standard"));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(listStandardCatalog).not.toHaveBeenCalled();
  });

  it("returns 200 for standard catalog happy path", async () => {
    adminUser();
    const res = await GET(createReq("standard"), context("standard"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.items).toEqual([{ id: "item-1", name: "Desk" }]);
    expect(data.source).toBe("local-catalog");
    expect(resolveCatalogType).toHaveBeenCalledWith("standard");
    expect(listStandardCatalog).toHaveBeenCalledTimes(1);
    expect(listConfiguratorCatalog).not.toHaveBeenCalled();
    expect(rateLimit).toHaveBeenCalledWith(
      expect.stringMatching(/^admin-catalogs:get:/),
      60,
      60_000,
    );
  });

  it("returns 200 for configurator catalog happy path", async () => {
    adminUser();
    const res = await GET(createReq("configurator"), context("configurator"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.items).toEqual([{ id: "cfg-1", name: "Config desk" }]);
    expect(listConfiguratorCatalog).toHaveBeenCalledTimes(1);
    expect(listStandardCatalog).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid catalog type", async () => {
    adminUser();
    const res = await GET(createReq("buddy"), context("buddy"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_INPUT");
    expect(listStandardCatalog).not.toHaveBeenCalled();
    expect(listConfiguratorCatalog).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    adminUser();
    vi.mocked(rateLimit).mockResolvedValue(
      rateLimitResult({ success: false, reset: 55 }),
    );
    const res = await GET(createReq("standard"), context("standard"));
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(listStandardCatalog).not.toHaveBeenCalled();
    expect(listConfiguratorCatalog).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/catalogs/[type] — unauth/error gates", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, DEV_AUTH_BYPASS: "0" };
    setNodeEnv("test");
    vi.mocked(rateLimit).mockResolvedValue(
      rateLimitResult({ success: true, reset: 1 }),
    );
    vi.mocked(validateCsrfRequest).mockResolvedValue(true);
    resolveCatalogType.mockImplementation((raw: string) => {
      if (raw === "standard" || raw === "configurator") return raw;
      throw new ApiError(
        400,
        API_ERROR_CODES.INVALID_INPUT,
        `Invalid catalog type: ${raw}`,
      );
    });
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

  const createPost = (type: string): NextRequest =>
    new NextRequest(`http://localhost/api/admin/catalogs/${type}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "x" }),
    });

  const context = (type: string) => ({
    params: Promise.resolve({ type }),
  });

  it("returns 401 when unauthenticated", async () => {
    mockUser(null);
    const res = await POST(createPost("standard"), context("standard"));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("AUTH_REQUIRED");
    expect(createStandardCatalog).not.toHaveBeenCalled();
  });

  it("returns 403 when authenticated non-admin", async () => {
    mockUser({
      id: "member-1",
      email: "member@example.com",
      app_metadata: { role: "member" },
    });
    const res = await POST(createPost("standard"), context("standard"));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(createStandardCatalog).not.toHaveBeenCalled();
  });

  it("returns 403 when CSRF validation fails", async () => {
    mockUser({
      id: "admin-1",
      email: "admin@example.com",
      app_metadata: { role: "admin" },
    });
    vi.mocked(validateCsrfRequest).mockResolvedValue(false);
    const res = await POST(createPost("standard"), context("standard"));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("CSRF_FAILED");
    expect(res.headers.get("x-csrf-rejected")).toBe("1");
    expect(createStandardCatalog).not.toHaveBeenCalled();
  });
});
