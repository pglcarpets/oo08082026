/**
 * @vitest-environment node
 *
 * Live DB smoke for planner_handoffs (admin Supabase service role).
 * Must run in node env — secret keys are rejected in browser test runtimes.
 * Skips when admin service env is missing.
 */
import { describe, it, expect } from "vitest";
import { plannerHandoffRequestSchema } from "@/lib/Planner/handoff/handoffSchema";
import { createPlannerHandoff } from "@/lib/Planner/handoff/createPlannerHandoff";

const hasAdmin =
  Boolean(process.env.NEXT_ADMIN_SUPABASE_URL?.trim()) &&
  Boolean(process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim());

describe.runIf(hasAdmin)("createPlannerHandoff → planner_handoffs (live)", () => {
  it("inserts and idempotently replays", async () => {
    const key = `vitest-smoke-${Date.now()}`;
    const req = plannerHandoffRequestSchema.parse({
      contact: {
        name: "Vitest Smoke",
        email: "vitest-smoke@example.com",
        phone: "",
        company: "",
        notes: "live smoke",
      },
      boq: {
        projectId: "vitest-smoke",
        projectName: "Vitest Smoke Office",
        calculationHash: "f".repeat(64),
        lines: [],
        subtotalInr: 0,
        gstInr: 0,
        totalInr: 0,
      },
      idempotencyKey: key,
    });

    const first = await createPlannerHandoff(req);
    const second = await createPlannerHandoff(req);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.idempotentReplay).toBe(false);
      expect(second.idempotentReplay).toBe(true);
      expect(second.referenceId).toBe(first.referenceId);
      expect(first.referenceId).toMatch(/^HO-/);
    }
  }, 30_000);
});
