// Seed script using direct postgres connection (bypasses RLS).
// Run with: pnpm --filter oando-site run seed
// Env: repo-root `.env.local` (PRODUCTS_DATABASE_URL) via loadEnvLocal — not site-cwd only.
import { createRequire } from "node:module";
import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

// Parse the connection string manually to avoid URL-encoding issues
// with special characters in the password (e.g. @, #, $)
// Strip surrounding double or single quotes that some env loaders preserve.
const rawUrl = (process.env.PRODUCTS_DATABASE_URL ?? "").replace(/^["']|["']$/g, "");

if (!rawUrl) {
    console.error("PRODUCTS_DATABASE_URL is not set in .env.local (repo root or site/)");
    process.exit(1);
}

// Regex that handles passwords containing @ by matching the last @host:port/db
// e.g. postgres_protocol://postgres:[YOUR_PASSWORD]@db.xxx.supabase.co:5432/postgres
const match = rawUrl.match(/^postgresql:\/\/([^:]+):(.+)@([^@]+):(\d+)\/(.+)$/);
if (!match) {
    console.error("Could not parse PRODUCTS_DATABASE_URL. Format: postgresql://user:password@host:port/db");
    process.exit(1);
}

// Grab the last @-separated segment as host:port/db, everything before is user:password
const parts = rawUrl.replace(/^postgresql:\/\//, "").split("@");
const hostPart = parts[parts.length - 1]; // last segment is host:port/db
const userPart = parts.slice(0, parts.length - 1).join("@"); // rejoin rest as user:pass

const [userStr, ...passParts] = userPart.split(":");
const passwordStr = decodeURIComponent(passParts.join(":")); // handle colons in password
const [hostStr, portAndDb] = hostPart.split(":");
const [portStr, dbStr] = portAndDb.split("/");

console.log(`Connecting to: ${hostStr}:${portStr}/${dbStr} as ${userStr}`);
const sql = postgres({
    host: hostStr,
    port: parseInt(portStr, 10),
    database: dbStr,
    username: userStr,
    password: passwordStr,
    ssl: "require",
    max: 1,
    prepare: false,
});

async function seed() {
    console.log("Connecting to Supabase via direct postgres connection...");

    // seed_data.sql lives alongside this script in scripts/ (not cwd-dependent).
    const seedFile = path.join(scriptDir, "seed_data.sql");

    if (!fs.existsSync(seedFile)) {
        console.error("seed_data.sql not found at", seedFile);
        process.exit(1);
    }

    const seedSql = fs.readFileSync(seedFile, "utf-8");

    // Split into statements. Strip full-line `--` comments so a header like
    // `-- CATEGORIES SEED` above the first INSERT is not treated as "whole
    // statement is a comment" (that previously dropped oando-workstations).
    const statements = seedSql
        .split(";")
        .map((s) =>
            s
                .split("\n")
                .filter((line) => {
                    const t = line.trim();
                    return t.length > 0 && !t.startsWith("--");
                })
                .join("\n")
                .trim(),
        )
        .filter((s) => s.length > 0);

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
        try {
            await sql.unsafe(statement + ";");
            successCount++;
        } catch (err: unknown) {
            // narrow unknown for pg .code / .message; reason: sql errors from unsafe() carry code at runtime but typed as unknown; owner: Resolve Failures Agent (PLAN-FAIL-0411); removal: central typed PostgresError + util when added to platform/drizzle or scripts
            const e = err as { code?: string; message?: string };
            const msg = err instanceof Error ? err.message : String(err);
            if (e.code === "23505" || msg.includes("duplicate key")) {
                skipCount++; // Already exists, skip
            } else {
                console.error(`Error: ${msg}\n  → ${statement.substring(0, 100)}`);
                errorCount++;
            }
        }
    }

    // Verify workstations landed (category was historically skipped by comment bug).
    const wsCat = await sql`
      SELECT count(*)::int AS n FROM catalog_categories WHERE id = 'oando-workstations'
    `;
    const wsProd = await sql`
      SELECT count(*)::int AS n FROM catalog_products
      WHERE category_id IN ('oando-workstations', 'workstations')
    `;
    console.log(
      `✅ Done: ${successCount} inserted, ${skipCount} skipped (already exist), ${errorCount} errors.`,
    );
    console.log(
      `📦 workstations category rows=${wsCat[0]?.n ?? 0}, product rows=${wsProd[0]?.n ?? 0}`,
    );
    await sql.end();
}

seed().catch(err => {
    // narrow unknown for fatal; reason/owner/removal: same as above (PLAN-FAIL-0411)
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Fatal:', msg);
    process.exit(1);
});
