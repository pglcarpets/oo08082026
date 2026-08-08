/**
 * Contract tests for POST /api/Planner/handoff.
 * withAuth + createPlannerHandoff mocked so this stays unit-level.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const createPlannerHandoff = vi.hoisted(() => vi.fn());

const authCapture = vi.hoisted(() => ({
  options: null as Record<string, unknown> | null,
  auth: {
    user: null as { id: string; email: string; role: string } | null,
    isAdmin: false,
    requiredRole: "guest" as const,
  },
}));

vi.mock("@/features/shared/api/withAuth", () => ({
  withAuth: (
    handler: (
      req: NextRequest,
      auth: typeof authCapture.auth,
    ) => Promise<Response>,
    options: Record<string, unknown>,
  ) => {
    authCapture.options = options;
    return (req: NextRequest) => handler(req, authCapture.auth);
  },
}));

vi.mock("@/lib/Planner/handoff/createPlannerHandoff", () => ({
  createPlannerHandoff,
}));

import { POST } from "@/app/api/Planner/handoff/route";

function validBody(overrides: Record<string, unknown> = {}) {
  return {
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
    idempotencyKey: "idem-route-1",
    ...overrides,
  };
}

function postJson(body: unknown) {
  return new NextRequest("http://localhost/api/Planner/handoff", {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": "t" },
    body: JSON.stringify(body),
  });
}

describe("app/api/Planner/handoff/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authCapture.auth = {
      user: null,
      isAdmin: false,
      requiredRole: "guest",
    };
    createPlannerHandoff.mockResolvedValue({
      ok: true,
      referenceId: "HO-TEST1",
      createdAt: "2026-07-31T12:00:00.000Z",
      idempotentReplay: false,
      message: "Handoff HO-TEST1 recorded for staff follow-up.",
    });
  });

  it("requires CSRF on guest mutator", () => {
    expect(authCapture.options).toEqual(
      expect.objectContaining({
        role: "guest",
        requireCsrf: true,
        rateLimitScope: "planner-handoff:post",
      }),
    );
  });

  it("returns validation error for empty name", async () => {
    const res = await POST(
      postJson(validBody({ contact: { name: "", email: "x@y.com" } })),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(createPlannerHandoff).not.toHaveBeenCalled();
  });

  it("returns 200 with referenceId on success", async () => {
    const res = await POST(postJson(validBody()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.referenceId).toBe("HO-TEST1");
    expect(body.idempotentReplay).toBe(false);
    expect(createPlannerHandoff).toHaveBeenCalledOnce();
  });

  it("returns 503 when handoff store is not configured", async () => {
    createPlannerHandoff.mockResolvedValue({
      ok: false,
      kind: "not_configured",
      code: "handoff_not_configured",
      message: "not configured",
    });
    const res = await POST(postJson(validBody({ idempotencyKey: "idem-503" })));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 500 on persist failure", async () => {
    createPlannerHandoff.mockResolvedValue({
      ok: false,
      kind: "persist_failed",
      code: "handoff_persist_failed",
      message: "db down",
    });
    const res = await POST(postJson(validBody({ idempotencyKey: "idem-500" })));
    expect(res.status).toBe(500);
  });
});
