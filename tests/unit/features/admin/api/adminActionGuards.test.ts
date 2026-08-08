import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveAuthContext } from "@/features/shared/api/withAuth";
import { rateLimit } from "@/lib/rateLimit";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () =>
    new Headers({
      "cf-connecting-ip": "198.51.100.7",
    }),
  ),
}));

vi.mock("@/features/shared/api/withAuth", () => ({
  resolveAuthContext: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

import {
  assertActionRateLimit,
  requireAdminAction,
  resolveClientIp,
  runAdminDomain,
} from "@/features/admin/api/adminActionGuards";

describe("adminActionGuards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveAuthContext).mockResolvedValue({
      user: { id: "admin-1", email: "admin@example.com", role: "admin" },
      isAdmin: true,
      requiredRole: "admin",
    });
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
  });

  it("resolves client IP, admin gate, rate limit, and domain errors", async () => {
    expect(
      resolveClientIp(
        new Headers({
          "cf-connecting-ip": "198.51.100.7",
          "x-forwarded-for": "203.0.113.1, 10.0.0.1",
        }),
      ),
    ).toBe("198.51.100.7");
    expect(resolveClientIp(new Headers())).toBe("localhost");

    await expect(requireAdminAction()).resolves.toBeUndefined();
    expect(resolveAuthContext).toHaveBeenCalledWith("admin");

    await assertActionRateLimit("admin-catalogs:post", 20);
    expect(rateLimit).toHaveBeenCalledWith(
      "admin-catalogs:post:198.51.100.7",
      20,
      60_000,
    );

    await expect(runAdminDomain(async () => ({ ok: true }))).resolves.toEqual({
      ok: true,
    });
    await expect(
      runAdminDomain(async () => {
        throw new ApiError(500, API_ERROR_CODES.DATABASE_ERROR, "DB failed");
      }),
    ).rejects.toThrow();

    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 20,
      remaining: 0,
      reset: Date.now() + 60_000,
    });
    await expect(assertActionRateLimit("admin-catalogs:post", 20)).rejects.toThrow();
  });
});
