/**
 * Audit admin/auth Supabase (NEXT_ADMIN_SUPABASE_URL).
 * CRM, profiles, and legacy admin tables — not catalog.
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { REPO_ROOT } from "./lib/repoRoot";

type AdminTable =
  | "customer_queries"
  | "profiles"
  | "user_history"
  | "clients"
  | "projects"
  | "quotes"
  | "teams"
  | "team_members"
  | "invites";

type TableProbe = {
  table: AdminTable;
  exists: boolean;
  rowCount: number | null;
  error: string | null;
};

type RuntimeCheck = {
  label: string;
  ok: boolean;
  detail: string;
};

type AdminAuditSummary = {
  generatedAt: string;
  supabaseHost: string;
  tables: TableProbe[];
  runtimeQueries: RuntimeCheck[];
};

const TABLES: AdminTable[] = [
  "customer_queries",
  "profiles",
  "user_history",
  "clients",
  "projects",
  "quotes",
  "teams",
  "team_members",
  "invites",
];

const RUNTIME_CHECKS: Array<{ label: string; table: AdminTable; columns: string }> = [
  { label: "Customer queries", table: "customer_queries", columns: "id,created_at,status" },
  { label: "Profiles", table: "profiles", columns: "id,display_name,created_at" },
  { label: "Teams", table: "teams", columns: "id,name" },
];

function summarizeError(error: unknown): string {
  if (!error) return "unknown";
  const text =
    error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error);
  return text.replace(/\s+/g, " ").trim();
}

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function createAdminClient(): SupabaseClient {
  const url = getEnv("NEXT_ADMIN_SUPABASE_URL");
  const key = getEnv("SUPABASE_ADMIN_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function probeTable(client: SupabaseClient, table: AdminTable): Promise<TableProbe> {
  try {
    const response = await client.from(table).select("*", { count: "exact", head: true });
    if (response.error) {
      return {
        table,
        exists: false,
        rowCount: null,
        error: summarizeError(response.error.message),
      };
    }
    return {
      table,
      exists: true,
      rowCount: response.count ?? 0,
      error: null,
    };
  } catch (error) {
    return {
      table,
      exists: false,
      rowCount: null,
      error: summarizeError(error),
    };
  }
}

async function runRuntimeChecks(client: SupabaseClient): Promise<RuntimeCheck[]> {
  const checks: RuntimeCheck[] = [];
  for (const probe of RUNTIME_CHECKS) {
    try {
      const response = await client.from(probe.table).select(probe.columns).limit(1);
      checks.push({
        label: probe.label,
        ok: !response.error,
        detail: response.error ? summarizeError(response.error.message) : "ok",
      });
    } catch (error) {
      checks.push({
        label: probe.label,
        ok: false,
        detail: summarizeError(error),
      });
    }
  }
  return checks;
}

function renderMarkdown(summary: AdminAuditSummary): string {
  const lines: string[] = [];
  lines.push("# Supabase Admin Schema Audit");
  lines.push("");
  lines.push(`- Generated at: ${summary.generatedAt}`);
  lines.push(`- Admin Supabase host: ${summary.supabaseHost}`);
  lines.push("");
  lines.push("## Table Probes");
  for (const table of summary.tables) {
    lines.push(
      `- ${table.table}: ${table.exists ? "present" : "missing"}${table.rowCount !== null ? `, rows=${table.rowCount}` : ""}${table.error ? `, error=${table.error}` : ""}`,
    );
  }
  lines.push("");
  lines.push("## Runtime Query Checks");
  for (const check of summary.runtimeQueries) {
    lines.push(`- ${check.label}: ${check.ok ? "ok" : "fail"}${check.detail ? ` (${check.detail})` : ""}`);
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  config({ path: ".env.local" });
  const client = createAdminClient();
  const supabaseUrl = getEnv("NEXT_ADMIN_SUPABASE_URL");
  const host = new URL(supabaseUrl).host;

  const tables = await Promise.all(TABLES.map((table) => probeTable(client, table)));
  const runtimeQueries = await runRuntimeChecks(client);

  const summary: AdminAuditSummary = {
    generatedAt: new Date().toISOString(),
    supabaseHost: host,
    tables,
    runtimeQueries,
  };

  const auditsDir = path.join(REPO_ROOT, "results", "audits");
  fs.mkdirSync(auditsDir, { recursive: true });

  const jsonPath = path.join(auditsDir, "supabase-admin-schema-audit.json");
  const mdPath = path.join(auditsDir, "supabase-admin-schema-audit.md");

  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), "utf8");
  fs.writeFileSync(mdPath, renderMarkdown(summary), "utf8");

  const failed = runtimeQueries.filter((check) => !check.ok).length;
  console.log(`[audit:supabase:admin] wrote ${path.relative(process.cwd(), mdPath)}`);
  console.log(
    `[audit:supabase:admin] customer_queries=${tables.find((t) => t.table === "customer_queries")?.rowCount ?? "?"} runtime_failures=${failed}`,
  );

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});