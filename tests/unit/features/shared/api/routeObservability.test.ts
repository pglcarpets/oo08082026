/**
 * Name-mirror: features/shared/api/routeObservability
 */

import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import {
  applyPlannerRouteTelemetry,
  jsonWithPlannerRouteTelemetry,
} from "@/features/shared/api/routeObservability";

describe("applyPlannerRouteTelemetry", () => {
  it("sets Server-Timing and planner headers on an existing response", () => {
    const response = NextResponse.json({ ok: true });
    const out = applyPlannerRouteTelemetry(response, {
      route: "plans:list",
      queryShape: "select-all",
      durationMs: 12.34,
      rowCount: 5,
      source: "db",
    });

    expect(out).toBe(response);
    expect(out.headers.get("Server-Timing")).toBe(
      'planner;desc="plans:list";dur=12.3',
    );
    expect(out.headers.get("X-Planner-Route")).toBe("plans:list");
    expect(out.headers.get("X-Planner-Query-Shape")).toBe("select-all");
    expect(out.headers.get("X-Planner-Query-Duration-Ms")).toBe("12.3");
    expect(out.headers.get("X-Planner-Row-Count")).toBe("5");
    expect(out.headers.get("X-Planner-Source")).toBe("db");
  });

  it("omits optional rowCount and source headers when not provided", () => {
    const response = NextResponse.json({});
    applyPlannerRouteTelemetry(response, {
      route: "plans:get",
      queryShape: "by-id",
      durationMs: 1,
    });
    expect(response.headers.get("X-Planner-Row-Count")).toBeNull();
    expect(response.headers.get("X-Planner-Source")).toBeNull();
  });
});

describe("jsonWithPlannerRouteTelemetry", () => {
  it("builds a JSON response with telemetry headers", async () => {
    const response = jsonWithPlannerRouteTelemetry(
      { items: [] },
      {
        route: "catalog",
        queryShape: "released",
        durationMs: 2.5,
      },
      { status: 200 },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: [] });
    expect(response.headers.get("X-Planner-Route")).toBe("catalog");
    expect(response.headers.get("X-Planner-Query-Duration-Ms")).toBe("2.5");
  });
});
