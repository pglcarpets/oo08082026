import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  enforceAdminRateLimit,
  requireAdminSession,
} from "@/app/api/admin/_lib/server";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { CSRF_REJECTION_HEADER_NAME } from "@/lib/security/csrfConstants";
import {
  isPlannerDatabaseConfigured,
  loadPlannerDocumentAdmin,
  patchPlannerDocumentAdmin,
  planRowToAdminDetail,
} from "@planner/lib/projectsStore";
import {
  applyPlannerRouteTelemetry,
  jsonWithPlannerRouteTelemetry,
} from "@/features/shared/api/routeObservability";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  const startedAt = performance.now();
  const routeName = "api/admin/plans/[id]";
  const queryShape = "admin-detail-load";
  const telemetry = () => ({
    route: routeName,
    queryShape,
    durationMs: performance.now() - startedAt,
  });
  const rateError = await enforceAdminRateLimit(req, "plans:detail:get");
  if (rateError) {
    return applyPlannerRouteTelemetry(rateError, { ...telemetry(), rowCount: 0 });
  }

  const authError = await requireAdminSession();
  if (authError) {
    return applyPlannerRouteTelemetry(authError, { ...telemetry(), rowCount: 0 });
  }

  const { id } = await context.params;
  const planId = id?.trim();
  if (!planId) {
    return applyPlannerRouteTelemetry(
      NextResponse.json({ error: "Plan ID is required" }, { status: 400 }),
      { ...telemetry(), rowCount: 0 },
    );
  }

  if (!isPlannerDatabaseConfigured()) {
    return applyPlannerRouteTelemetry(
      NextResponse.json({ error: "Admin storage is not configured" }, { status: 503 }),
      { ...telemetry(), rowCount: 0, source: "unconfigured" },
    );
  }

  const loaded = await loadPlannerDocumentAdmin(planId);
  if (!loaded.success) {
    const status = loaded.error.code === "NOT_FOUND" ? 404 : 500;
    return applyPlannerRouteTelemetry(
      NextResponse.json({ error: "Plan not found" }, { status }),
      { ...telemetry(), rowCount: 0, source: "disk_planner_projects" },
    );
  }

  return jsonWithPlannerRouteTelemetry(
    { plan: await planRowToAdminDetail(loaded.row) },
    { ...telemetry(), rowCount: 1, source: "disk_planner_projects" },
  );
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const startedAt = performance.now();
  const routeName = "api/admin/plans/[id]";
  const queryShape = "admin-detail-save";
  const telemetry = () => ({
    route: routeName,
    queryShape,
    durationMs: performance.now() - startedAt,
  });
  const rateError = await enforceAdminRateLimit(req, "plans:detail:patch", 20);
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

  const { id } = await context.params;
  const planId = id?.trim();
  if (!planId) {
    return applyPlannerRouteTelemetry(
      NextResponse.json({ error: "Plan ID is required" }, { status: 400 }),
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
  const patch: {
    status?: "draft" | "active" | "archived";
  } = {};

  if (typeof body.status === "string") {
    const status = body.status.trim();
    if (!["draft", "active", "archived"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Expected draft, active, or archived." },
        { status: 400 },
      );
    }
    patch.status = status as "draft" | "active" | "archived";
  }

  if (typeof body.comment === "string" && body.comment.trim()) {
    return applyPlannerRouteTelemetry(
      NextResponse.json(
        { error: "Review comments are not enabled for drizzle plans." },
        { status: 501 },
      ),
      { ...telemetry(), rowCount: 0 },
    );
  }

  if (Object.keys(patch).length === 0) {
    return applyPlannerRouteTelemetry(
      NextResponse.json({ error: "No valid updates provided" }, { status: 400 }),
      { ...telemetry(), rowCount: 0 },
    );
  }

  const result = await patchPlannerDocumentAdmin(planId, patch);
  if (!result.success) {
    const status = result.error.code === "NOT_FOUND" ? 404 : 500;
    return applyPlannerRouteTelemetry(
      NextResponse.json({ error: "Failed to update plan" }, { status }),
      { ...telemetry(), rowCount: 0, source: "disk_planner_projects" },
    );
  }

  return jsonWithPlannerRouteTelemetry(
    { plan: await planRowToAdminDetail(result.row) },
    { ...telemetry(), rowCount: 1, source: "disk_planner_projects" },
  );
}
