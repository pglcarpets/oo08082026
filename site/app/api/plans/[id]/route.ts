import {
  assertPlannerDocument,
  type PlannerDocument,
} from "@planner/lib/plannerDocument";
import {
  deletePlannerDocumentFromStore,
  loadPlannerDocumentFromStore,
  savePlannerDocumentToStore,
} from "@planner/lib/projectsStore";
import { withAuth } from "@/features/shared/api/withAuth";
import { applyPlannerRouteTelemetry } from "@/features/shared/api/routeObservability";
import { success, error } from "@/features/shared/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withAuth<RouteContext>(
  async (req, auth, context) => {
    const startedAt = performance.now();
    const routeName = "api/plans/[id]";
    const queryShape = "user-detail-load";
    const telemetry = () => ({
      route: routeName,
      queryShape,
      durationMs: performance.now() - startedAt,
    });

    const { id } = await context.params;
    const planId = id?.trim();
    if (!planId) {
      return applyPlannerRouteTelemetry(
        error(ApiError.fromCode(API_ERROR_CODES.MISSING_REQUIRED_FIELD, "Plan id is required")),
        { ...telemetry(), rowCount: 0 },
      );
    }

    const userId = auth.user?.id ?? null;
    if (!userId) {
      return applyPlannerRouteTelemetry(
        error(ApiError.fromCode(API_ERROR_CODES.AUTH_REQUIRED, "Authentication required")),
        { ...telemetry(), rowCount: 0 },
      );
    }

    try {
      const allowAdmin = auth.isAdmin;
      const document = await loadPlannerDocumentFromStore(
        planId,
        allowAdmin ? undefined : userId,
      );
      if (!document) {
        return applyPlannerRouteTelemetry(
          error(ApiError.fromCode(API_ERROR_CODES.RESOURCE_NOT_FOUND, "Plan not found")),
          { ...telemetry(), rowCount: 0 },
        );
      }

      return applyPlannerRouteTelemetry(
        success({ document, source: "disk_planner_projects" }),
        { ...telemetry(), rowCount: 1, source: "disk_planner_projects" },
      );
    } catch (err) {
      return applyPlannerRouteTelemetry(
        error(
          new ApiError(
            500,
            API_ERROR_CODES.INTERNAL_ERROR,
            `Failed to load plan: ${err instanceof Error ? err.message : String(err)}`,
          ),
        ),
        { ...telemetry(), rowCount: 0, source: "disk_planner_projects" },
      );
    }
  },
  {
    role: "member",
    rateLimitScope: "plans:get-one",
    rateLimit: 30,
  },
);

export const PUT = withAuth<RouteContext>(
  async (req, auth, context) => {
    const startedAt = performance.now();
    const routeName = "api/plans/[id]";
    const queryShape = "user-detail-save";
    const telemetry = () => ({
      route: routeName,
      queryShape,
      durationMs: performance.now() - startedAt,
    });

    const { id } = await context.params;
    const planId = id?.trim();
    if (!planId) {
      return applyPlannerRouteTelemetry(
        error(ApiError.fromCode(API_ERROR_CODES.MISSING_REQUIRED_FIELD, "Plan id is required")),
        { ...telemetry(), rowCount: 0 },
      );
    }

    const userId = auth.user?.id ?? null;
    if (!userId) {
      return applyPlannerRouteTelemetry(
        error(ApiError.fromCode(API_ERROR_CODES.AUTH_REQUIRED, "Authentication required")),
        { ...telemetry(), rowCount: 0 },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return applyPlannerRouteTelemetry(
        error(ApiError.fromCode(API_ERROR_CODES.INVALID_INPUT, "Invalid JSON body")),
        { ...telemetry(), rowCount: 0 },
      );
    }
    const documentInput = (body.document ?? body) as unknown;
    let document: PlannerDocument;
    try {
      document = assertPlannerDocument(documentInput);
    } catch {
      return error(
        ApiError.fromCode(API_ERROR_CODES.VALIDATION_ERROR, "Invalid planner document payload"),
      );
    }

    const ownerUserId =
      typeof body.ownerUserId === "string" && body.ownerUserId.trim()
        ? body.ownerUserId.trim()
        : userId;
    if (!auth.isAdmin && ownerUserId !== userId) {
      return error(ApiError.fromCode(API_ERROR_CODES.INSUFFICIENT_PERMISSIONS, "Forbidden"));
    }

    try {
      const saved = await savePlannerDocumentToStore(
        { ...document, id: planId },
        {
          userId: ownerUserId,
          saveId: planId,
        },
      );
      return applyPlannerRouteTelemetry(
        success({ document: saved, source: "disk_planner_projects" }),
        { ...telemetry(), rowCount: 1, source: "disk_planner_projects" },
      );
    } catch (err) {
      const code =
        err instanceof Error && "code" in err && typeof (err as { code?: unknown }).code === "string"
          ? (err as { code: string }).code
          : null;
      // Foreign plan id: no overwrite — surface as not found (do not leak ownership).
      if (code === "FORBIDDEN") {
        return applyPlannerRouteTelemetry(
          error(ApiError.fromCode(API_ERROR_CODES.RESOURCE_NOT_FOUND, "Plan not found")),
          { ...telemetry(), rowCount: 0, source: "disk_planner_projects" },
        );
      }
      return applyPlannerRouteTelemetry(
        error(
          new ApiError(
            500,
            API_ERROR_CODES.INTERNAL_ERROR,
            `Failed to save plan: ${err instanceof Error ? err.message : String(err)}`,
          ),
        ),
        { ...telemetry(), rowCount: 0, source: "disk_planner_projects" },
      );
    }
  },
  {
    role: "member",
    rateLimitScope: "plans:put",
    rateLimit: 20,
    requireCsrf: true,
  },
);

export const DELETE = withAuth<RouteContext>(
  async (req, auth, context) => {
    const startedAt = performance.now();
    const routeName = "api/plans/[id]";
    const queryShape = "user-detail-delete";
    const telemetry = () => ({
      route: routeName,
      queryShape,
      durationMs: performance.now() - startedAt,
    });

    const { id } = await context.params;
    const planId = id?.trim();
    if (!planId) {
      return applyPlannerRouteTelemetry(
        error(ApiError.fromCode(API_ERROR_CODES.MISSING_REQUIRED_FIELD, "Plan id is required")),
        { ...telemetry(), rowCount: 0 },
      );
    }

    const userId = auth.user?.id ?? null;
    if (!userId) {
      return applyPlannerRouteTelemetry(
        error(ApiError.fromCode(API_ERROR_CODES.AUTH_REQUIRED, "Authentication required")),
        { ...telemetry(), rowCount: 0 },
      );
    }

    try {
      // Owner-scoped load + delete — never delete by id alone (IDOR).
      const existing = await loadPlannerDocumentFromStore(planId, userId);
      if (!existing) {
        return error(ApiError.fromCode(API_ERROR_CODES.RESOURCE_NOT_FOUND, "Plan not found"));
      }

      const deleted = await deletePlannerDocumentFromStore(planId, userId);
      return applyPlannerRouteTelemetry(
        success({ success: deleted, source: "disk_planner_projects" }),
        { ...telemetry(), rowCount: deleted ? 1 : 0, source: "disk_planner_projects" },
      );
    } catch (err) {
      return applyPlannerRouteTelemetry(
        error(
          new ApiError(
            500,
            API_ERROR_CODES.INTERNAL_ERROR,
            `Failed to delete plan: ${err instanceof Error ? err.message : String(err)}`,
          ),
        ),
        { ...telemetry(), rowCount: 0, source: "disk_planner_projects" },
      );
    }
  },
  {
    role: "member",
    rateLimitScope: "plans:delete",
    rateLimit: 15,
    requireCsrf: true,
  },
);
