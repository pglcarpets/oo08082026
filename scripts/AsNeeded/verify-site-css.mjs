import fs from "node:fs";
import path from "node:path";

const cssRoot = path.resolve("site/focss");
const siteRoot = path.join(cssRoot, "site");

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name.endsWith(".css")) acc.push(p);
  }
  return acc;
}

const broken = [];
for (const f of walk(siteRoot)) {
  const dir = path.dirname(f);
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/@import\s+["']([^"']+)["']/g)) {
    const rel = m[1];
    if (!rel.startsWith(".")) continue;
    const t = path.resolve(dir, rel);
    if (!fs.existsSync(t)) {
      broken.push(`${path.relative(cssRoot, f)} -> ${rel}`);
    }
  }
}

// entry chain — site entry pulls site/index.css
const siteEntry = fs.readFileSync(path.join(cssRoot, "site/entry.css"), "utf8");
const hasSite = siteEntry.includes("./components/index.css");

console.log(
  JSON.stringify(
    {
      siteImportErrors: broken,
      siteEntryHasSiteIndex: hasSite,
      siteFileCount: walk(siteRoot).length,
      ok: broken.length === 0 && hasSite,
    },
    null,
    2,
  ),
);
process.exit(broken.length === 0 && hasSite ? 0 : 1);
