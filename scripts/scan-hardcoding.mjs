#!/usr/bin/env node
/**
 * Scan product TS/TSX/CSS for hardcoding that should live in OO tokens / FOCSS palette.
 *
 * Usage:
 *   node scripts/scan-hardcoding.mjs
 *   node scripts/scan-hardcoding.mjs --strict   # exit 1 when product TS has hex
 *
 * Allowed hex homes (Planner and Studio are forked — each owns its palette):
 *   - site/lib/Planner/plannerPalette.ts
 *   - site/lib/Studio/studioPalette.ts
 *   - site/focss/planner/base/palette.css
 *   - site/focss/studio/base/palette.css
 *   - site/focss/base/tokens/*.css (palette / semantic / layout define the tokens)
 *   - site/focss/cra/* (archive dump; not live entries)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STRICT = process.argv.includes("--strict");

const HEX = /#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})\b/g;
const RGB = /\brgba?\(\s*\d+/g;
const MAGIC_MM = /\b(?:gap_mm|margin_mm|width_mm|height_mm|depth_mm|thickness_mm)\s*[:=]\s*\d+/g;

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "coverage",
  "data",
  "results",
  ".git",
]);

/** Per-app token files where mm defaults are authoritative. */
const MM_HOMES = new Set([
  "site/lib/Planner/plannerPalette.ts",
  "site/lib/Planner/plannerTokens.ts",
  "site/lib/Studio/studioPalette.ts",
  "site/lib/Studio/studioTokens.ts",
]);

function isAllowedMmHome(rel) {
  return MM_HOMES.has(rel.replace(/\\/g, "/"));
}

/** Per-app palette authorities where hex is expected (not a finding). */
const HEX_HOMES = new Set([
  "site/lib/Planner/plannerPalette.ts",
  "site/lib/Studio/studioPalette.ts",
  "site/focss/planner/base/palette.css",
  "site/focss/studio/base/palette.css",
  // Foundation token definitions live under site/focss/base/tokens/.
  "site/focss/base/tokens/palette.css",
]);

function isAllowedHexHome(rel) {
  const n = rel.replace(/\\/g, "/");
  if (HEX_HOMES.has(n)) return true;
  // Any token-definition folder is a lawful hex home: focss/{app}/base/tokens/.
  if (n.startsWith("site/focss/") && n.includes("/base/tokens/")) return true;
  if (n.startsWith("site/focss/cra/")) return true;
  return false;
}

/** CSS outside palette/cra should use var(--…) not raw hex. */
function isCssFinding(rel) {
  const n = rel.replace(/\\/g, "/");
  if (!n.endsWith(".css")) return false;
  if (isAllowedHexHome(n)) return false;
  return n.startsWith("site/focss/");
}

/** Product TS outside ooTokens should not embed hex. */
function isTsFinding(rel) {
  const n = rel.replace(/\\/g, "/");
  if (!/\.(ts|tsx)$/.test(n)) return false;
  if (isAllowedHexHome(n)) return false;
  if (!n.startsWith("site/")) return false;
  if (n.includes("/tests/") || n.includes(".test.") || n.includes(".spec.")) return false;
  return true;
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, out);
    else if (/\.(ts|tsx|css)$/.test(ent.name)) out.push(abs);
  }
  return out;
}

/**
 * Strip comments (TS line and block comments, CSS block comments) so prose that merely
 * names a colour (e.g. "never pure #000") is not reported as an actual hardcoded value.
 * Newlines survive so reported line numbers stay accurate.
 */
function maskComments(src) {
  let out = "";
  let i = 0;
  let inBlock = false;
  const LF = String.fromCharCode(10);
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (inBlock) {
      if (c === "*" && n === "/") { inBlock = false; out += "  "; i += 2; }
      else { out += c === LF ? LF : " "; i += 1; }
    } else if (c === "/" && n === "*") { inBlock = true; out += "  "; i += 2; }
    else if (c === "/" && n === "/") { while (i < src.length && src[i] !== LF) { out += " "; i += 1; } }
    else { out += c; i += 1; }
  }
  return out;
}

function collect(src, re) {
  const hits = [];
  let m;
  const copy = new RegExp(re.source, re.flags);
  while ((m = copy.exec(src)) !== null) {
    const line = src.slice(0, m.index).split("\n").length;
    hits.push({ line, match: m[0] });
  }
  return hits;
}

const files = walk(path.join(ROOT, "site"));
/** @type {{ file: string, kind: string, line: number, match: string }[]} */
const findings = [];

for (const abs of files) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
  const src = maskComments(fs.readFileSync(abs, "utf8"));

  if (isTsFinding(rel) || isCssFinding(rel)) {
    for (const h of collect(src, HEX)) {
      findings.push({ file: rel, kind: "hex", line: h.line, match: h.match });
    }
  }

  // Flag magic millimetre literals in product TS (geometry defaults should use tokens).
  if (
    isTsFinding(rel) &&
    !isAllowedMmHome(rel) &&
    !/(plannerTypes|studioTypes)\.ts$/.test(rel.replace(/\\/g, "/"))
  ) {
    for (const h of collect(src, MAGIC_MM)) {
      findings.push({ file: rel, kind: "magic-mm", line: h.line, match: h.match });
    }
  }

  // rgba in product TS (CSS vars / OO tokens preferred).
  if (isTsFinding(rel)) {
    for (const h of collect(src, RGB)) {
      findings.push({ file: rel, kind: "rgb", line: h.line, match: h.match });
    }
  }
}

const byKind = findings.reduce((acc, f) => {
  acc[f.kind] = (acc[f.kind] || 0) + 1;
  return acc;
}, /** @type {Record<string, number>} */ ({}));

const tsHex = findings.filter((f) => f.kind === "hex" && /\.(ts|tsx)$/.test(f.file));
const cssHex = findings.filter((f) => f.kind === "hex" && f.file.endsWith(".css"));
const other = findings.filter((f) => f.kind !== "hex");

console.log("=== OO hardcoding scan ===");
console.log(`files scanned: ${files.length}`);
console.log(`findings: ${findings.length}`, byKind);
console.log("");

function printGroup(title, rows, limit = 40) {
  console.log(`-- ${title} (${rows.length}) --`);
  for (const r of rows.slice(0, limit)) {
    console.log(`  ${r.file}:${r.line}  ${r.match}`);
  }
  if (rows.length > limit) console.log(`  … +${rows.length - limit} more`);
  console.log("");
}

printGroup("TS/TSX hex (should be 0 outside each app's palette)", tsHex);
printGroup("FOCSS hex outside palette/cra (prefer var(--token))", cssHex);
printGroup("Other (rgb / magic-mm)", other);

const summary = {
  scanned: files.length,
  totals: byKind,
  tsHex: tsHex.length,
  cssHex: cssHex.length,
  ok: tsHex.length === 0,
};
const outDir = path.join(ROOT, "results", "hardcoding");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "scan.json");
fs.writeFileSync(outPath, JSON.stringify({ summary, findings }, null, 2));
console.log(`wrote ${path.relative(ROOT, outPath).replace(/\\/g, "/")}`);

if (STRICT && tsHex.length > 0) {
  console.error(`STRICT: ${tsHex.length} product TS hex finding(s)`);
  process.exit(1);
}

process.exit(0);
