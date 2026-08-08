// @vitest-environment node
/**
 * Route-level evidence for GET/PATCH /api/admin/features.
 * Proves admin gate + success envelope for live feature-flag surface (08a).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";
import { setNodeEnv } from "@/tests/helpers/setNodeEnv";

const listFeatureFlagsAdmin = vi.hoisted(() => vi.fn());
const updateFeatureFlagsAdmin = vi.hoisted(() => vi.fn());
const normalizeFeatureFlagUpdates = vi.hoisted(() => vi.fn());

vi.mock("@/platform/supabase/server", () => ({
  createAuthServerClient: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn(),
}));

vi.mock("@/features/admin/feature-flags/updateFeatureFlags.server", () => ({
  listFeatureFlagsAdmin,
  updateFeatureFlagsAdmin,
  normalizeFeatureFlagUpdates,
}));

import { createAuthServerClient } from '@/platform/supabase/server';
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { GET, PATCH } from "@/app/api/admin/features/route";

describe("GET/PATCH /api/admin/features", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, DEV_AUTH_BYPASS: "0" };
    setNodeEnv("test");
    vi.mocked(rateLimit).mockResolvedValue(
      rateLimitResult({ success: true, reset: 1 }),
    );
    vi.mocked(validateCsrfRequest).mockResolvedValue(true);
    listFeatureFlagsAdmin.mockResolvedValue({
      flags: { planner2D: true, catalogSidebar: true },
      source: "local",
    });
    normalizeFeatureFlagUpdates.mockReturnValue({ planner2D: false });
    updateFeatureFlagsAdmin.mockResolvedValue({ ok: true, source: "local" });
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

  const createReq = (
    method: string,
    body?: Record<string, unknown>,
  ): NextRequest =>
    new NextRequest("http://localhost/api/admin/features", {
      method,
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      mockUser(null);
      const res = await GET(createReq("GET"));
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("AUTH_REQUIRED");
      expect(listFeatureFlagsAdmin).not.toHaveBeenCalled();
    });

    it("returns 403 when authenticated non-admin", async () => {
      mockUser({
        id: "member-1",
        email: "member@example.com",
        app_metadata: { role: "member" },
      });
      const res = await GET(createReq("GET"));
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INSUFFICIENT_PERMISSIONS");
      expect(listFeatureFlagsAdmin).not.toHaveBeenCalled();
    });

    it("returns 200 with flags and source for admin", async () => {
      adminUser();
      const res = await GET(createReq("GET"));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.flags).toEqual({ planner2D: true, catalogSidebar: true });
      expect(data.source).toBe("local");
      expect(listFeatureFlagsAdmin).toHaveBeenCalledTimes(1);
      expect(rateLimit).toHaveBeenCalledWith(
        expect.stringMatching(/^admin-features:get:/),
        30,
        60_000,
      );
    });

    it("returns 429 when rate limited", async () => {
      adminUser();
      vi.mocked(rateLimit).mockResolvedValue(
        rateLimitResult({ success: false, reset: 99 }),
      );
      const res = await GET(createReq("GET"));
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(listFeatureFlagsAdmin).not.toHaveBeenCalled();
    });
  });

  describe("PATCH", () => {
    it("returns 401 when unauthenticated", async () => {
      mockUser(null);
      const res = await PATCH(
        createReq("PATCH", { updates: { planner2D: false } }),
      );
      expect(res.status).toBe(401);
      expect(updateFeatureFlagsAdmin).not.toHaveBeenCalled();
    });

    it("returns 403 when authenticated non-admin", async () => {
      mockUser({
        id: "member-1",
        email: "member@example.com",
        app_metadata: { role: "member" },
      });
      const res = await PATCH(
        createReq("PATCH", { updates: { planner2D: false } }),
      );
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INSUFFICIENT_PERMISSIONS");
      expect(updateFeatureFlagsAdmin).not.toHaveBeenCalled();
    });

    it("returns 403 when CSRF validation fails", async () => {
      adminUser();
      vi.mocked(validateCsrfRequest).mockResolvedValue(false);
      const res = await PATCH(
        createReq("PATCH", { updates: { planner2D: false } }),
      );
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("CSRF_FAILED");
      expect(res.headers.get("x-csrf-rejected")).toBe("1");
      expect(updateFeatureFlagsAdmin).not.toHaveBeenCalled();
    });

    it("returns 429 when rate limited", async () => {
      adminUser();
      vi.mocked(rateLimit).mockResolvedValue(
        rateLimitResult({ success: false, reset: 42 }),
      );
      const res = await PATCH(
        createReq("PATCH", { updates: { planner2D: false } }),
      );
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(updateFeatureFlagsAdmin).not.toHaveBeenCalled();
      expect(rateLimit).toHaveBeenCalledWith(
        expect.stringMatching(/^admin-features:patch:/),
        20,
        60_000,
      );
    });

    it("returns 400 when body has no updates", async () => {
      adminUser();
      const res = await PATCH(createReq("PATCH", {}));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(updateFeatureFlagsAdmin).not.toHaveBeenCalled();
    });

    it("returns 400 when normalizeFeatureFlagUpdates yields null", async () => {
      adminUser();
      // Schema may accept key-only with empty updates object depending on refine;
      // force the normalize null branch after parse.
      normalizeFeatureFlagUpdates.mockReturnValueOnce(null);
      const res = await PATCH(
        createReq("PATCH", { updates: { planner2D: true } }),
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(String(data.error.message)).toMatch(/No updates provided/i);
      expect(updateFeatureFlagsAdmin).not.toHaveBeenCalled();
    });

    it("returns 400 when updateFeatureFlagsAdmin rejects unknown keys", async () => {
      adminUser();
      normalizeFeatureFlagUpdates.mockReturnValueOnce({ notARealFlag: true });
      updateFeatureFlagsAdmin.mockResolvedValueOnce({
        ok: false,
        kind: "validation",
        message: "Unknown flag keys: notARealFlag",
        invalidKeys: ["notARealFlag"],
      });
      const res = await PATCH(
        createReq("PATCH", { updates: { notARealFlag: true } }),
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(String(data.error.message)).toMatch(/Unknown flag keys/i);
    });

    it("returns 500 when updateFeatureFlagsAdmin hits database error", async () => {
      adminUser();
      updateFeatureFlagsAdmin.mockResolvedValueOnce({
        ok: false,
        kind: "database",
        message: "write failed",
      });
      const res = await PATCH(
        createReq("PATCH", { updates: { planner2D: false } }),
      );
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("DATABASE_ERROR");
      expect(String(data.error.message)).toMatch(/write failed/i);
    });

    it("returns 200 when admin patches valid flags", async () => {
      adminUser();
      const res = await PATCH(
        createReq("PATCH", { updates: { planner2D: false } }),
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.source).toBe("local");
      expect(updateFeatureFlagsAdmin).toHaveBeenCalledWith({ planner2D: false });
    });
  });
});
