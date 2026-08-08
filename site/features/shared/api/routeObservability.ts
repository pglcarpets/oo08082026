import { NextResponse } from "next/server";

export type PlannerRouteTelemetry = {
  route: string;
  queryShape: string;
  durationMs: number;
  rowCount?: number;
  source?: string;
};

export function applyPlannerRouteTelemetry<T extends NextResponse>(
  response: T,
  telemetry: PlannerRouteTelemetry,
): T {
  response.headers.set(
    "Server-Timing",
    `planner;desc="${telemetry.route}";dur=${telemetry.durationMs.toFixed(1)}`,
  );
  response.headers.set("X-Planner-Route", telemetry.route);
  response.headers.set("X-Planner-Query-Shape", telemetry.queryShape);
  response.headers.set("X-Planner-Query-Duration-Ms", telemetry.durationMs.toFixed(1));
  if (telemetry.rowCount !== undefined) {
    response.headers.set("X-Planner-Row-Count", String(telemetry.rowCount));
  }
  if (telemetry.source) {
    response.headers.set("X-Planner-Source", telemetry.source);
  }
  return response;
}

export function jsonWithPlannerRouteTelemetry<T>(
  body: T,
  telemetry: PlannerRouteTelemetry,
  init?: ResponseInit,
): NextResponse {
  const response = NextResponse.json(body, init);
  return applyPlannerRouteTelemetry(response, telemetry);
}
