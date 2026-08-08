// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/platform/drizzle/createPostgresDrizzle", () => ({
  createPostgresDrizzle: vi.fn(),
}));

vi.mock("@/platform/drizzle/databaseUrls", () => ({
  resolvePlannerDatabaseUrl: vi.fn(),
}));

import { createPostgresDrizzle } from "@/platform/drizzle/createPostgresDrizzle";
import { resolvePlannerDatabaseUrl } from "@/platform/drizzle/databaseUrls";

describe("platform/drizzle/adminDb", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("throws when planner database URL is missing", async () => {
    vi.mocked(resolvePlannerDatabaseUrl).mockReturnValue(null);

    const { getAdminDb } = await import("@/platform/drizzle/adminDb");

    expect(() => getAdminDb()).toThrow(
      /Planner database URL is missing\. Set SUPABASE_AUTH_DATABASE_URL/,
    );
    expect(createPostgresDrizzle).not.toHaveBeenCalled();
  });

  it("creates and caches a drizzle client", async () => {
    const mockDb = { select: vi.fn(), tag: "admin-db" };
    vi.mocked(resolvePlannerDatabaseUrl).mockReturnValue("postgres://planner/db");
    vi.mocked(createPostgresDrizzle).mockReturnValue(
      mockDb as unknown as ReturnType<typeof createPostgresDrizzle>,
    );

    const { getAdminDb } = await import("@/platform/drizzle/adminDb");

    const first = getAdminDb();
    const second = getAdminDb();

    expect(first).toBe(mockDb);
    expect(second).toBe(mockDb);
    expect(createPostgresDrizzle).toHaveBeenCalledTimes(1);
    expect(createPostgresDrizzle).toHaveBeenCalledWith("postgres://planner/db");
  });

  it("adminDb proxy forwards property access to getAdminDb()", async () => {
    const select = vi.fn();
    const mockDb = { select, tag: "admin-proxy" };
    vi.mocked(resolvePlannerDatabaseUrl).mockReturnValue("postgres://planner/db");
    vi.mocked(createPostgresDrizzle).mockReturnValue(
      mockDb as unknown as ReturnType<typeof createPostgresDrizzle>,
    );

    const { adminDb } = await import("@/platform/drizzle/adminDb");

    expect(adminDb.select).toBe(select);
    expect((adminDb as { tag?: string }).tag).toBe("admin-proxy");
  });
});
