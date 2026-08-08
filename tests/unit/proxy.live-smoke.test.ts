/**
 * 04c proxy verify — header/auth/maintenance contracts (no browser).
 * Complements proxy.test.ts with explicit exit-checklist assertions.
 */
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => {
  class StubHeaders {
    private map = new Map<string, string>();
    set(k: string, v: string) {
      this.map.set(k.toLowerCase(), v);
    }
    get(k: string) {
      return this.map.get(k.toLowerCase()) || null;
    }
    has(k: string) {
      return this.map.has(k.toLowerCase());
    }
  }
  const mockNextResponse = {
    next: vi.fn(() => ({ status: 200, headers: new StubHeaders() })),
    redirect: vi.fn((url: string | URL) => {
      const h = new StubHeaders();
      h.set("location", url.toString());
      return { status: 307, headers: h };
    }),
    json: vi.fn((data: unknown, options?: { status?: number }) => ({
      status: options?.status || 200,
      headers: new StubHeaders(),
      body: data,
    })),
  };
  return {
    NextRequest: class NextRequest {
      nextUrl: { pathname: string; search: string; clone: () => URL };
      method: string;
      headers: StubHeaders;
      cookies: {
        has: (n: string) => boolean;
        getAll: () => { name: string; value: string }[];
        set: (n: string, v: string) => void;
      };
      constructor(
        url: string,
        init?: { method?: string; headers?: Record<string, string> },
      ) {
        const parsed = new URL(url);
        this.nextUrl = {
          pathname: parsed.pathname,
          search: parsed.search,
          clone: () => new URL(url),
        };
        this.method = init?.method || "GET";
        this.headers = new StubHeaders();
        if (init?.headers) {
          Object.entries(init.headers).forEach(([k, v]) => this.headers.set(k, v));
        }
        const cookiesMap = new Map<string, string>();
        this.cookies = {
          has: (name: string) => cookiesMap.has(name),
          getAll: () =>
            Array.from(cookiesMap.entries()).map(([n, v]) => ({ name: n, value: v })),
          set: (name: string, value: string) => cookiesMap.set(name, value),
        };
      }
    },
    NextResponse: mockNextResponse,
  };
});

vi.mock("../../site/lib/platform/maintenanceMode", () => ({
  isMaintenanceReadonly: vi.fn(() => false),
}));

import {
  proxy,
  buildContentSecurityPolicy,
  isCanvasHeavyPath,
} from "../../site/proxy";
import { NextRequest } from "next/server";
import { isMaintenanceReadonly } from "../../site/lib/platform/maintenanceMode";

describe("04c proxy verify checklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isMaintenanceReadonly).mockReturnValue(false);
  });

  it("CSP present on canvas-heavy /ooplanner path", async () => {
    expect(isCanvasHeavyPath("/ooplanner")).toBe(true);
    const csp = buildContentSecurityPolicy("/ooplanner");
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/script-src/);

    const req = new NextRequest("http://localhost/ooplanner/");
    const res = await proxy(req as unknown as NextRequest);
    expect(res.headers.get("Content-Security-Policy")).toBeTruthy();
    expect(res.headers.get("Content-Security-Policy")).toContain("default-src");
  });

  it("protected /admin without auth redirects to access", async () => {
    const req = new NextRequest("http://localhost/admin/");
    const res = await proxy(req as unknown as NextRequest);
    expect([307, 308]).toContain(res.status);
    expect(res.headers.get("location")).toMatch(/\/access/);
  });

  it("maintenance mode blocks Planner API writes with 503", async () => {
    vi.mocked(isMaintenanceReadonly).mockReturnValue(true);
    const req = new NextRequest("http://localhost/api/Planner/projects/", {
      method: "POST",
    });
    const res = await proxy(req as unknown as NextRequest);
    expect(res.status).toBe(503);
  });
});
