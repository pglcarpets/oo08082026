import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  enforceAdminRateLimit,
  requireAdminSession,
} from "@/app/api/admin/_lib/server";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { CSRF_REJECTION_HEADER_NAME } from "@/lib/security/csrfConstants";
import {
  deletePlannerDocument,
  isPlannerDatabaseConfigured,
  getPlannerProjectsSource,
  listPlannerDocumentsAdmin,
  patchPlannerDocumentAdmin,
  planRowToAdminSummary,
} from "@planner/lib/projectsStore";
import {
  applyPlannerRouteTelemetry,
  jsonWithPlannerRouteTelemetry,
} from "@/features/shared/api/routeObservability";

function parseInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(req: NextRequest) {
  const startedAt = performance.now();
  const routeName = "api/admin/plans";
  const queryShape = "admin-summary-list";
  const telemetry = () => ({
    route: routeName,
    queryShape,
    durationMs: performance.now() - startedAt,
  });
  const rateError = await enforceAdminRateLimit(req, "plans:get");
  if (rateError) {
    return applyPlannerRouteTelemetry(rateError, { ...telemetry(), rowCount: 0 });
  }

  const authError = await requireAdminSession();
  if (authError) {
    return applyPlannerRouteTelemetry(authError, { ...telemetry(), rowCount: 0 });
  }

  if (!isPlannerDatabaseConfigured()) {
    return jsonWithPlannerRouteTelemetry(
      {
        plans: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        source: "unconfigured",
      },
      { ...telemetry(), rowCount: 0, source: "unconfigured" },
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parseInteger(searchParams.get("page"), 1);
  const limit = parseInteger(searchParams.get("limit"), 20);
  const status = searchParams.get("status")?.trim();
  const search = searchParams.get("search")?.trim();
  const sortBy = searchParams.get("sortBy")?.trim() || "created_at";
  const sortOrder = searchParams.get("sortOrder")?.trim() === "asc" ? "asc" : "desc";

  const result = await listPlannerDocumentsAdmin({
    page,
    limit,
    status,
    search,
    sortBy,
    sortOrder,
  });

  const source = getPlannerProjectsSource();

  if (!result.success) {
    return applyPlannerRouteTelemetry(
      NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 }),
      { ...telemetry(), rowCount: 0, source },
    );
  }

  const plans = result.plans.map((plan) => ({
    ...plan,
    review_status: plan.status === "active" ? "approved" : "pending",
  }));

  return jsonWithPlannerRouteTelemetry(
    {
      plans,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
      source,
    },
    { ...telemetry(), rowCount: plans.length, source },
  );
}

export async function PATCH(req: NextRequest) {
  const startedAt = performance.now();
  const routeName = "api/admin/plans";
  const queryShape = "admin-summary-write";
  const telemetry = () => ({
    route: routeName,
    queryShape,
    durationMs: performance.now() - startedAt,
  });
  const rateError = await enforceAdminRateLimit(req, "plans:patch", 20);
  if (rateError) {
    return applyPlannerRouteTelemetry(rateError, { ...telemetry(), rowCount: 0 });
  }

  const authError = await requireAdminSession();
  if (authError) {
    return applyPlannerRouteTelemetry(authError, { ...telemetry(), rowCount: 0 });
  }

  const isCsrfValid = await validateCsrfRequest(req);
  if (!isCsrfValid) {
    return applyPlannerRouteTelemetry(
      NextResponse.json(
        { error: "Invalid or missing CSRF token" },
        { status: 403, headers: { [CSRF_REJECTION_HEADER_NAME]: "1" } },
      ),
      { ...telemetry(), rowCount: 0 },
    );
  }

  if (!isPlannerDatabaseConfigured()) {
    return applyPlannerRouteTelemetry(
      NextResponse.json({ error: "Admin storage is not configured" }, { status: 503 }),
      { ...telemetry(), rowCount: 0, source: "unconfigured" },
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return applyPlannerRouteTelemetry(
      NextResponse.json({ error: "Plan ID is required" }, { status: 400 }),
      { ...telemetry(), rowCount: 0 },
    );
  }

  const patch: {
    status?: "draft" | "active" | "archived";
    title?: string;
    projectName?: string | null;
    clientName?: string | null;
    preparedBy?: string | null;
  } = {};

  if (typeof body.status === "string") {
    const status = body.status.trim();
    if (!["draft", "active", "archived"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = status as "draft" | "active" | "archived";
  }
  if (typeof body.title === "string") {patch.title = body.title.trim();}
  if (typeof body.project_name === "string" || body.project_name === null) {
    patch.projectName = body.project_name as string | null;
  }
  if (typeof body.client_name === "string" || body.client_name === null) {
    patch.clientName = body.client_name as string | null;
  }
  if (typeof body.prepared_by === "string" || body.prepared_by === null) {
    patch.preparedBy = body.prepared_by as string | null;
  }

  if (Object.keys(patch).length === 0) {
    return applyPlannerRouteTelemetry(
      NextResponse.json({ error: "No valid fields to update" }, { status: 400 }),
      { ...telemetry(), rowCount: 0 },
    );
  }

  const result = await patchPlannerDocumentAdmin(id, patch);
  if (!result.success) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 500;
    return applyPlannerRouteTelemetry(
      NextResponse.json({ error: "Failed to update plan" }, { status }),
      { ...telemetry(), rowCount: 0, source: "disk_planner_projects" },
    );
  }

  return jsonWithPlannerRouteTelemetry(
    {
      plan: planRowToAdminSummary(result.row),
      source: "disk_planner_projects",
    },
    { ...telemetry(), rowCount: 1, source: "disk_planner_projects" },
  );
}

export async function DELETE(req: NextRequest) {
  const startedAt = performance.now();
  const routeName = "api/admin/plans";
  const queryShape = "admin-summary-delete";
  const telemetry = () => ({
    route: routeName,
    queryShape,
    durationMs: performance.now() - startedAt,
  });
  const rateError = await enforceAdminRateLimit(req, "plans:delete", 15);
  if (rateError) {
    return applyPlannerRouteTelemetry(rateError, { ...telemetry(), rowCount: 0 });
  }

  const authError = await requireAdminSession();
  if (authError) {
    return applyPlannerRouteTelemetry(authError, { ...telemetry(), rowCount: 0 });
  }

  const isCsrfValid = await validateCsrfRequest(req);
  if (!isCsrfValid) {
    return applyPlannerRouteTelemetry(
      NextResponse.json(
        { error: "Invalid or missing CSRF token" },
        { status: 403, headers: { [CSRF_REJECTION_HEADER_NAME]: "1" } },
      ),
      { ...telemetry(), rowCount: 0 },
    );
  }

  if (!isPlannerDatabaseConfigured()) {
    return applyPlannerRouteTelemetry(
      NextResponse.json({ error: "Admin storage is not configured" }, { status: 503 }),
      { ...telemetry(), rowCount: 0, source: "unconfigured" },
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return applyPlannerRouteTelemetry(
      NextResponse.json({ error: "Plan ID is required" }, { status: 400 }),
      { ...telemetry(), rowCount: 0 },
    );
  }

  const result = await deletePlannerDocument(id);
  if (!result.success) {
    return applyPlannerRouteTelemetry(
      NextResponse.json({ error: "Failed to delete plan" }, { status: 500 }),
      { ...telemetry(), rowCount: 0, source: "disk_planner_projects" },
    );
  }

  return jsonWithPlannerRouteTelemetry(
    { success: true, source: "disk_planner_projects" },
    { ...telemetry(), rowCount: 1, source: "disk_planner_projects" },
  );
}
