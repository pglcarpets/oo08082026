// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { checkDatabaseConnection } from "@/scripts/db_test_connection";

function makeSqlSequence(responses: unknown[]) {
  const end = vi.fn(async () => undefined);
  let call = 0;
  const sql = Object.assign(
    async () => {
      const next = responses[call] ?? [];
      call += 1;
      return next;
    },
    { end },
  );
  return { sql, end };
}

describe("db_test_connection (name-mirror)", () => {
  it("fails when products URL is missing", async () => {
    const result = await checkDatabaseConnection({
      resolveProductsUrl: () => null,
      resolvePlannerUrl: () => "postgres://planner",
      error: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Products");
  });

  it("fails when planner URL is missing", async () => {
    const productsResponses = [
      [{ connected: 1 }],
      [
        { table_name: "block_descriptors" },
        { table_name: "catalog_categories" },
        { table_name: "catalog_products" },
        { table_name: "configurator_products" },
        { table_name: "planner_managed_products" },
        { table_name: "svg_revision_artifacts" },
        { table_name: "svg_revisions" },
      ],
      [{ n: 1 }],
      [{ b: 0 }],
    ];
    const { sql } = makeSqlSequence(productsResponses);
    const result = await checkDatabaseConnection({
      resolveProductsUrl: () => "postgres://products",
      resolvePlannerUrl: () => null,
      sqlFactory: (() => sql) as never,
      error: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Planner/Auth");
  });

  it("succeeds on mocked dual-DB ping + table presence", async () => {
    const productsResponses = [
      [{ connected: 1 }],
      [
        { table_name: "block_descriptors" },
        { table_name: "catalog_categories" },
        { table_name: "catalog_products" },
        { table_name: "configurator_products" },
        { table_name: "planner_managed_products" },
        { table_name: "svg_revision_artifacts" },
        { table_name: "svg_revisions" },
      ],
      [{ n: 10 }],
      [{ b: 2 }],
    ];
    const plannerResponses = [
      [{ connected: 1 }],
      [{ table_name: "audit_events" }, { table_name: "oando_plans" }],
      [{ n: 3 }],
    ];
    let productsCall = 0;
    let plannerCall = 0;
    const end = vi.fn(async () => undefined);
    const sqlFactory = ((url: string) => {
      const isProducts = url.includes("products");
      return Object.assign(
        async () => {
          if (isProducts) {
            const next = productsResponses[productsCall] ?? [];
            productsCall += 1;
            return next;
          }
          const next = plannerResponses[plannerCall] ?? [];
          plannerCall += 1;
          return next;
        },
        { end },
      );
    }) as never;

    const log = vi.fn();
    const result = await checkDatabaseConnection({
      resolveProductsUrl: () => "postgres://products",
      resolvePlannerUrl: () => "postgres://planner",
      sqlFactory,
      env: {
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        NEXT_ADMIN_SUPABASE_URL: "https://admin.example",
        SUPABASE_ADMIN_SERVICE_ROLE_KEY: "key",
      },
      log,
      error: vi.fn(),
      warn: vi.fn(),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.supabaseHttp).toBe(true);
      expect(result.products.tables).toContain("svg_revisions");
      expect(result.planner.tables).toContain("oando_plans");
    }
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("Supabase HTTP env vars present"),
    );
    expect(end).toHaveBeenCalled();
  });

  it("fails when expected products tables are missing", async () => {
    const productsResponses = [[{ connected: 1 }], []];
    const { sql, end } = makeSqlSequence(productsResponses);
    const result = await checkDatabaseConnection({
      resolveProductsUrl: () => "postgres://products",
      resolvePlannerUrl: () => "postgres://planner",
      sqlFactory: (() => sql) as never,
      env: {},
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Products missing tables");
    expect(end).toHaveBeenCalled();
  });
});
