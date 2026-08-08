// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";
import { setNodeEnv } from "@/tests/helpers/setNodeEnv";

const listFeatureFlagsAdmin = vi.hoisted(() => vi.fn());

vi.mock("@/platform/supabase/server", () => ({
  createAuthServerClient: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/features/admin/feature-flags/updateFeatureFlags.server", () => ({
  listFeatureFlagsAdmin,
}));

import { rateLimit } from "@/lib/rateLimit";
import { GET } from "@/app/api/features/route";

describe("GET /api/features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setNodeEnv("test");
    process.env.DEV_AUTH_BYPASS = "1";
    vi.mocked(rateLimit).mockResolvedValue(
      rateLimitResult({ success: true, reset: 1 }),
    );
    listFeatureFlagsAdmin.mockResolvedValue({
      flags: { planner2D: true, adminPlans: true },
      source: "local",
    });
  });

  it("returns resolved flags for guest consumers", async () => {
    const res = await GET(new Request("http://localhost/api/features") as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success?: boolean;
      flags?: { planner2D?: boolean };
    };
    expect(body.success).toBe(true);
    expect(body.flags?.planner2D).toBe(true);
    expect(listFeatureFlagsAdmin).toHaveBeenCalled();
  });
});
