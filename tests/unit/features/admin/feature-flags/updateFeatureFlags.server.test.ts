import { beforeEach, describe, expect, it, vi } from "vitest";

const getAllFlagNames = vi.hoisted(() =>
  vi.fn(() => ["planner2D", "catalogSidebar"]),
);
const getFeatureFlags = vi.hoisted(() =>
  vi.fn(() => ({ planner2D: true, catalogSidebar: true })),
);
const setFeatureFlags = vi.hoisted(() => vi.fn());
const createClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/featureFlags", () => ({
  getAllFlagNames,
  getFeatureFlags,
  setFeatureFlags,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient,
}));

import {
  listFeatureFlagsAdmin,
  normalizeFeatureFlagUpdates,
  updateFeatureFlagsAdmin,
} from "@/features/admin/feature-flags/updateFeatureFlags.server";

describe("updateFeatureFlags.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    createClient.mockReturnValue(null);
  });

  it("normalizes updates and lists/updates flags in memory without Supabase", async () => {
    expect(
      normalizeFeatureFlagUpdates({
        updates: { planner2D: false },
        key: "catalogSidebar",
        enabled: true,
      }),
    ).toEqual({ planner2D: false });
    expect(
      normalizeFeatureFlagUpdates({
        key: "catalogSidebar",
        enabled: false,
      }),
    ).toEqual({ catalogSidebar: false });

    const listed = await listFeatureFlagsAdmin();
    expect(listed.source).toBe("local");
    expect(listed.flags).toMatchObject({ planner2D: true, catalogSidebar: true });

    const updated = await updateFeatureFlagsAdmin({ planner2D: false });
    expect(updated.ok).toBe(true);
    expect(setFeatureFlags).toHaveBeenCalled();
  });
});
