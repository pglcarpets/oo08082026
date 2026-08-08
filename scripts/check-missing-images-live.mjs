/**
 * Focused missing-image audit:
 * 1) Live marketing page data + components (not localCatalogIndex bulk)
 * 2) Resolve through simple MARKETING aliases if present on disk after nest
 * 3) Catalog sample: check disk has gallery webps for SKUs under assets/catalog
 */
import fs from "fs";
import path from "path";

const PUBLIC = path.resolve("site/public");
const LIVE_GLOBS = [
  "site/features/site/data",
  "site/components",
  "site/lib/assetPaths.ts",
  "site/i18n/messages/en.json",
  "site/i18n/messages/hi.json",
];

const IMG_RE =
  /["'`](\/(?:assets\/[^"'`\s]+|logo[^"'`\s]*|icon[^"'`\s]*)\.(?:webp|jpe?g|png|gif|svg|avif|ico))["'`]/gi;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const st = fs.statSync(dir);
  if (st.isFile()) {
    out.push(dir);
    return out;
  }
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|json)$/.test(ent.name) && !/localCatalogIndex/.test(ent.name))
      out.push(full);
  }
  return out;
}

function exists(urlPath) {
  const rel = urlPath.split("?")[0].replace(/^\//, "");
  return fs.existsSync(path.join(PUBLIC, rel));
}

// Load alias map from assetPaths.ts string pairs
const aliases = {};
const ap = fs.readFileSync("site/lib/assetPaths.ts", "utf8");
const pairRe = /"(\/assets\/[^"]+)":\s*\n\s*"(\/assets\/[^"]+)"/g;
let m;
while ((m = pairRe.exec(ap))) aliases[m[1]] = m[2];
// also single-line
const pairRe2 = /"(\/assets\/[^"]+)":\s*"(\/assets\/[^"]+)"/g;
while ((m = pairRe2.exec(ap))) aliases[m[1]] = m[2];

function resolve(p) {
  let cur = p;
  const seen = new Set();
  while (aliases[cur] && !seen.has(cur)) {
    seen.add(cur);
    cur = aliases[cur];
  }
  // PRODUCT_IMAGE_FALLBACK
  if (cur.includes("fallback") && aliases["/assets/marketing/brand/logos/catalog-logo.png"]) {
    /* skip */
  }
  return cur;
}

const refs = new Map();
for (const g of LIVE_GLOBS) {
  for (const file of walk(path.resolve(g))) {
    const text = fs.readFileSync(file, "utf8");
    IMG_RE.lastIndex = 0;
    let mm;
    while ((mm = IMG_RE.exec(text))) {
      const p = mm[1];
      if (!refs.has(p)) refs.set(p, new Set());
      refs.get(p).add(path.relative(process.cwd(), file).replace(/\\/g, "/"));
    }
  }
}

const missing = [];
const ok = [];
const aliasHits = [];
for (const [p, files] of [...refs.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (p.includes("${") || p.includes("`")) continue;
  const resolved = resolve(p);
  if (exists(p)) {
    ok.push(p);
  } else if (exists(resolved)) {
    aliasHits.push({ from: p, to: resolved });
  } else {
    missing.push({ path: p, resolved, refs: [...files].slice(0, 5) });
  }
}

// Catalog disk reality: count SKU folders with/without image-1.webp
function catalogHealth() {
  const cat = path.join(PUBLIC, "assets/catalog");
  if (!fs.existsSync(cat)) return { error: "no catalog" };
  const families = fs.readdirSync(cat, { withFileTypes: true }).filter((d) => d.isDirectory());
  let skus = 0,
    withImg = 0,
    without = [];
  for (const fam of families) {
    if (fam.name.startsWith("_")) continue;
    const famPath = path.join(cat, fam.name);
    for (const sku of fs.readdirSync(famPath, { withFileTypes: true })) {
      if (!sku.isDirectory() || sku.name.startsWith("_")) continue;
      skus++;
      const g1 = path.join(famPath, sku.name, "gallery", "image-1.webp");
      const d1 = path.join(famPath, sku.name, "detail", "image-1.webp");
      const root = path.join(famPath, sku.name, "image-1.webp");
      if (fs.existsSync(g1) || fs.existsSync(d1) || fs.existsSync(root)) withImg++;
      else without.push(`${fam.name}/${sku.name}`);
    }
  }
  return { skus, withImg, withoutCount: without.length, withoutSample: without.slice(0, 25) };
}

// Live HTTP check of marketing heroes used on homepage (localhost)
const liveUrls = [
  "/assets/marketing/hero/slides/Dmrc-Oneandonly-bright.webp",
  "/assets/marketing/hero/slides/TVS-Oneandonly-bright.webp",
  "/assets/marketing/hero/pages/about-oneandonly-bright.webp",
  "/assets/marketing/hero/pages/contact-oneandonly-bright.webp",
  "/assets/marketing/brand/logos/logo-sharp.png",
  "/assets/marketing/brand/logos/OneandOnlySmall-LogoHS.png",
  "/assets/marketing/clients/DMRC/dmrc-1.webp",
  "/assets/marketing/clients/Titan/hero.webp",
  "/assets/marketing/clients/TVS/tvs.webp",
  "/logo.webp",
  "/logo-v2.webp",
  "/icon.png",
];

const report = {
  generatedAt: new Date().toISOString(),
  liveCode: {
    uniqueRefs: refs.size,
    ok: ok.length,
    aliasOk: aliasHits.length,
    missing: missing.length,
    missingList: missing,
    aliasHits: aliasHits.slice(0, 40),
  },
  catalog: catalogHealth(),
  liveUrls,
};

fs.writeFileSync(
  "results/asset-cutover/missing-images-live-report.json",
  JSON.stringify(report, null, 2)
);
console.log(JSON.stringify({ liveCode: { uniqueRefs: report.liveCode.uniqueRefs, ok: report.liveCode.ok, aliasOk: report.liveCode.aliasOk, missing: report.liveCode.missing }, catalog: report.catalog }, null, 2));
console.log("\nMISSING LIVE:");
for (const m of missing) console.log(" ", m.path, m.resolved !== m.path ? `=> ${m.resolved}` : "", "←", m.refs[0]);
