/**
 * GET /api/features — public resolved feature flags for Planner / Studio / site UI.
 * Same defaults + in-memory/Supabase overrides as admin list (read-only).
 */

import type { NextResponse } from "next/server";
import { withAuth } from "@/features/shared/api/withAuth";
import { success } from "@/features/shared/api/apiResponse";
import { listFeatureFlagsAdmin } from "@/features/admin/feature-flags/updateFeatureFlags.server";

async function handleFeaturesGet(): Promise<NextResponse> {
  const result = await listFeatureFlagsAdmin();
  return success({ flags: result.flags, source: result.source });
}

export const GET = withAuth(
  async () => handleFeaturesGet(),
  {
    role: "guest",
    rateLimitScope: "features:get",
    rateLimit: 60,
  },
);
