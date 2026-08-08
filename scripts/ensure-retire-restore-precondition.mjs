/**
 * Ensures side-table-001 is live in catalog-ops lifecycle manifest before
 * admin-svg-retire-restore.spec.ts (mutates gitignored results/ only).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SLUG = "side-table-001";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const opsDir = path.join(repoRoot, "results", "admin", "catalog-ops");
const manifestPath = path.join(opsDir, "_catalog-lifecycle.json");

mkdirSync(opsDir, { recursive: true });

let manifest = {};
if (existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    manifest = {};
  }
}

const current = manifest[SLUG]?.state ?? null;
if (current !== "live") {
  manifest[SLUG] = {
    state: "live",
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`precondition: set ${SLUG} lifecycle draft/retired → live`);
} else {
  console.log(`precondition: ${SLUG} already live`);
}