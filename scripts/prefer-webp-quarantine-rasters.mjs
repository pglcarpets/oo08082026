import { promises as fs } from "node:fs";
import path from "path";

const ROOT = path.resolve("site/public/assets");
const report = { quarantined: [], keptRasterNoWebp: [], errors: [] };

async function walk(d, a = []) {
  for (const e of await fs.readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === "_originals" || e.name === "_quarantine") continue;
      await walk(p, a);
    } else a.push(p);
  }
  return a;
}

async function main() {
  const files = await walk(ROOT);
  const byDir = new Map();
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (![".webp", ".jpg", ".jpeg", ".png"].includes(ext)) continue;
    const dir = path.dirname(f);
    const stem = path.basename(f, path.extname(f));
    const key = stem.toLowerCase();
    if (!byDir.has(dir)) byDir.set(dir, new Map());
    const m = byDir.get(dir);
    if (!m.has(key)) m.set(key, { stem, files: {} });
    m.get(key).files[ext] = f;
  }

  let n = 0;
  for (const [dir, stems] of byDir) {
    for (const { stem: _stem, files: ex } of stems.values()) {
      if (!ex[".webp"]) {
        if (ex[".jpg"] || ex[".jpeg"] || ex[".png"]) {
          report.keptRasterNoWebp.push(
            path.relative(ROOT, ex[".jpg"] || ex[".jpeg"] || ex[".png"]),
          );
        }
        continue;
      }
      const origDir = path.join(dir, "_originals");
      for (const ext of [".jpg", ".jpeg", ".png"]) {
        const src = ex[ext];
        if (!src) continue;
        await fs.mkdir(origDir, { recursive: true });
        const dest = path.join(origDir, path.basename(src));
        try {
          await fs.rename(src, dest);
          n++;
          report.quarantined.push({
            from: path.relative(ROOT, src).split(path.sep).join("/"),
            to: path.relative(ROOT, dest).split(path.sep).join("/"),
            keptWebp: path.relative(ROOT, ex[".webp"]).split(path.sep).join("/"),
          });
        } catch (e) {
          report.errors.push({ src, err: String(e.message || e) });
        }
      }
    }
  }
  report.countQuarantined = n;
  report.countKeptRasterOnly = report.keptRasterNoWebp.length;
  await fs.writeFile(
    "results/asset-cutover/format-prefer-webp-report.json",
    JSON.stringify(report, null, 2),
  );
  console.log({
    quarantined: n,
    keptRasterOnly: report.keptRasterNoWebp.length,
    errors: report.errors.length,
  });
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
