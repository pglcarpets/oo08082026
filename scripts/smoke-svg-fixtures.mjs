/**
 * Deterministic SVG CLI smoke: only scripts/generate-svg/_fixtures/*.json
 * (never block-descriptors / admin seeds — avoids unpredictable catalog overwrites).
 *
 * Usage (from site/):
 *   pnpm run scripts:smoke:svg:batch
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPipeline } from "./generate-svg.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "generate-svg", "_fixtures");

function listFixtureJsonFiles() {
  if (!existsSync(FIXTURES_DIR)) {
    throw new Error(`Fixtures directory missing: ${FIXTURES_DIR}`);
  }
  return readdirSync(FIXTURES_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => path.join(FIXTURES_DIR, name));
}

const fixtures = listFixtureJsonFiles();
if (fixtures.length === 0) {
  console.error(`No *.json fixtures in ${FIXTURES_DIR}`);
  process.exit(1);
}

/** @type {{ fixture: string; ok: boolean; slug?: string; svgPath?: string; bytes?: number; error?: string }[]} */
const results = [];
let failed = 0;

for (const fixturePath of fixtures) {
  const rel = path.relative(process.cwd(), fixturePath);
  try {
    const descriptor = JSON.parse(readFileSync(fixturePath, "utf8"));
    const { svg, svgPath, normalized } = await runPipeline(descriptor);
    const bytes = existsSync(svgPath) ? statSync(svgPath).size : 0;
    if (!svg || bytes <= 0) {
      throw new Error(`empty SVG output (${bytes} bytes)`);
    }
    const slug = normalized?.slug ?? descriptor.slug;
    console.log(`OK  ${rel} slug=${slug} bytes=${bytes}`);
    results.push({ fixture: rel, ok: true, slug, svgPath, bytes });
  } catch (err) {
    failed += 1;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`FAIL ${rel}: ${message}`);
    results.push({ fixture: rel, ok: false, error: message });
  }
}

console.log(
  `\nsmoke:svg:batch fixtures=${fixtures.length} ok=${fixtures.length - failed} fail=${failed}`,
);

if (failed > 0) {
  process.exit(1);
}
