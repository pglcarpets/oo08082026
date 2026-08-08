/**
 * One-shot cycle finder for site/ + scripts/ static imports.
 * Usage: node scripts/AsNeeded/_scan-circular-imports.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../lib/repoRoot.mjs";

const roots = [path.join(REPO_ROOT, "site"), path.join(REPO_ROOT, "scripts")];
const skip = (p) =>
  /node_modules|\.next|[\\/]public[\\/]|inventory|migrations|functions[\\/]assistant/.test(
    p,
  );

const files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) {
      if (!skip(f) && e.name !== "node_modules" && e.name !== ".next") walk(f);
    } else if (
      /\.(ts|tsx|mjs|js|cjs)$/.test(e.name) &&
      !e.name.endsWith(".d.ts")
    ) {
      files.push(f);
    }
  }
}
for (const r of roots) if (fs.existsSync(r)) walk(r);

const importRe = /(?:from|import\(|require\()\s*['"]([^'"]+)['"]/g;
/** @type {Map<string, Set<string>>} */
const graph = new Map();

function tryFile(base) {
  const cands = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mjs`,
    `${base}.js`,
    `${base}.cjs`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.mjs"),
    path.join(base, "index.js"),
  ];
  for (const c of cands) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return path.normalize(c);
  }
  return null;
}

function resolveSpec(fromFile, spec) {
  if (spec.startsWith("@/")) {
    return tryFile(path.join(REPO_ROOT, "site", spec.slice(2)));
  }
  if (!spec.startsWith(".")) return null;
  return tryFile(path.resolve(path.dirname(fromFile), spec));
}

for (const f of files) {
  let text;
  try {
    text = fs.readFileSync(f, "utf8");
  } catch {
    continue;
  }
  const outs = new Set();
  let m;
  importRe.lastIndex = 0;
  while ((m = importRe.exec(text))) {
    const t = resolveSpec(f, m[1]);
    if (t && t !== path.normalize(f)) outs.add(t);
  }
  graph.set(path.normalize(f), outs);
}

const cycles = [];
const visiting = new Set();
const visited = new Set();
const stack = [];

function dfs(n) {
  if (visited.has(n)) return;
  if (visiting.has(n)) {
    const i = stack.indexOf(n);
    if (i >= 0) {
      const cyc = stack.slice(i).concat(n);
      if (cyc.length <= 16) {
        cycles.push(
          cyc.map((p) => path.relative(REPO_ROOT, p).replace(/\\/g, "/")),
        );
      }
    }
    return;
  }
  visiting.add(n);
  stack.push(n);
  for (const m of graph.get(n) || []) dfs(m);
  stack.pop();
  visiting.delete(n);
  visited.add(n);
}

for (const n of graph.keys()) dfs(n);

const seen = new Set();
const unique = [];
for (const c of cycles) {
  const key = [...new Set(c)].sort().join("|");
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(c);
}

console.log(`modules=${graph.size} cycles=${unique.length}`);
unique.slice(0, 30).forEach((c, i) => {
  console.log(`${i + 1}. ${c.join(" -> ")}`);
});
if (unique.length > 30) console.log(`... +${unique.length - 30} more`);
