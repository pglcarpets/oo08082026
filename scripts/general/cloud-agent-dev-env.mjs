/**
 * Bootstrap an offline dev profile for Cloud Agents / fresh workstations.
 *
 * Writes `.env.local` and `site/.env.local` with a non-secret, disk-backed
 * dev profile (DEV_AUTH_BYPASS=1) when they are absent, so `pnpm dev` runs
 * end-to-end without Supabase / LLM / Cloudflare credentials. Existing files
 * are never overwritten, so real secrets added later are preserved.
 *
 * Idempotent: safe to run repeatedly (e.g. from the `install` phase).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const SHARED = `# --- Site URL (local dev :3000) ---
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
NEXT_PUBLIC_TECH_DOCS_URL=http://localhost:3001

# --- Email (dev placeholders) ---
EMAIL_FROM=One&Only <dev@localhost>
STAFF_NOTIFY_EMAIL=dev@localhost

# --- Feature flags (explicit workstation profile) ---
ACTIVE_THEME_ID=premium-light
SITE_MAINTENANCE_MODE=readonly
NEXT_PUBLIC_CRM_DEMO_MODE=1
SVG_RELEASE_AUTHORITY=db
PNG_DISK_MIRROR=0
NEXT_PUBLIC_ASSET_BASE_URL=https://oando.co.in
CLOUDFLARE_R2_CATALOG_BUCKET=oando-asset-cdn

# --- Dev / E2E (disk persistence) ---
DEV_AUTH_BYPASS=1
`;

const HEADER = `# Auto-generated offline dev profile (scripts/general/cloud-agent-dev-env.mjs).
# Non-secret dev defaults only — add real Supabase/LLM/Cloudflare secrets here
# to enable those features. This file is never overwritten once it exists.
`;

// LANCE_DB_URI differs by location: repo root is site-prefixed, site/ is relative.
const targets = [
  {
    file: path.join(repoRoot, ".env.local"),
    lance: "LANCE_DB_URI=site/.data/lancedb/catalog",
  },
  {
    file: path.join(repoRoot, "site", ".env.local"),
    lance: "LANCE_DB_URI=.data/lancedb/catalog",
  },
];

let wrote = 0;
for (const { file, lance } of targets) {
  if (fs.existsSync(file)) {
    console.log(`cloud-agent-dev-env: kept existing ${path.relative(repoRoot, file)}`);
    continue;
  }
  const body = `${HEADER}\n${SHARED}\n# --- Lance vector store ---\n${lance}\n`;
  fs.writeFileSync(file, body, "utf8");
  wrote += 1;
  console.log(`cloud-agent-dev-env: wrote ${path.relative(repoRoot, file)}`);
}

console.log(
  wrote === 0
    ? "cloud-agent-dev-env: nothing to do (dev env files present)"
    : `cloud-agent-dev-env: created ${wrote} dev env file(s)`,
);
