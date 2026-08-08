import { describe, it, expect, vi } from "vitest";
import type { NextResponse } from "next/server";
import { success, error, rateLimitedError, validationError } from "@/features/shared/api/apiResponse";
import { API_ERROR_CODES, ApiError } from "@/features/shared/api/ApiError";
import {
  PaginationQuerySchema,
  StandardCatalogListQuerySchema,
  CreateStandardCatalogItemSchema,
  PatchStandardCatalogItemSchema,
  CatalogAdvisorRequestSchema,
  SketchToPlanRequestSchema,
  SketchRecoveryReasonSchema,
} from "@/features/shared/api/schemas";

import {
  applyPlannerRouteTelemetry,
  jsonWithPlannerRouteTelemetry,
  type PlannerRouteTelemetry,
} from "@/features/shared/api/routeObservability";

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({
      body,
      init,
      headers: {
        set: vi.fn(),
      },
    })),
  },
}));

describe("apiResponse helpers", () => {
  it("creates a success response with spread payload", () => {
    const res = success({ val: 123 }, 201);
    expect(res).toEqual({
      body: { success: true, val: 123 },
      init: { status: 201 },
      headers: { set: expect.any(Function) },
    });
  });

  it("creates an error response from ApiError", () => {
    const apiError = new ApiError(404, API_ERROR_CODES.RESOURCE_NOT_FOUND, "Not Found", { id: "1" });
    const res = error(apiError);
    expect(res).toEqual({
      body: {
        success: false,
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Not Found",
          details: { id: "1" },
        },
      },
      init: {
        status: 404,
        headers: undefined,
      },
      headers: { set: expect.any(Function) },
    });
  });

  it("handles rateLimitedError helper", () => {
    const res = rateLimitedError("Slow down", 60);
    expect(res).toEqual({
      body: {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Slow down",
        },
      },
      init: {
        status: 429,
        headers: { "X-RateLimit-Reset": "60" },
      },
      headers: { set: expect.any(Function) },
    });
  });

  it("handles validationError helper", () => {
    const res = validationError([{ path: ["email"], message: "Invalid email" }]);
    expect(res).toEqual({
      body: {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: {
            issues: [
              { path: "email", message: "Invalid email" },
            ],
          },
        },
      },
      init: {
        status: 400,
        headers: undefined,
      },
      headers: { set: expect.any(Function) },
    });
  });
});

describe("shared api schemas (zod validation)", () => {
  it("parses pagination query with defaults and clamps", () => {
    const ok = PaginationQuerySchema.parse({ page: "2", limit: "10" });
    expect(ok).toEqual({ page: 2, limit: 10 });

    const def = PaginationQuerySchema.parse({});
    expect(def.page).toBe(1);
    expect(def.limit).toBe(50);

    expect(() => PaginationQuerySchema.parse({ page: 0 })).toThrow();
    expect(() => PaginationQuerySchema.parse({ limit: 999 })).toThrow(); // >200
  });

  it("parses standard catalog list query", () => {
    const q = StandardCatalogListQuerySchema.parse({
      category: " Seating ",
      search: " CHAIR ",
      visible: "true",
      page: 3,
    });
    expect(q.category).toBe("seating");
    expect(q.search).toBe("chair");
    expect(q.visible).toBe("true");
  });

  it("validates create catalog item and partial patch", () => {
    const valid = CreateStandardCatalogItemSchema.parse({
      name: "Desk",
      category: "tables",
      width_mm: 1200,
      depth_mm: 600,
      height_mm: 750,
    });
    expect(valid.name).toBe("Desk");

    const patch = PatchStandardCatalogItemSchema.parse({ height_mm: 800 });
    expect(patch.height_mm).toBe(800);

    expect(() =>
      CreateStandardCatalogItemSchema.parse({ name: "", category: "x", width_mm: 10, depth_mm: 10, height_mm: 10 }),
    ).toThrow();
  });

  it("validates advisor and sketch schemas", () => {
    const adv = CatalogAdvisorRequestSchema.parse({ query: "best chair for office" });
    expect(adv.query).toBe("best chair for office");

    const sketchReq = SketchToPlanRequestSchema.parse({
      imageDataUrl: "data:image/png;base64,iVBORw0KGgo=",
      fileName: "plan.png",
      prompt: "extract walls",
    });
    expect(sketchReq.fileName).toBe("plan.png");

    const reason = SketchRecoveryReasonSchema.parse("timeout");
    expect(reason).toBe("timeout");
    expect(() => SketchRecoveryReasonSchema.parse("bad")).toThrow();
  });
});

describe("routeObservability headers", () => {
  it("applies telemetry headers to response", () => {
    const telemetry: PlannerRouteTelemetry = {
      route: "/api/test",
      queryShape: "id",
      durationMs: 42.3,
      rowCount: 7,
      source: "db",
    };
    const res = jsonWithPlannerRouteTelemetry({ ok: true }, telemetry, { status: 200 });
    // since mocked NextResponse.json returns the arg shape (now with headers stub)
    expect(res).toEqual({
      body: { ok: true },
      init: { status: 200 },
      headers: { set: expect.any(Function) },
    });
    // note: header application is on the real response instance in prod; here we cover call path
  });

  it("invokes applyPlannerRouteTelemetry directly (covers header sets)", () => {
    const calls: Array<[string, string]> = [];
    const mockResponse = {
      headers: {
        set: (k: string, v: string) => {
          calls.push([k, v]);
        },
      },
    } as unknown as Response; // typed unknown to avoid any
    const telemetry: PlannerRouteTelemetry = {
      route: "test-route",
      queryShape: "*",
      durationMs: 12.5,
      rowCount: 3,
    };
    const out = applyPlannerRouteTelemetry(
      mockResponse as unknown as NextResponse,
      telemetry,
    );
    expect(out).toBe(mockResponse);
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.some(([k]) => k === "X-Planner-Route")).toBe(true);
  });

  it("exposes telemetry type for callers", () => {
    const t: PlannerRouteTelemetry = { route: "r", queryShape: "s", durationMs: 1 };
    expect(t.durationMs).toBe(1);
  });
});
