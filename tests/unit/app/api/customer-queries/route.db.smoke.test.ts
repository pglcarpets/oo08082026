/**
 * @vitest-environment node
 *
 * Phase 08 — live POST /api/customer-queries/ (Origin + Admin insert).
 * Skips when admin env is missing.
 */
import { describe, it, expect, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/customer-queries/route";
import { createSupabaseAuthAdminClient } from "@/platform/supabase/auth-admin";

const hasAdmin =
  Boolean(process.env.NEXT_ADMIN_SUPABASE_URL?.trim()) &&
  Boolean(process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim());

describe.runIf(hasAdmin)("POST /api/customer-queries/ (live)", () => {
  let queryId: string | null = null;

  afterAll(async () => {
    if (!queryId) return;
    const admin = createSupabaseAuthAdminClient();
    await admin.from("customer_queries").delete().eq("id", queryId);
  });

  it("accepts a browser-origin POST and persists the row", async () => {
    const req = new NextRequest("http://localhost:3000/api/customer-queries/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Cutover API smoke",
        message: `Phase 08 route smoke ${new Date().toISOString()}`,
        email: "cutover-api-smoke@example.com",
        source: "asset-cutover-route-smoke",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = (await res.json()) as {
      success?: boolean;
      queryId?: string;
    };
    expect(body.success).toBe(true);
    expect(typeof body.queryId).toBe("string");
    queryId = body.queryId ?? null;
  }, 30_000);
});
