/**
 * GET/PATCH /api/admin/features — Feature flag management (admin only).
 *
 * GET lists all feature flags (merged from Supabase `feature_flags` table and
 * local defaults). PATCH updates one or more flags by key, validating keys
 * against the known allowlist.
 *
 * Auth: `admin` role required (enforced by `withAuth`). Rate-limited per IP.
 *
 * PATCH body: {@link FeatureFlagsPatchSchema} —
 *   `{ key?, enabled?, updates?: { [flagName]: boolean } }`.
 *
 * Response (GET 200): `{ success: true, flags, source }`.
 * Response (PATCH 200): `{ success: true, source }`.
 * Errors: 400 (validation / unknown flag), 401, 403, 429, 500.
 *
 * UI toggles use {@link updateFeatureFlagsAction}; this route stays for GET
 * and non-UI callers.
 */

import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { withAuth } from "@/features/shared/api/withAuth";
import { success, error, validationError } from "@/features/shared/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";
import { FeatureFlagsPatchSchema } from "@/features/shared/api/schemas";
import {
  listFeatureFlagsAdmin,
  normalizeFeatureFlagUpdates,
  updateFeatureFlagsAdmin,
} from "@/features/admin/feature-flags/updateFeatureFlags.server";

async function handleFeaturesGet(): Promise<NextResponse> {
  const result = await listFeatureFlagsAdmin();
  return success({ flags: result.flags, source: result.source });
}

async function handleFeaturesPatch(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = FeatureFlagsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }

  const rawUpdates = normalizeFeatureFlagUpdates(parsed.data);
  if (!rawUpdates) {
    return validationError(
      [{ path: ["updates"], message: "No updates provided" }],
      "No updates provided",
    );
  }

  const result = await updateFeatureFlagsAdmin(rawUpdates);
  if (!result.ok) {
    if (result.kind === "validation") {
      return error(
        new ApiError(
          400,
          API_ERROR_CODES.VALIDATION_ERROR,
          result.message,
        ),
      );
    }
    return error(
      new ApiError(500, API_ERROR_CODES.DATABASE_ERROR, result.message),
    );
  }

  return success({ source: result.source });
}

/** List feature flags. Admin role; rate-limited. */
export const GET = withAuth(
  async () => handleFeaturesGet(),
  { role: "admin", rateLimitScope: "admin-features:get", rateLimit: 30 },
);

/** Update feature flags. Admin role; rate-limited. */
export const PATCH = withAuth(
  async (req) => handleFeaturesPatch(req as NextRequest),
  { role: "admin", rateLimitScope: "admin-features:patch", rateLimit: 20, requireCsrf: true },
);
