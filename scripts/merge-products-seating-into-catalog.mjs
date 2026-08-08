import { promises as fs } from "fs";
import path from "path";

const SRC = path.resolve("site/public/assets/catalog/products/seating");
const DST = path.resolve("site/public/assets/catalog/seating");

const ALIAS = {
  breez: "breeze",
  xmesh: "x-mesh",
  "fluid x": "fluid-x",
  fluidx: "fluid-x",
};

async function seatingSlugs() {
  const dirs = await fs.readdir(DST, { withFileTypes: true });
  const map = new Map();
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const m = d.name.match(/^oando-seating--(.+)$/i);
    if (m) map.set(m[1].toLowerCase(), d.name);
    if (d.name.toLowerCase() === "fluid-x") map.set("fluid-x", d.name);
  }
  return map;
}

function parseName(filename) {
  const base = filename.replace(/\.[^.]+$/, "");
  const m = base.match(/^(.+?)-(\d+)$/);
  if (m) return { raw: m[1].trim().toLowerCase(), n: m[2] };
  return { raw: base.trim().toLowerCase(), n: null };
}

const slugs = await seatingSlugs();
const files = (await fs.readdir(SRC)).filter((f) => f !== ".gitkeep");
const report = { moved: [], unmatched: [] };

for (const file of files) {
  const { raw, n } = parseName(file);
  let slug = ALIAS[raw] || raw.replace(/\s+/g, "-");
  let folder = slugs.get(slug);
  if (!folder) {
    for (const [s, f] of slugs) {
      if (s.replace(/-/g, "") === slug.replace(/-/g, "")) {
        folder = f;
        slug = s;
        break;
      }
    }
  }
  if (!folder) {
    report.unmatched.push(file);
    continue;
  }
  const destDir = path.join(DST, folder, "gallery");
  await fs.mkdir(destDir, { recursive: true });
  const ext = path.extname(file);
  const destName = n ? `image-${n}${ext}` : file;
  const dest = path.join(destDir, destName);
  const srcPath = path.join(SRC, file);
  try {
    const ss = await fs.stat(srcPath);
    try {
      const ds = await fs.stat(dest);
      if (ds.size >= ss.size) {
        await fs.unlink(srcPath);
        report.moved.push({
          file,
          to: path.relative(DST, dest),
          action: "skip-dest-ge-delete-src",
        });
        continue;
      }
    } catch {
      /* no dest */
    }
    await fs.rename(srcPath, dest);
    report.moved.push({
      file,
      to: path.relative(DST, dest),
      action: "moved",
    });
  } catch (e) {
    report.unmatched.push(`${file} ERR ${e.message}`);
  }
}

const left = (await fs.readdir(SRC).catch(() => [])).filter(
  (f) => f !== ".gitkeep",
);
if (left.length === 0) {
  try {
    await fs.rm(SRC, { recursive: true, force: true });
    report.removedEmptySrc = true;
  } catch {
    /* ignore */
  }
} else {
  report.leftInSrc = left;
}

await fs.mkdir("results/asset-cutover", { recursive: true });
await fs.writeFile(
  "results/asset-cutover/products-seating-merge.json",
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    {
      moved: report.moved.length,
      unmatched: report.unmatched,
      removedSrc: !!report.removedEmptySrc,
      left: report.leftInSrc || [],
    },
    null,
    2,
  ),
);
