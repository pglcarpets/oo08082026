import { promises as fs } from "fs";
import path from "path";

const REC = path.resolve("site/public/assets/others/legacy/recovery");
const ALL = path.join(REC, "all");
const sources = ["from-e", "from-d"];

async function walk(d, a = []) {
  let ents;
  try {
    ents = await fs.readdir(d, { withFileTypes: true });
  } catch {
    return a;
  }
  for (const e of ents) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === "all") continue;
      await walk(p, a);
    } else a.push(p);
  }
  return a;
}

async function copyKeepLarger(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  try {
    const ds = await fs.stat(dest);
    const ss = await fs.stat(src);
    if (ds.size >= ss.size) return "skip-dest-ge";
  } catch {
    /* dest missing */
  }
  await fs.copyFile(src, dest);
  return "copied";
}

async function main() {
  await fs.mkdir(ALL, { recursive: true });
  let copied = 0,
    skipped = 0,
    total = 0;
  for (const srcName of sources) {
    const root = path.join(REC, srcName);
    if (!(await fs.stat(root).then(() => true).catch(() => false))) {
      console.log("missing", root);
      continue;
    }
    // each child is a source mirror name
    const kids = await fs.readdir(root, { withFileTypes: true });
    for (const kid of kids) {
      if (!kid.isDirectory()) continue;
      const kidRoot = path.join(root, kid.name);
      const files = await walk(kidRoot);
      console.log(srcName, kid.name, "files", files.length);
      for (const file of files) {
        total++;
        // relative inside that source mirror
        const rel = path.relative(kidRoot, file);
        // one folder: all/<source-tag>/<rel>  OR flatten to all/<rel>?
        // Owner: "into one folder" — use all/<rel> with source prefix only when collision
        // Prefer: all/<kid.name>/<rel> still multi. True one folder: all/files/<hash>-basename BAD
        // Best one tree: all/<rel> merge all sources, keep larger
        const dest = path.join(ALL, rel);
        const r = await copyKeepLarger(file, dest);
        if (r === "copied") copied++;
        else skipped++;
        if (total % 2000 === 0) console.log("…", total, "copied", copied);
      }
    }
  }
  // count result
  const allFiles = await walk(ALL);
  let bytes = 0;
  for (const f of allFiles) bytes += (await fs.stat(f)).size;
  const summary = {
    dest: ALL,
    files: allFiles.length,
    mb: Math.round((bytes / 1024 / 1024) * 10) / 10,
    copied,
    skipped,
    totalSeen: total,
  };
  await fs.writeFile(
    "results/asset-cutover/RECOVERY-ONE-FOLDER.json",
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify(summary, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
