/**
 * Verify `oando_plans` exists on admin Supabase. Create via migrations, not ad-hoc DDL.
 * Env: repo-root `.env.local` via loadEnvLocal (same as db:test / db:apply).
 */
import { createRequire } from "node:module";
import postgres from "postgres";
import { resolvePlannerDatabaseUrl } from "../site/platform/drizzle/databaseUrls";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

export type EnsurePlansResult =
  | { ok: true; message: string }
  | { ok: false; message: string; exitCode: number };

export async function ensurePlansTable(
  deps: {
    resolveUrl?: typeof resolvePlannerDatabaseUrl;
    sqlFactory?: typeof postgres;
    log?: typeof console.log;
    error?: typeof console.error;
  } = {},
): Promise<EnsurePlansResult> {
  const resolveUrl = deps.resolveUrl ?? resolvePlannerDatabaseUrl;
  const sqlFactory = deps.sqlFactory ?? postgres;
  const log = deps.log ?? console.log;
  const error = deps.error ?? console.error;

  const url = resolveUrl();
  if (!url) {
    const message =
      "❌ Planner DB URL missing (set SUPABASE_AUTH_DATABASE_URL in repo-root .env.local)";
    error(message);
    return { ok: false, message, exitCode: 1 };
  }

  const sql = sqlFactory(url, { max: 1 });

  try {
    const [{ exists }] = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'oando_plans'
      ) AS exists
    `;

    if (exists) {
      const message = "✅ oando_plans table present.";
      log(message);
      return { ok: true, message };
    }

    const message =
      "❌ oando_plans missing — run: pnpm --filter oando-site run db:apply:admin";
    error(message);
    return { ok: false, message, exitCode: 1 };
  } catch (err) {
    error("❌ Failed to check oando_plans:");
    error(err);
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
      exitCode: 1,
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function main(): Promise<void> {
  const result = await ensurePlansTable();
  if (result.ok === false) process.exit(result.exitCode);
  process.exit(0);
}

function isMain(): boolean {
  const entry = (process.argv[1] ?? "").replace(/\\/g, "/");
  return entry.endsWith("db_ensure_plans_table.ts") || entry.endsWith("db_ensure_plans_table.js");
}

if (isMain()) {
  void main();
}
