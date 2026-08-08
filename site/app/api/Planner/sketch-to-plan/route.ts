/**
 * POST /api/Planner/sketch-to-plan — convert a sketch image into editable plan geometry.
 */

import type { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/features/shared/api/withAuth";
import { error, success, validationError } from "@/features/shared/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";
import {
  SketchToPlanRequestSchema,
  classifySketchConversionError,
  getSketchRecoveryMessage,
} from "@planner/lib/ai/sketchToPlanShared";
import { requestSketchToPlan } from "@planner/server/sketchToPlan.server";
import { isFeatureEnabled } from "@/lib/featureFlags";

async function handleSketchToPlan(req: NextRequest): Promise<NextResponse> {
  if (!isFeatureEnabled("sketchToPlan")) {
    return error(
      new ApiError(
        403,
        API_ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        "Sketch-to-plan is disabled by feature flag.",
      ),
    );
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = SketchToPlanRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }

  try {
    const result = await requestSketchToPlan(parsed.data);
    return success({
      status: "preview",
      fileName: parsed.data.fileName,
      objects: result.objects,
      warnings: result.warnings,
    });
  } catch (err) {
    const sketchError = classifySketchConversionError(err, parsed.data.fileName);
    if (sketchError.reason !== "server_error") {
      return success({
        status: "fallback",
        fileName: parsed.data.fileName,
        reason: sketchError.reason,
        message: getSketchRecoveryMessage(sketchError.reason),
      });
    }

    return error(
      new ApiError(503, API_ERROR_CODES.SERVICE_UNAVAILABLE, sketchError.message, {
        reason: sketchError.reason,
        fileName: parsed.data.fileName,
      }),
    );
  }
}

export const POST = withAuth(
  async (req) => handleSketchToPlan(req as NextRequest),
  {
    role: "guest",
    rateLimitScope: "planner-sketch-to-plan",
    rateLimit: 6,
    requireCsrf: true,
  },
);
