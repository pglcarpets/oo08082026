"use server";

import { returnServerError } from "next-safe-action";
import { actionClient } from "@/lib/safe-action";
import {
  assertActionRateLimit,
  requireAdminAction,
} from "@/features/admin/api/adminActionGuards";
import { FeatureFlagsPatchSchema } from "@/features/shared/api/schemas";
import {
  normalizeFeatureFlagUpdates,
  updateFeatureFlagsAdmin,
} from "@/features/admin/feature-flags/updateFeatureFlags.server";

/**
 * Admin feature-flag toggle — same domain path as PATCH /api/admin/features.
 * Thin safe-action wrapper (no RHF); click mutations use useAction.
 */
export const updateFeatureFlagsAction = actionClient
  .inputSchema(FeatureFlagsPatchSchema)
  .action(async ({ parsedInput }) => {
    await requireAdminAction();
    await assertActionRateLimit(
      "admin-features:patch",
      20,
      "Too many feature-flag updates. Please try again shortly.",
    );

    const rawUpdates = normalizeFeatureFlagUpdates(parsedInput);
    if (!rawUpdates) {
      returnServerError("No updates provided");
    }

    const result = await updateFeatureFlagsAdmin(rawUpdates);
    if (!result.ok) {
      returnServerError(result.message);
    }

    return { source: result.source };
  });
