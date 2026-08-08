import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { REPO_ROOT } from "./lib/repoRoot";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

type BackupTableResult = {
  table: string;
  rows: number;
  pages: number;
  status: "ok" | "skipped" | "error";
  error?: string;
  file?: string;
};

const DEFAULT_TABLES = [
  "catalog_categories",
  "catalog_products",
  "catalog_product_specs",
  "catalog_product_images",
  "catalog_product_slug_aliases",
  "business_stats_current",
  "business_stats_history",
  "customer_queries",
  "configurator_products",
  "planner_managed_products",
  "feature_flags",
  "block_themes",
  "image_assets",
] as const;

const PAGE_SIZE = 1000;
const DEFAULT_MAX_RETRIES = 4;
const BASE_RETRY_DELAY_MS = 800;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function timestampFolder(date = new Date()): string {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join("") + `-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function parseTablesFromEnv(): string[] {
  const raw = process.env.SUPABASE_BACKUP_TABLES?.trim();
  if (!raw) return [...DEFAULT_TABLES];
  return [...new Set(raw.split(",").map((v) => v.trim()).filter(Boolean))];
}

function parseRetentionDays(): number {
  const raw = process.env.SUPABASE_BACKUP_RETENTION_DAYS?.trim();
  if (!raw) return 14;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 14;
  return parsed;
}

function parseMaxRetries(): number {
  const raw = process.env.SUPABASE_BACKUP_MAX_RETRIES?.trim();
  if (!raw) return DEFAULT_MAX_RETRIES;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_MAX_RETRIES;
  return parsed;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isMissingTableError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("could not find the table") ||
    normalized.includes("does not exist") ||
    normalized.includes("relation \"public.")
  );
}

function isTransientError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("ssl handshake failed") ||
    normalized.includes("error code 525") ||
    normalized.includes("cloudflare") ||
    normalized.includes("<!doctype html>") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("fetch failed") ||
    normalized.includes("timeout")
  );
}

async function withRetry<T>(
  task: () => Promise<T>,
  opts: { table: string; maxRetries: number; offset?: number },
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < opts.maxRetries) {
    attempt += 1;
    try {
      return await task();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!isTransientError(message) || attempt >= opts.maxRetries) {
        throw error;
      }
      const delay = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1);
      const pageInfo = typeof opts.offset === "number" ? ` offset=${opts.offset}` : "";
      console.warn(
        `[backup] transient error table=${opts.table}${pageInfo} attempt=${attempt}/${opts.maxRetries}; retrying in ${delay}ms`,
      );
      await sleep(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function fetchAllRows(
  client: SupabaseClient,
  table: string,
  maxRetries: number,
): Promise<{ rows: unknown[]; pages: number }> {
  const rows: unknown[] = [];
  let pages = 0;

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await withRetry(
      async () =>
        client
          .from(table)
          .select("*")
          .range(offset, offset + PAGE_SIZE - 1),
      { table, maxRetries, offset },
    );

    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    pages += 1;
    if (page.length < PAGE_SIZE) break;
  }

  return { rows, pages };
}

function cleanupOldBackups(rootDir: string, retentionDays: number) {
  if (!fs.existsSync(rootDir)) return;
  const now = Date.now();
  const cutoff = now - retentionDays * 24 * 60 * 60 * 1000;

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(rootDir, entry.name);
    const stat = fs.statSync(fullPath);
    if (stat.mtimeMs < cutoff) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const supabaseKey = serviceKey || anonKey;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const tables = parseTablesFromEnv();
  const retentionDays = parseRetentionDays();
  const maxRetries = parseMaxRetries();
  const runId = timestampFolder();
  const backupRoot = path.join(REPO_ROOT, "results", "backups", "supabase");
  const runDir = path.join(backupRoot, runId);
  ensureDir(runDir);

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const results: BackupTableResult[] = [];
  for (const table of tables) {
    try {
      const { rows, pages } = await fetchAllRows(client, table, maxRetries);
      const file = `${table}.json`;
      fs.writeFileSync(
        path.join(runDir, file),
        JSON.stringify(rows, null, 2),
        "utf8",
      );
      results.push({ table, rows: rows.length, pages, status: "ok", file });
      console.log(`[backup] ${table}: ${rows.length} rows`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isMissingTableError(message)) {
        results.push({
          table,
          rows: 0,
          pages: 0,
          status: "skipped",
          error: message,
        });
        console.warn(`[backup] ${table}: SKIPPED missing table`);
        continue;
      }
      results.push({
        table,
        rows: 0,
        pages: 0,
        status: "error",
        error: message,
      });
      console.error(`[backup] ${table}: ERROR ${message}`);
    }
  }

  const manifest = {
    runId,
    createdAt: new Date().toISOString(),
    source: "supabase-rest",
    supabaseUrlHost: new URL(supabaseUrl).host,
    usedServiceRoleKey: Boolean(serviceKey),
    pageSize: PAGE_SIZE,
    maxRetries,
    retentionDays,
    tables,
    results,
  };
  fs.writeFileSync(
    path.join(runDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  cleanupOldBackups(backupRoot, retentionDays);

  const okCount = results.filter((r) => r.status === "ok").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;
  const errCount = results.filter((r) => r.status === "error").length;
  console.log(
    `[backup] complete run=${runId} tables_ok=${okCount} tables_skipped=${skippedCount} tables_error=${errCount}`,
  );

  if (errCount > 0) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
