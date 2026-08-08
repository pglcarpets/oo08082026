/**
 * Name-mirror coverage for lib/audit/teamAccess.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const limit = vi.fn();
const where = vi.fn(() => ({ limit }));
const from = vi.fn(() => ({ where }));
const select = vi.fn(() => ({ from }));
const getAdminDb = vi.fn(() => ({ select }));
const isPlannerDatabaseUrlConfigured = vi.fn();

vi.mock("server-only", () => ({}));

vi.mock("@/platform/drizzle/adminDb", () => ({
  getAdminDb: () => getAdminDb(),
}));

vi.mock("@/platform/drizzle/schema/planner", () => ({
  teamMembers: {
    teamId: "team_id",
    userId: "user_id",
  },
}));

vi.mock("@/platform/drizzle/databaseUrls", () => ({
  isPlannerDatabaseUrlConfigured: () => isPlannerDatabaseUrlConfigured(),
}));

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => args,
  eq: (a: unknown, b: unknown) => ({ a, b }),
}));

describe("isAuditTeamId", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("accepts UUID v1-v5 values", async () => {
    const { isAuditTeamId } = await import("@/lib/audit/teamAccess");
    expect(isAuditTeamId("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isAuditTeamId("not-a-uuid")).toBe(false);
    expect(isAuditTeamId("11111111-1111-6111-8111-111111111111")).toBe(false);
  });
});

describe("userBelongsToTeam", () => {
  beforeEach(() => {
    vi.resetModules();
    limit.mockReset();
    where.mockClear();
    from.mockClear();
    select.mockClear();
    getAdminDb.mockClear();
    isPlannerDatabaseUrlConfigured.mockReset();
  });

  it("returns false for invalid team ids without querying", async () => {
    isPlannerDatabaseUrlConfigured.mockReturnValue(true);
    const { userBelongsToTeam } = await import("@/lib/audit/teamAccess");
    await expect(userBelongsToTeam("user-1", "bad")).resolves.toBe(false);
    expect(getAdminDb).not.toHaveBeenCalled();
  });

  it("returns false when planner database is not configured", async () => {
    isPlannerDatabaseUrlConfigured.mockReturnValue(false);
    const { userBelongsToTeam } = await import("@/lib/audit/teamAccess");
    await expect(
      userBelongsToTeam("user-1", "11111111-1111-4111-8111-111111111111"),
    ).resolves.toBe(false);
    expect(getAdminDb).not.toHaveBeenCalled();
  });

  it("returns true when membership row exists", async () => {
    isPlannerDatabaseUrlConfigured.mockReturnValue(true);
    limit.mockResolvedValue([{ teamId: "11111111-1111-4111-8111-111111111111" }]);
    const { userBelongsToTeam } = await import("@/lib/audit/teamAccess");
    await expect(
      userBelongsToTeam("user-1", "11111111-1111-4111-8111-111111111111"),
    ).resolves.toBe(true);
  });

  it("returns false and logs when the db lookup throws", async () => {
    isPlannerDatabaseUrlConfigured.mockReturnValue(true);
    limit.mockRejectedValue(new Error("db down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { userBelongsToTeam } = await import("@/lib/audit/teamAccess");
    await expect(
      userBelongsToTeam("user-1", "11111111-1111-4111-8111-111111111111"),
    ).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
