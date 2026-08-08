/**
 * POST /api/Planner/handoff — record BOQ handoff for staff follow-up.
 * Persists to admin Supabase `planner_handoffs` (service role).
 */

import type { NextRequest } from "next/server";
import { withAuth, type AuthContext } from "@/features/shared/api/withAuth";
import { success, validationError, error } from "@/features/shared/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";
import { plannerHandoffRequestSchema } from "@/lib/Planner/handoff/handoffSchema";
import { createPlannerHandoff } from "@/lib/Planner/handoff/createPlannerHandoff";

export const POST = withAuth(
  async (req, auth: AuthContext) => {
    const body = await (req as NextRequest).json().catch(() => null);
    const parsed = plannerHandoffRequestSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }
    const result = await createPlannerHandoff(parsed.data, {
      createdBy: auth.user?.id ?? null,
    });
    if (!result.ok) {
      const status = result.kind === "not_configured" ? 503 : 500;
      const code =
        result.kind === "not_configured"
          ? API_ERROR_CODES.SERVICE_UNAVAILABLE
          : API_ERROR_CODES.DATABASE_ERROR;
      return error(new ApiError(status, code, result.message));
    }
    return success({
      referenceId: result.referenceId,
      createdAt: result.createdAt,
      idempotentReplay: result.idempotentReplay,
      message: result.message,
    });
  },
  {
    role: "guest",
    rateLimitScope: "planner-handoff:post",
    rateLimit: 20,
    requireCsrf: true,
  },
);
