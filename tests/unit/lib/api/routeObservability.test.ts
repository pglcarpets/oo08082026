import { describe, it, expect, vi } from "vitest";
import type { NextResponse } from "next/server";
import { applyPlannerRouteTelemetry, jsonWithPlannerRouteTelemetry } from "@/features/shared/api/routeObservability";

vi.mock("next/server", () => {
  class MockHeaders {
    private store = new Map<string, string>();
    set(key: string, value: string) {
      this.store.set(key, value);
    }
    get(key: string) {
      return this.store.get(key);
    }
  }

  return {
    NextResponse: {
      json: vi.fn((body, init) => {
        return {
          body,
          init,
          headers: new MockHeaders(),
        };
      }),
    },
  };
});

describe("routeObservability", () => {
  it("applies telemetry headers correctly", () => {
    const mockHeaders = {
      store: new Map<string, string>(),
      set(key: string, val: string) {
        this.store.set(key, val);
      },
    };
    const mockResponse = {
      headers: mockHeaders,
    };

    applyPlannerRouteTelemetry(mockResponse as unknown as NextResponse, {
      route: "plans/list",
      queryShape: "list",
      durationMs: 42.5,
      rowCount: 5,
      source: "supabase",
    });

    expect(mockHeaders.store.get("X-Planner-Route")).toBe("plans/list");
    expect(mockHeaders.store.get("X-Planner-Query-Shape")).toBe("list");
    expect(mockHeaders.store.get("X-Planner-Query-Duration-Ms")).toBe("42.5");
    expect(mockHeaders.store.get("X-Planner-Row-Count")).toBe("5");
    expect(mockHeaders.store.get("X-Planner-Source")).toBe("supabase");
  });

  it("creates json with telemetry", () => {
    const res = jsonWithPlannerRouteTelemetry({ ok: true }, {
      route: "plans/list",
      queryShape: "list",
      durationMs: 42.5,
    });

    expect((res as unknown as { body: unknown; headers: { get(k: string): string | null } }).body).toEqual({ ok: true });
    expect((res as unknown as { body: unknown; headers: { get(k: string): string | null } }).headers.get("X-Planner-Route")).toBe("plans/list");
  });
});
