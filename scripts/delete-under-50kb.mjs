import { promises as fs } from "fs";
import path from "path";

const ROOT = path.resolve("site/public/assets");
const LIMIT = 50 * 1024;
const EXTS = new Set([".webp", ".jpg", ".jpeg", ".png"]);
const ALLOW_ROOTS = [
  path.join(ROOT, "catalog"),
  path.join(ROOT, "marketing"),
];
// never touch these subtrees even under marketing
const SKIP_PARTS = [
  `${path.sep}others${path.sep}`,
  `${path.sep}fonts${path.sep}`,
  `${path.sep}icons${path.sep}`,
  `${path.sep}fallback${path.sep}placeholders${path.sep}`,
];

async function walk(d, a = []) {
  let ents;
  try {
    ents = await fs.readdir(d, { withFileTypes: true });
  } catch {
    return a;
  }
  for (const e of ents) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) await walk(p, a);
    else a.push(p);
  }
  return a;
}

function allowed(p) {
  const norm = p;
  if (!ALLOW_ROOTS.some((r) => norm.startsWith(r + path.sep) || norm.startsWith(r + "/")))
    return false;
  for (const s of SKIP_PARTS) {
    if (norm.includes(s)) return false;
  }
  return true;
}

async function main() {
  const files = [];
  for (const r of ALLOW_ROOTS) {
    files.push(...(await walk(r)));
  }
  const victims = [];
  let bytes = 0;
  for (const f of files) {
    if (!allowed(f)) continue;
    const ext = path.extname(f).toLowerCase();
    if (!EXTS.has(ext)) continue;
    if (path.basename(f) === ".gitkeep") continue;
    const st = await fs.stat(f);
    if (st.size < LIMIT) {
      victims.push({ rel: path.relative(ROOT, f).split(path.sep).join("/"), size: st.size });
      bytes += st.size;
    }
  }
  victims.sort((a, b) => a.size - b.size);
  for (const v of victims) {
    await fs.unlink(path.join(ROOT, v.rel));
  }
  const report = {
    limitBytes: LIMIT,
    deleted: victims.length,
    freedMB: Math.round((bytes / 1024 / 1024) * 100) / 100,
    sample: victims.slice(0, 40),
    scope: "catalog + marketing only; skip placeholders/icons/fonts/others",
  };
  await fs.mkdir("results/asset-cutover", { recursive: true });
  await fs.writeFile(
    "results/asset-cutover/DELETE-UNDER-50KB.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify({ deleted: report.deleted, freedMB: report.freedMB }, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
