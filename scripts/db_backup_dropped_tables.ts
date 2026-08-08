/**
 * Pre-drop backup. Exports rows from tables we are about to drop into a
 * single SQL file under backups/. Restorable with `psql -f <file>` after
 * recreating the table structure (or use the original migrations).
 *
 * Usage:
 *   npm run db:backup-dropped
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import postgres from "postgres";

config({ path: resolve(process.cwd(), ".env.local") });

const TABLES = [
  "auth_account",
  "auth_session",
  "auth_user",
  "auth_verification",
  "__drizzle_migrations",
  "legacy_projects",
];

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function quoteValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === "object") {
    return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

(async () => {
  const dbUrl = process.env.PRODUCTS_DATABASE_URL?.trim();
  if (!dbUrl) throw new Error("Missing PRODUCTS_DATABASE_URL");

  const sql = postgres(dbUrl, { prepare: false, max: 1 });
  if (!existsSync("backups")) mkdirSync("backups", { recursive: true });

  const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const out = `backups/pre-cleanup-${ts}.sql`;
  const lines: string[] = [
    `-- Backup taken before cleanup migration on ${new Date().toISOString()}`,
    `-- Tables: ${TABLES.join(", ")}`,
    "-- Restore by manually recreating tables and running this file with psql.",
    "",
  ];

  for (const t of TABLES) {
    const rows = (await sql.unsafe(
      `select * from public.${quoteIdent(t).slice(1, -1)}`,
    )) as unknown as Record<string, unknown>[];
    lines.push(`-- ${t}: ${rows.length} rows`);
    if (rows.length === 0) {
      lines.push("");
      continue;
    }
    const cols = Object.keys(rows[0]);
    const colList = cols.map(quoteIdent).join(", ");
    for (const row of rows) {
      const vals = cols.map((c) => quoteValue(row[c])).join(", ");
      lines.push(
        `INSERT INTO public.${quoteIdent(t)} (${colList}) VALUES (${vals});`,
      );
    }
    lines.push("");
  }

  writeFileSync(out, lines.join("\n"), "utf8");
  console.log(`Backup written: ${out}`);
  await sql.end({ timeout: 5 });
})().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
