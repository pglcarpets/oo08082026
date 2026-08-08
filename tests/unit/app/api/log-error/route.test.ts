import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/log-error/route";

describe("app/api/log-error/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs client error payload and returns success", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const req = new NextRequest("http://localhost/api/log-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Render failed",
        stack: "Error: Render failed\n  at App",
        url: "/dashboard",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.logged).toBe(true);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("returns 400 for invalid JSON body", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const req = new NextRequest("http://localhost/api/log-error", {
      method: "POST",
      body: "not-json",
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid payload or logging failed");
    spy.mockRestore();
  });
});
