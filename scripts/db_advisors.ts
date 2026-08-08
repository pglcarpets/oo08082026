/**
 * Standalone replica of Supabase's `get_advisors` MCP tool.
 *
 * Runs the same lint queries Supabase's hosted advisor uses against the
 * linked Postgres database via PRODUCTS_DATABASE_URL from .env.local.
 *
 * Lint definitions sourced from supabase/splinter (the open-source linter
 * that powers the advisors UI and MCP tool):
 *   https://github.com/supabase/splinter
 *
 * Usage:
 *   npm run db:advisors                    # both categories
 *   npm run db:advisors -- --security
 *   npm run db:advisors -- --performance
 */

import { createRequire } from "node:module";
import postgres from "postgres";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

type Severity = "ERROR" | "WARN" | "INFO";
type Category = "SECURITY" | "PERFORMANCE";

type Lint = {
  name: string;
  title: string;
  level: Severity;
  category: Category;
  description: string;
  detectionSql: string;
  // map row -> short identifier (table/function name) for display
  identify: (row: Record<string, unknown>) => string;
  remediation: string;
};

const lints: Lint[] = [
  // -------- SECURITY --------
  {
    name: "rls_disabled_in_public",
    title: "RLS Disabled in Public Schema",
    level: "ERROR",
    category: "SECURITY",
    description:
      "Table is in the public schema but Row Level Security is disabled. " +
      "Anyone with the anon key can read/write all rows.",
    detectionSql: `
      select c.relname as table_name
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
        and c.relrowsecurity = false
      order by c.relname;
    `,
    identify: (r) => String(r.table_name),
    remediation:
      "ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY; then add policies.",
  },
  {
    name: "policy_exists_rls_disabled",
    title: "Policies Exist but RLS Is Disabled",
    level: "ERROR",
    category: "SECURITY",
    description:
      "Table has RLS policies defined but RLS is not enabled, so the " +
      "policies are inert.",
    detectionSql: `
      select distinct c.relname as table_name
      from pg_policy p
      join pg_class c on c.oid = p.polrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relrowsecurity = false
      order by c.relname;
    `,
    identify: (r) => String(r.table_name),
    remediation: "ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;",
  },
  {
    name: "rls_enabled_no_policy",
    title: "RLS Enabled but No Policies Defined",
    level: "WARN",
    category: "SECURITY",
    description:
      "Table has RLS enabled but no policies, so all reads/writes through " +
      "PostgREST are denied. This is sometimes intentional (admin-only via " +
      "service role) but often unintentional.",
    detectionSql: `
      select c.relname as table_name
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
        and c.relrowsecurity = true
        and not exists (
          select 1 from pg_policy p where p.polrelid = c.oid
        )
      order by c.relname;
    `,
    identify: (r) => String(r.table_name),
    remediation:
      "Add policies, or confirm intent (service-role-only access).",
  },
  {
    name: "function_search_path_mutable",
    title: "Function Has Mutable search_path",
    level: "WARN",
    category: "SECURITY",
    description:
      "Function does not pin search_path. A privileged caller's session " +
      "can be tricked into calling attacker-controlled objects.",
    detectionSql: `
      select n.nspname || '.' || p.proname as function_name
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.prokind = 'f'
        and (p.proconfig is null or not exists (
          select 1 from unnest(p.proconfig) c where c ~ '^search_path[ ]*='
        ))
      order by function_name;
    `,
    identify: (r) => String(r.function_name),
    remediation:
      "ALTER FUNCTION <fn>(...) SET search_path = '';  (or pin to specific schemas)",
  },
  {
    name: "security_definer_view",
    title: "View Defined with SECURITY DEFINER",
    level: "WARN",
    category: "SECURITY",
    description:
      "View runs with definer's privileges, bypassing the caller's RLS. " +
      "Almost always a mistake unless you've audited it.",
    detectionSql: `
      select c.relname as view_name
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind in ('v', 'm')
        and exists (
          select 1
          from unnest(coalesce(c.reloptions, '{}'::text[])) o
          where o ilike 'security_invoker=false'
             or o ilike 'security_definer=true'
        )
      order by c.relname;
    `,
    identify: (r) => String(r.view_name),
    remediation:
      "ALTER VIEW public.<view> SET (security_invoker = on);",
  },

  // -------- PERFORMANCE --------
  {
    name: "unindexed_foreign_keys",
    title: "Foreign Key Without a Covering Index",
    level: "WARN",
    category: "PERFORMANCE",
    description:
      "Foreign key is not covered by an index. Joins, lookups, and " +
      "cascading deletes/updates on the parent will be slow.",
    detectionSql: `
      with fk as (
        select
          c.conrelid                 as relid,
          c.conrelid::regclass::text as table_name,
          c.conname                  as fk_name,
          c.conkey                   as fk_cols
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.contype = 'f' and n.nspname = 'public'
      ),
      idx as (
        select
          i.indrelid       as relid,
          i.indkey::int2[] as idx_cols
        from pg_index i
      )
      select fk.table_name, fk.fk_name
      from fk
      where not exists (
        select 1
        from idx
        where idx.relid = fk.relid
          and idx.idx_cols[1:array_length(fk.fk_cols,1)] = fk.fk_cols
      )
      order by fk.table_name, fk.fk_name;
    `,
    identify: (r) => `${r.table_name} (fk: ${r.fk_name})`,
    remediation:
      "CREATE INDEX ON <table> (<fk columns>);",
  },
  {
    name: "duplicate_index",
    title: "Duplicate Index",
    level: "WARN",
    category: "PERFORMANCE",
    description:
      "Two or more indexes on the same table cover the same columns in the " +
      "same order. Wastes storage and slows writes.",
    detectionSql: `
      select
        n.nspname || '.' || c.relname as table_name,
        array_agg(ic.relname order by ic.relname) as duplicate_indexes
      from pg_index i
      join pg_class c  on c.oid = i.indrelid
      join pg_class ic on ic.oid = i.indexrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and not i.indisprimary
      group by n.nspname, c.relname, i.indkey
      having count(*) > 1
      order by table_name;
    `,
    identify: (r) =>
      `${r.table_name} -> ${(r.duplicate_indexes as string[]).join(", ")}`,
    remediation:
      "DROP INDEX <one of the duplicates>;",
  },
  {
    name: "no_primary_key",
    title: "Table Has No Primary Key",
    level: "INFO",
    category: "PERFORMANCE",
    description:
      "Table has no primary key. Replication, joins, and many ORMs require one.",
    detectionSql: `
      select c.relname as table_name
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
        and not exists (
          select 1 from pg_index i
          where i.indrelid = c.oid and i.indisprimary
        )
      order by c.relname;
    `,
    identify: (r) => String(r.table_name),
    remediation: "ALTER TABLE public.<table> ADD PRIMARY KEY (<column>);",
  },
];

function pickCategory(): Category[] {
  const args = process.argv.slice(2);
  if (args.includes("--security") && !args.includes("--performance"))
    return ["SECURITY"];
  if (args.includes("--performance") && !args.includes("--security"))
    return ["PERFORMANCE"];
  return ["SECURITY", "PERFORMANCE"];
}

const SEVERITY_RANK: Record<Severity, number> = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
};

const COLOR = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
} as const;

function severityBadge(level: Severity): string {
  if (level === "ERROR") return `${COLOR.red}${COLOR.bold}[ERROR]${COLOR.reset}`;
  if (level === "WARN") return `${COLOR.yellow}${COLOR.bold}[WARN] ${COLOR.reset}`;
  return `${COLOR.blue}[INFO] ${COLOR.reset}`;
}

async function main() {
  const dbUrl =
    process.env.PRODUCTS_DATABASE_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim();
  if (!dbUrl) {
    console.error(
      "Missing PRODUCTS_DATABASE_URL (or SUPABASE_DB_URL) in .env.local",
    );
    process.exit(1);
  }

  const categories = pickCategory();
  const sql = postgres(dbUrl, { prepare: false, max: 1 });

  const findings: Array<{
    lint: Lint;
    rows: Record<string, unknown>[];
  }> = [];

  try {
    for (const lint of lints) {
      if (!categories.includes(lint.category)) continue;
      const rows = (await sql.unsafe(lint.detectionSql)) as unknown as Record<
        string,
        unknown
      >[];
      if (rows.length > 0) findings.push({ lint, rows });
    }
  } finally {
    await sql.end({ timeout: 5 });
  }

  // sort by category then severity
  findings.sort((a, b) => {
    if (a.lint.category !== b.lint.category)
      return a.lint.category.localeCompare(b.lint.category);
    return SEVERITY_RANK[a.lint.level] - SEVERITY_RANK[b.lint.level];
  });

  const totals = { ERROR: 0, WARN: 0, INFO: 0 };

  console.log("");
  console.log(
    `${COLOR.bold}Supabase Advisors${COLOR.reset} ${COLOR.dim}(${categories.join(
      " + ",
    )})${COLOR.reset}\n`,
  );

  if (findings.length === 0) {
    console.log(`${COLOR.green}No issues detected. Nice.${COLOR.reset}\n`);
    return;
  }

  let lastCategory: Category | null = null;
  for (const { lint, rows } of findings) {
    if (lint.category !== lastCategory) {
      console.log(
        `\n${COLOR.bold}${COLOR.dim}── ${lint.category} ──${COLOR.reset}\n`,
      );
      lastCategory = lint.category;
    }
    totals[lint.level] += rows.length;
    console.log(
      `${severityBadge(lint.level)} ${COLOR.bold}${lint.title}${COLOR.reset} ${COLOR.dim}(${
        lint.name
      }, ${rows.length} affected)${COLOR.reset}`,
    );
    console.log(`  ${lint.description}`);
    const sample = rows.slice(0, 12);
    for (const r of sample) {
      console.log(`    • ${lint.identify(r)}`);
    }
    if (rows.length > sample.length) {
      console.log(`    ${COLOR.dim}… and ${rows.length - sample.length} more${COLOR.reset}`);
    }
    console.log(`  ${COLOR.dim}fix:${COLOR.reset} ${lint.remediation}\n`);
  }

  console.log(
    `${COLOR.bold}Totals:${COLOR.reset} ${COLOR.red}${totals.ERROR} error${COLOR.reset}, ${COLOR.yellow}${totals.WARN} warn${COLOR.reset}, ${COLOR.blue}${totals.INFO} info${COLOR.reset}\n`,
  );
}

main().catch((err) => {
  console.error("Advisor run failed:", err);
  process.exit(1);
});
