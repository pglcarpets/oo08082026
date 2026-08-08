import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("app/api/health/route.ts", () => {
  it("returns ok:true with no-store and no secrets", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({ ok: true });
    expect(Object.keys(body)).toEqual(["ok"]);
  });
});
