import { describe, it, expect, beforeEach } from "vitest";
import { plannerHandoffRequestSchema } from "@/lib/Planner/handoff/handoffSchema";
import {
  createPlannerHandoff,
  createMemoryHandoffStore,
  __resetHandoffStoreForTests,
} from "@/lib/Planner/handoff/createPlannerHandoff";

describe("plannerHandoffRequestSchema", () => {
  it("accepts contact + boq hash", () => {
    const parsed = plannerHandoffRequestSchema.safeParse({
      contact: { name: "Ada", email: "ada@example.com", phone: "", company: "", notes: "" },
      boq: {
        projectId: "p1",
        projectName: "Office",
        calculationHash: "a".repeat(64),
        lines: [],
        subtotalInr: 0,
        gstInr: 0,
        totalInr: 0,
      },
      idempotencyKey: "idem-1",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty name", () => {
    const parsed = plannerHandoffRequestSchema.safeParse({
      contact: { name: "", email: "x@y.com" },
      boq: { projectId: "p1", projectName: "O", calculationHash: "a".repeat(64), lines: [] },
      idempotencyKey: "idem-1",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("createPlannerHandoff", () => {
  beforeEach(() => {
    __resetHandoffStoreForTests();
  });

  it("stores handoff and replays idempotently", async () => {
    const store = createMemoryHandoffStore();
    const req = plannerHandoffRequestSchema.parse({
      contact: { name: "Ada" },
      boq: {
        projectId: "p1",
        projectName: "Office",
        calculationHash: "b".repeat(64),
        lines: [],
      },
      idempotencyKey: "idem-2",
    });
    const first = await createPlannerHandoff(req, { store });
    const second = await createPlannerHandoff(req, { store });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.idempotentReplay).toBe(false);
      expect(second.idempotentReplay).toBe(true);
      expect(second.referenceId).toBe(first.referenceId);
    }
  });

  it("returns not_configured when admin env missing and no store", async () => {
    const prevUrl = process.env.NEXT_ADMIN_SUPABASE_URL;
    const prevKey = process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY;
    delete process.env.NEXT_ADMIN_SUPABASE_URL;
    delete process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY;
    try {
      const req = plannerHandoffRequestSchema.parse({
        contact: { name: "Ada" },
        boq: {
          projectId: "p1",
          projectName: "Office",
          calculationHash: "c".repeat(64),
          lines: [],
        },
        idempotencyKey: "idem-missing-env",
      });
      const result = await createPlannerHandoff(req);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.kind).toBe("not_configured");
      }
    } finally {
      if (prevUrl !== undefined) process.env.NEXT_ADMIN_SUPABASE_URL = prevUrl;
      if (prevKey !== undefined) process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY = prevKey;
    }
  });
});
