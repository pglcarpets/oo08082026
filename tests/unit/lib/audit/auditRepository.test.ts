import { describe, it, expect, vi, beforeEach } from "vitest";
import { insertEvent } from "@/lib/audit/auditRepository";
import { adminDb } from "@/platform/drizzle/adminDb";

vi.mock("@/platform/drizzle/adminDb", () => {
  const mockValues = vi.fn(() => Promise.resolve());
  const mockInsert = vi.fn(() => ({
    values: mockValues,
  }));
  return {
    adminDb: {
      insert: mockInsert,
    },
  };
});

vi.mock("@/platform/drizzle/schema/planner", () => ({
  auditEvents: {},
}));

describe("auditRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts an audit event into db", async () => {
    const event = {
      team_id: "team-123",
      actor_id: "user-456",
      action: "view",
      target_type: "plan",
      target_id: "plan-789",
      metadata: { source: "test" },
    };

    await insertEvent(event);

    expect(adminDb.insert).toHaveBeenCalled();
  });
});