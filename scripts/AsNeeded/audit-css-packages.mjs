/**
 * Audit css packages: broken imports, stale path refs, unreferenced files.
 */
import fs from "node:fs";
import path from "node:path";

const cssRoot = path.resolve("site/focss");
const repoRoot = path.resolve(".");

const packages = ["base", "features", "site", "admin", "planner"];

function walk(d, acc = [], pred = () => true) {
  if (!fs.existsSync(d)) return acc;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".git") continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc, pred);
    else if (pred(p, e.name)) acc.push(p);
  }
  return acc;
}

function rel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, "/");
}

// --- 1) Broken relative @imports inside packages ---
const broken = [];
const allCss = [];
for (const pkg of packages) {
  for (const f of walk(path.join(cssRoot, pkg), [], (p) => p.endsWith(".css"))) {
    allCss.push(f);
    const t = fs.readFileSync(f, "utf8");
    const re = /@import\s+["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(t))) {
      const imp = m[1];
      if (!imp.startsWith(".")) continue;
      const resolved = path.normalize(path.join(path.dirname(f), imp));
      if (!fs.existsSync(resolved) && !fs.existsSync(`${resolved}.css`)) {
        broken.push({ from: rel(f), imp, resolved });
      }
    }
  }
}

// --- 2) Stale path references in code/tests ---
const stalePatterns = [
  /app\/css\/core\//,
  /app\/css\/surfaces\//,
  /app\/css\/features\//,
  /@\/app\/css\/core\//,
  /@\/app\/css\/surfaces\//,
  /@\/app\/css\/features\//,
  /core\/locked\//,
  /css\/core\/components/,
  /css\/core\/utilities/,
];

const skipDir = new Set([
  "node_modules",
  ".git",
  "results",
  "dist",
  ".next",
  "generated-documents",
  ".archive",
  "agent-reports",
]);
const codeExt = new Set([".ts", ".tsx", ".css", ".js", ".mjs"]);

const staleHits = [];
function walkRepo(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (skipDir.has(e.name)) continue;
    // skip one-shot AsNeeded migration scripts that document old paths
    if (e.name === "AsNeeded" && d.endsWith("scripts")) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walkRepo(p);
    else if (codeExt.has(path.extname(e.name))) {
      let t;
      try {
        t = fs.readFileSync(p, "utf8");
      } catch {
        continue;
      }
      for (const pat of stalePatterns) {
        if (pat.test(t)) {
          // ignore comments in this audit script itself
          if (p.includes("audit-css-packages")) continue;
          staleHits.push({ file: rel(p), pattern: String(pat) });
          break;
        }
      }
    }
  }
}
walkRepo(repoRoot);

// --- 3) Unreferenced CSS files (not imported by another CSS or TSX/TS) ---
// Build set of files that are entry points or imported
const referenced = new Set();

// Global / layout entries
const entries = [
  "site/focss/site/entry.css",
  "site/focss/admin/entry.css",
  "site/focss/planner/entry.css",
  "site/focss/admin/entry.css",
  "site/focss/planner/entry.css",
  "site/focss/studio/entry.css",
  "site/focss/base/root.css",
  "tech-docs-generator/src/styles/index.css",
  "tech-docs-generator/src/index.css",
];
for (const e of entries) {
  const abs = path.resolve(e);
  if (fs.existsSync(abs)) referenced.add(path.normalize(abs));
}

// Collect all text that may import CSS
const importers = walk(
  repoRoot,
  [],
  (p, name) =>
    codeExt.has(path.extname(name)) &&
    !p.includes(`${path.sep}node_modules${path.sep}`) &&
    !p.includes(`${path.sep}.git${path.sep}`) &&
    !p.includes(`${path.sep}.archive${path.sep}`) &&
    !p.includes(`${path.sep}results${path.sep}`),
);

const importRes = [
  /@import\s+["']([^"']+)["']/g,
  /from\s+["'](@focss\/[^"']+\.css)["']/g,
  /import\s+["'](@focss\/[^"']+\.css)["']/g,
  /import\s+["']([^"']+\.css)["']/g,
  /readFileSync\([^)]*["']([^"']+\.css)["']/g,
  /path\.join\([^)]*["']([^"']+\.css)["']/g,
  /["'](focss\/[^"']+\.css)["']/g,
  /["'](site\/focss\/[^"']+\.css)["']/g,
];

function resolveImport(fromFile, imp) {
  if (imp.startsWith("@focss/")) {
    return path.normalize(path.join(repoRoot, "site", "focss", imp.slice("@focss/".length)));
  }
  if (imp.startsWith("focss/")) {
    return path.normalize(path.join(repoRoot, "site", imp));
  }
  if (imp.startsWith("site/focss/")) {
    return path.normalize(path.join(repoRoot, imp));
  }
  if (imp.startsWith(".")) {
    let r = path.normalize(path.join(path.dirname(fromFile), imp));
    if (!r.endsWith(".css") && fs.existsSync(`${r}.css`)) r = `${r}.css`;
    return r;
  }
  return null;
}

for (const f of importers) {
  let t;
  try {
    t = fs.readFileSync(f, "utf8");
  } catch {
    continue;
  }
  if (!t.includes(".css") && !t.includes("@import")) continue;
  for (const re of importRes) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(t))) {
      const resolved = resolveImport(f, m[1]);
      if (resolved && resolved.includes(`${path.sep}css${path.sep}`) && fs.existsSync(resolved)) {
        referenced.add(path.normalize(resolved));
      }
    }
  }
}

// BFS: follow @import chains from referenced CSS
const queue = [...referenced];
const seen = new Set(queue.map((p) => path.normalize(p)));
while (queue.length) {
  const f = queue.pop();
  if (!f.endsWith(".css") || !fs.existsSync(f)) continue;
  const t = fs.readFileSync(f, "utf8");
  const re = /@import\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(t))) {
    const r = resolveImport(f, m[1]);
    if (!r) continue;
    const n = path.normalize(r);
    if (!seen.has(n) && fs.existsSync(n)) {
      seen.add(n);
      referenced.add(n);
      queue.push(n);
    }
  }
}

// CSS modules imported from TSX are in referenced via @/app/css/
// Also mark README as not relevant
const unreferenced = [];
for (const f of allCss) {
  const n = path.normalize(f);
  if (!referenced.has(n) && !seen.has(n)) {
    unreferenced.push(rel(f));
  }
}

// --- 4) Dead legacy package dirs ---
const deadDirs = ["core", "surfaces", "entries", "product"]
  .map((d) => path.join(cssRoot, d))
  .filter((d) => fs.existsSync(d));

// Report
console.log("=== BROKEN @import ===");
console.log(broken.length ? JSON.stringify(broken, null, 2) : "none");
console.log("\n=== STALE PATH REFS (code/tests, excl .archive/AsNeeded) ===");
console.log(staleHits.length ? staleHits.map((h) => `${h.file} (${h.pattern})`).join("\n") : "none");
console.log("\n=== UNREFERENCED CSS FILES ===");
console.log(
  unreferenced.length
    ? unreferenced.join("\n")
    : "none",
);
console.log("\n=== LEGACY DIRS STILL PRESENT ===");
console.log(deadDirs.length ? deadDirs.map(rel).join("\n") : "none");
console.log("\n=== COUNTS ===");
console.log({
  cssFiles: allCss.length,
  broken: broken.length,
  staleHits: staleHits.length,
  unreferenced: unreferenced.length,
  referenced: referenced.size,
});

if (broken.length) process.exit(1);
