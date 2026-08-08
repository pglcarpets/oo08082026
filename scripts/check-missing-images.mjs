/**
 * Scan site code + i18n for /assets/... image paths and report missing files under site/public.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(".");
const PUBLIC = path.resolve("site/public");
const SCAN_DIRS = [
  "site/features",
  "site/components",
  "site/lib",
  "site/i18n/messages",
  "site/app",
];
const EXT_OK = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".mdx"]);
const IMG_RE =
  /["'`](\/assets\/[^"'`\s]+\.(?:webp|jpe?g|png|gif|svg|avif|ico))["'`]/gi;
const ALSO_RE =
  /["'`](\/(?:logo[^"'`]*|icon[^"'`]*)\.(?:webp|jpe?g|png|ico|svg))["'`]/gi;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".next" || ent.name.startsWith(".")) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (EXT_OK.has(path.extname(ent.name).toLowerCase())) out.push(full);
  }
  return out;
}

function resolvePublic(urlPath) {
  // strip query
  const clean = urlPath.split("?")[0];
  const rel = clean.replace(/^\//, "");
  return path.join(PUBLIC, rel);
}

const refs = new Map(); // path -> Set of files
for (const d of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, d))) {
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const re of [IMG_RE, ALSO_RE]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        const p = m[1];
        if (!refs.has(p)) refs.set(p, new Set());
        refs.get(p).add(path.relative(ROOT, file).replace(/\\/g, "/"));
      }
    }
  }
}

// Also scan MARKETING_PATH_ALIASES targets from assetPaths by evaluating keys in file via regex
const assetPathsFile = path.join(ROOT, "site/lib/assetPaths.ts");
if (fs.existsSync(assetPathsFile)) {
  const t = fs.readFileSync(assetPathsFile, "utf8");
  const re = /["'](\/assets\/[^"']+\.(?:webp|jpe?g|png|gif|svg|avif))["']/g;
  let m;
  while ((m = re.exec(t))) {
    const p = m[1];
    if (!refs.has(p)) refs.set(p, new Set());
    refs.get(p).add("site/lib/assetPaths.ts");
  }
}

const missing = [];
const present = [];
for (const [p, files] of [...refs.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const disk = resolvePublic(p);
  if (fs.existsSync(disk)) {
    present.push(p);
  } else {
    missing.push({
      path: p,
      refs: [...files].slice(0, 8),
      refCount: files.size,
    });
  }
}

// Group missing by top folder
const byFolder = {};
for (const m of missing) {
  const parts = m.path.replace(/^\//, "").split("/");
  const key = parts.slice(0, 3).join("/");
  byFolder[key] = (byFolder[key] || 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  scannedRefs: refs.size,
  present: present.length,
  missing: missing.length,
  byFolder,
  missingList: missing,
};

fs.mkdirSync("results/asset-cutover", { recursive: true });
fs.writeFileSync(
  "results/asset-cutover/missing-images-report.json",
  JSON.stringify(report, null, 2)
);

console.log(JSON.stringify({ scannedRefs: report.scannedRefs, present: report.present, missing: report.missing, byFolder }, null, 2));
console.log("\n--- MISSING (up to 80) ---");
for (const m of missing.slice(0, 80)) {
  console.log(m.path, "←", m.refs[0] + (m.refCount > 1 ? ` (+${m.refCount - 1})` : ""));
}
if (missing.length > 80) console.log(`... +${missing.length - 80} more`);
console.log("\nwrote results/asset-cutover/missing-images-report.json");
