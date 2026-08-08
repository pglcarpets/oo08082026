import { createRequire } from "node:module";
import postgres from "postgres";
import {
  resolvePlannerDatabaseUrl,
  resolveProductsDatabaseUrl,
} from "../site/platform/drizzle/databaseUrls";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

const PRODUCTS_EXPECTED = [
  "catalog_products",
  "catalog_categories",
  "planner_managed_products",
  "configurator_products",
  "svg_revisions",
  "svg_revision_artifacts",
] as const;

const PLANNER_EXPECTED = ["oando_plans", "audit_events", "block_descriptors"] as const;

export type DbTargetResult =
  | { ok: true; label: string; tables: string[]; rowHint?: string }
  | { ok: false; label: string; message: string; exitCode: number };

export type DbTestConnectionResult =
  | {
      ok: true;
      products: DbTargetResult & { ok: true };
      planner: DbTargetResult & { ok: true };
      supabaseHttp: boolean;
    }
  | { ok: false; message: string; exitCode: number; results: DbTargetResult[] };

async function checkTarget(opts: {
  label: string;
  url: string | null;
  expected: readonly string[];
  rowHintQuery?: (sql: ReturnType<typeof postgres>) => Promise<string>;
  log: typeof console.log;
  error: typeof console.error;
  sqlFactory: typeof postgres;
}): Promise<DbTargetResult> {
  const { label, url, expected, rowHintQuery, log, error, sqlFactory } = opts;
  if (!url) {
    const message = `❌ ERROR: ${label} URL missing`;
    error(message);
    return { ok: false, label, message, exitCode: 1 };
  }

  const sql = sqlFactory(url, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    prepare: false,
  });

  try {
    const ping = await sql`SELECT 1 AS connected`;
    if (ping[0]?.connected !== 1) {
      const message = `❌ ERROR: ${label} unexpected ping result`;
      error(message, ping);
      return { ok: false, label, message, exitCode: 1 };
    }
    log(`✅ ${label}: connection established.`);

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY(${[...expected]})
      ORDER BY table_name
    `;
    const names = tables.map((row) => row.table_name as string);
    log(`${label} tables present: ${names.join(", ") || "(none)"}`);

    const missing = expected.filter((name) => !names.includes(name));
    if (missing.length > 0) {
      const message = `❌ ERROR: ${label} missing tables: ${missing.join(", ")} — run pnpm --filter oando-site run db:apply${label === "Planner/Auth" ? ":admin" : ""}`;
      error(message);
      return { ok: false, label, message, exitCode: 1 };
    }

    let rowHint: string | undefined;
    if (rowHintQuery) {
      rowHint = await rowHintQuery(sql);
      log(rowHint);
    }

    return { ok: true, label, tables: names, rowHint };
  } catch (err) {
    error(`❌ ${label} DB CONNECTION ERROR:`);
    error(err);
    return {
      ok: false,
      label,
      message: err instanceof Error ? err.message : String(err),
      exitCode: 1,
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function checkDatabaseConnection(
  deps: {
    resolveProductsUrl?: typeof resolveProductsDatabaseUrl;
    resolvePlannerUrl?: typeof resolvePlannerDatabaseUrl;
    sqlFactory?: typeof postgres;
    env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
    log?: typeof console.log;
    error?: typeof console.error;
    warn?: typeof console.warn;
  } = {},
): Promise<DbTestConnectionResult> {
  const resolveProductsUrl =
    deps.resolveProductsUrl ?? resolveProductsDatabaseUrl;
  const resolvePlannerUrl = deps.resolvePlannerUrl ?? resolvePlannerDatabaseUrl;
  const sqlFactory = deps.sqlFactory ?? postgres;
  const env = deps.env ?? process.env;
  const log = deps.log ?? console.log;
  const error = deps.error ?? console.error;
  const warn = deps.warn ?? console.warn;

  log("Starting dual-database connection check (Products + Planner/Auth)...");

  const products = await checkTarget({
    label: "Products",
    url: resolveProductsUrl(),
    expected: PRODUCTS_EXPECTED,
    sqlFactory,
    log,
    error,
    rowHintQuery: async (sql) => {
      const [{ n }] =
        await sql`SELECT count(*)::int AS n FROM catalog_products`;
      return `✅ Products catalog_products=${n as number}`;
    },
  });

  const planner = await checkTarget({
    label: "Planner/Auth",
    url: resolvePlannerUrl(),
    expected: PLANNER_EXPECTED,
    sqlFactory,
    log,
    error,
    rowHintQuery: async (sql) => {
      const [{ n }] = await sql`SELECT count(*)::int AS n FROM oando_plans`;
      return `✅ oando_plans reachable (${n as number} rows)`;
    },
  });

  const results = [products, planner];

  const adminHttp = env.NEXT_ADMIN_SUPABASE_URL?.trim();
  const adminKey = env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim();
  const publicUrl =
    env.SUPABASE_URL?.trim() || env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anon =
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  const supabaseHttp = Boolean(publicUrl && serviceKey && anon);
  if (supabaseHttp) {
    log("✅ Supabase HTTP env vars present (URL + service role + anon).");
  } else {
    warn("⚠️ Supabase HTTP env vars incomplete.");
  }
  if (adminHttp && adminKey) {
    log("✅ Admin Supabase HTTP env vars present.");
  } else {
    warn("⚠️ Admin Supabase HTTP env vars missing (optional for pure Postgres).");
  }

  if (products.ok === false || planner.ok === false) {
    const failed = results.filter((r) => r.ok === false);
    return {
      ok: false,
      message: failed.map((r) => r.message).join(" | "),
      exitCode: 1,
      results,
    };
  }

  return {
    ok: true,
    products,
    planner,
    supabaseHttp,
  };
}

export async function main(): Promise<void> {
  const result = await checkDatabaseConnection();
  if (result.ok === false) {
    process.exit(result.exitCode);
  }
  process.exit(0);
}

function isMain(): boolean {
  const entry = (process.argv[1] ?? "").replace(/\\/g, "/");
  return (
    entry.endsWith("db_test_connection.ts") ||
    entry.endsWith("db_test_connection.js")
  );
}

if (isMain()) {
  void main();
}
