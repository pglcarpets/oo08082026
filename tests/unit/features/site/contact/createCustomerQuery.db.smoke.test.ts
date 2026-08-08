/**
 * @vitest-environment node
 *
 * Phase 08 — live Admin insert for customer_queries (service role).
 * Skips when admin env is missing.
 */
import { describe, it, expect, afterAll } from "vitest";
import { createCustomerQuery } from "@/features/site/contact/createCustomerQuery";
import { createSupabaseAuthAdminClient } from "@/platform/supabase/auth-admin";

const hasAdmin =
  Boolean(process.env.NEXT_ADMIN_SUPABASE_URL?.trim()) &&
  Boolean(process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim());

describe.runIf(hasAdmin)("createCustomerQuery → customer_queries (live)", () => {
  let queryId: string | null = null;

  afterAll(async () => {
    if (!queryId) return;
    const admin = createSupabaseAuthAdminClient();
    await admin.from("customer_queries").delete().eq("id", queryId);
  });

  it("inserts a row through the shared create path", async () => {
    const result = await createCustomerQuery(
      {
        name: "Cutover smoke",
        message: `Phase 08 live smoke ${new Date().toISOString()}`,
        email: "cutover-smoke@example.com",
        source: "asset-cutover-smoke",
      },
      { ip: "127.0.0.1", rateLimitAlreadyApplied: true },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.honeypot).toBe(false);
    expect(typeof result.queryId).toBe("string");
    expect(result.queryId.length).toBeGreaterThan(4);

    queryId = result.queryId;

    const admin = createSupabaseAuthAdminClient();
    const { data, error } = await admin
      .from("customer_queries")
      .select("id, name, source")
      .eq("id", queryId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.name).toBe("Cutover smoke");
    expect(data?.source).toBe("asset-cutover-smoke");
  }, 30_000);
});
