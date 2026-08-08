import {
  buildPlannerDocumentFromPortalPublishData,
  listPlannerDocumentsFromStore,
  savePlannerDocumentToStore,
  type PlannerPortalPublishData,
} from "@planner/lib/projectsStore";
import { withAuth } from "@/features/shared/api/withAuth";
import { applyPlannerRouteTelemetry } from "@/features/shared/api/routeObservability";
import { success, error } from "@/features/shared/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";

type PublishBody = {
  id?: string;
  projectName?: string;
  data?: Record<string, unknown>;
  status?: string;
};

export const GET = withAuth(
  async (req, auth) => {
    const startedAt = performance.now();
    const routeName = "api/plans";
    const queryShape = "user-summary-list";
    const telemetry = () => ({
      route: routeName,
      queryShape,
      durationMs: performance.now() - startedAt,
    });

    const userId = auth.user?.id ?? null;
    if (!userId) {
      return applyPlannerRouteTelemetry(
        error(ApiError.fromCode(API_ERROR_CODES.AUTH_REQUIRED, "Authentication required")),
        { ...telemetry(), rowCount: 0 },
      );
    }

    try {
      const documents = await listPlannerDocumentsFromStore({ userId });
      return applyPlannerRouteTelemetry(
        success({ documents }),
        { ...telemetry(), rowCount: documents.length, source: "disk_planner_projects" },
      );
    } catch (err) {
      return applyPlannerRouteTelemetry(
        error(
          new ApiError(
            500,
            API_ERROR_CODES.INTERNAL_ERROR,
            `Failed to list plans: ${err instanceof Error ? err.message : String(err)}`,
          ),
        ),
        { ...telemetry(), rowCount: 0, source: "disk_planner_projects" },
      );
    }
  },
  {
    role: "member",
    rateLimitScope: "plans:get",
    rateLimit: 20,
  },
);

export const POST = withAuth(
  async (req, auth) => {
    const startedAt = performance.now();
    const routeName = "api/plans";
    const queryShape = "user-publish-write";
    const telemetry = () => ({
      route: routeName,
      queryShape,
      durationMs: performance.now() - startedAt,
    });

    let body: PublishBody;
    try {
      body = (await req.json()) as PublishBody;
    } catch {
      return applyPlannerRouteTelemetry(
        error(
          ApiError.fromCode(API_ERROR_CODES.INVALID_INPUT, "Invalid JSON body"),
        ),
        { ...telemetry(), rowCount: 0 },
      );
    }
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const projectName = typeof body.projectName === "string" ? body.projectName.trim() : "";
    const data = body.data;

    if (!id) {
      return applyPlannerRouteTelemetry(
        error(ApiError.fromCode(API_ERROR_CODES.MISSING_REQUIRED_FIELD, "Plan id is required")),
        { ...telemetry(), rowCount: 0 },
      );
    }
    if (!projectName) {
      return applyPlannerRouteTelemetry(
        error(ApiError.fromCode(API_ERROR_CODES.MISSING_REQUIRED_FIELD, "Project name is required")),
        { ...telemetry(), rowCount: 0 },
      );
    }
    if (!data || typeof data !== "object") {
      return applyPlannerRouteTelemetry(
        error(ApiError.fromCode(API_ERROR_CODES.MISSING_REQUIRED_FIELD, "Plan data is required")),
        { ...telemetry(), rowCount: 0 },
      );
    }
    const status: "draft" | "active" = body.status === "draft" ? "draft" : "active";

    const userId = auth.user?.id ?? null;
    if (!userId) {
      return applyPlannerRouteTelemetry(
        error(
          ApiError.fromCode(
            API_ERROR_CODES.AUTH_REQUIRED,
            "Authentication required to publish to portal",
          ),
        ),
        { ...telemetry(), rowCount: 0 },
      );
    }

    const publishData = {
      projectName,
      walls: Array.isArray(data.walls) ? data.walls : [],
      rooms: Array.isArray(data.rooms) ? data.rooms : [],
      furniture: Array.isArray(data.furniture) ? data.furniture : [],
      doors: Array.isArray(data.doors) ? data.doors : [],
      windows: Array.isArray(data.windows) ? data.windows : [],
      measurements: Array.isArray(data.measurements) ? data.measurements : [],
      zones: Array.isArray(data.zones) ? data.zones : [],
      textLabels: Array.isArray(data.textLabels) ? data.textLabels : [],
      structuralElements: Array.isArray(data.structuralElements)
        ? data.structuralElements
        : [],
      backgroundImage: data.backgroundImage ?? null,
    } satisfies PlannerPortalPublishData;

    const document = buildPlannerDocumentFromPortalPublishData(publishData, { status });

    try {
      await savePlannerDocumentToStore(document, {
        userId,
        saveId: id,
      });
    } catch (err) {
      return applyPlannerRouteTelemetry(
        error(
          new ApiError(
            500,
            API_ERROR_CODES.INTERNAL_ERROR,
            `Failed to publish plan: ${
              err instanceof Error ? err.message : String(err)
            }`,
          ),
        ),
        { ...telemetry(), rowCount: 0, source: "disk_planner_projects" },
      );
    }

    return applyPlannerRouteTelemetry(
      success({
        id,
        portalPath: `/portal/${id}`,
      }),
      { ...telemetry(), rowCount: 1, source: "disk_planner_projects" },
    );
  },
  {
    role: "member",
    rateLimitScope: "plans:post",
    rateLimit: 15,
    requireCsrf: true,
  },
);
