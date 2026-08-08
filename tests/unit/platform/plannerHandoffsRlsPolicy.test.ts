/**
 * @vitest-environment node
 *
 * Regression guard for the `planner_handoffs` read policy.
 *
 * `/api/Planner/handoff` is `role: "guest"`, so anonymous submissions persist
 * `created_by = null`. A read policy of the form
 *
 *   using (created_by is null or created_by = auth.uid())
 *
 * therefore matches every unowned row for every authenticated account, exposing
 * the `contact` payload (customer name, email, phone) and the full BOQ. Unowned
 * rows must stay `service_role`-only.
 *
 * The static case is authoritative for CI; the live case runs only when admin DB
 * credentials are present.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const MIGRATIONS_ADMIN_DIR = resolve(process.cwd(), "platform/supabase/migrations.admin");
const POLICY_NAME = "planner_handoffs authenticated read own";

/** Last `create policy "<POLICY_NAME>"` block across migrations in apply order. */
function effectiveReadPolicySql(): string | null {
  const files = readdirSync(MIGRATIONS_ADMIN_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  let latest: string | null = null;
  for (const file of files) {
    const body = readFileSync(resolve(MIGRATIONS_ADMIN_DIR, file), "utf8");
    // Skip the commented-out rollback section — it is not applied.
    const applied = body
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");
    const pattern = new RegExp(
      `create policy\\s+"${POLICY_NAME}"[\\s\\S]*?;`,
      "gi",
    );
    const matches = applied.match(pattern);
    if (matches && matches.length > 0) {
      latest = matches[matches.length - 1];
    }
  }
  return latest;
}

describe("planner_handoffs read policy", () => {
  it("scopes authenticated reads to the row owner, with no null-owner escape", () => {
    const policy = effectiveReadPolicySql();
    expect(policy, `no "${POLICY_NAME}" policy found in migrations.admin`).not.toBeNull();

    const normalized = policy!.toLowerCase().replace(/\s+/g, " ");
    expect(normalized).toContain("created_by = auth.uid()");
    expect(
      normalized,
      "null-owner disjunct exposes every anonymous handoff to any signed-in user",
    ).not.toContain("created_by is null");
  });
});

const liveDbUrl = process.env.SUPABASE_AUTH_DATABASE_URL?.trim() ?? "";

describe.runIf(liveDbUrl)("planner_handoffs read policy (live admin DB)", () => {
  it("matches the migration — owner-scoped qual in the running database", async () => {
    const postgres = (await import("postgres")).default;
    const sql = postgres(liveDbUrl, { prepare: false, ssl: "require", max: 1 });
    try {
      const rows = await sql<Array<{ qual: string | null }>>`
        select pg_get_expr(polqual, polrelid) as qual
        from pg_policy
        where polrelid = 'public.planner_handoffs'::regclass
          and polname = ${POLICY_NAME}
      `;
      expect(rows.length, `policy "${POLICY_NAME}" missing from live DB`).toBe(1);
      const qual = (rows[0]?.qual ?? "").toLowerCase();
      expect(qual).toContain("created_by = auth.uid()");
      expect(qual).not.toContain("is null");
    } finally {
      await sql.end({ timeout: 5 });
    }
  }, 30_000);
});
