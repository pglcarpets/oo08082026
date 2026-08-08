/**
 * Contract tests for POST /api/Planner/sketch-to-plan.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requestSketchToPlan = vi.hoisted(() => vi.fn());
const isFeatureEnabled = vi.hoisted(() => vi.fn(() => true));

const authCapture = vi.hoisted(() => ({
  options: null as Record<string, unknown> | null,
}));

vi.mock("@/features/shared/api/withAuth", () => ({
  withAuth: (
    handler: (req: NextRequest) => Promise<Response>,
    options: Record<string, unknown>,
  ) => {
    authCapture.options = options;
    return handler;
  },
}));

vi.mock("@planner/server/sketchToPlan.server", () => ({
  requestSketchToPlan,
}));

vi.mock("@/lib/featureFlags", () => ({
  isFeatureEnabled,
}));

import { POST } from "@/app/api/Planner/sketch-to-plan/route";
import { SketchConversionError } from "@/lib/Planner/ai/sketchToPlanShared";

function postJson(body: unknown) {
  return new NextRequest("http://localhost/api/Planner/sketch-to-plan", {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": "t" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  imageDataUrl: "data:image/png;base64,aaaa",
  fileName: "sketch.png",
  prompt: "Trace walls",
  includeRooms: true,
};

describe("app/api/Planner/sketch-to-plan/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isFeatureEnabled.mockReturnValue(true);
    requestSketchToPlan.mockResolvedValue({
      objects: [{ type: "wall", x1: 0, y1: 0, x2: 4000, y2: 0 }],
      warnings: [],
    });
  });

  it("requires CSRF on guest mutator", () => {
    expect(authCapture.options).toEqual(
      expect.objectContaining({
        role: "guest",
        requireCsrf: true,
        rateLimitScope: "planner-sketch-to-plan",
      }),
    );
  });

  it("returns 403 when feature flag off", async () => {
    isFeatureEnabled.mockReturnValue(false);
    const res = await POST(postJson(validBody));
    expect(res.status).toBe(403);
    expect(requestSketchToPlan).not.toHaveBeenCalled();
  });

  it("returns validation error for bad image", async () => {
    const res = await POST(
      postJson({ ...validBody, imageDataUrl: "not-a-data-url" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns preview success", async () => {
    const res = await POST(postJson(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe("preview");
    expect(body.objects).toHaveLength(1);
  });

  it("returns fallback success for missing provider", async () => {
    requestSketchToPlan.mockRejectedValue(
      new SketchConversionError(
        "missing_provider",
        "sketch.png",
        "AI conversion is unavailable",
      ),
    );
    const res = await POST(postJson(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe("fallback");
    expect(body.reason).toBe("missing_provider");
  });
});
