import { createHash } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve("site/public/assets");
const OUT = path.resolve("results/asset-cutover/duplicate-report.json");
const OUT_MD = path.resolve("results/asset-cutover/duplicate-report.md");
const IMAGE_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".avif"]);

function hashFile(file) {
  return new Promise((resolve, reject) => {
    const h = createHash("sha1");
    createReadStream(file)
      .on("data", (c) => h.update(c))
      .on("end", () => resolve(h.digest("hex")))
      .on("error", reject);
  });
}

async function walk(dir, acc = []) {
  let ents;
  try {
    ents = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

/** Read width/height from webp/jpeg/png headers (minimal, no sharp required) */
async function readDimensions(file) {
  const buf = Buffer.alloc(64);
  const fh = await fs.open(file, "r");
  try {
    await fh.read(buf, 0, 64, 0);
  } finally {
    await fh.close();
  }
  const ext = path.extname(file).toLowerCase();
  try {
    if (ext === ".png" && buf.toString("ascii", 1, 4) === "PNG") {
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    }
    if ((ext === ".jpg" || ext === ".jpeg") && buf[0] === 0xff && buf[1] === 0xd8) {
      // scan SOF - need more bytes for large files
      const full = await fs.readFile(file);
      let i = 2;
      while (i < full.length - 8) {
        if (full[i] !== 0xff) break;
        const marker = full[i + 1];
        if (marker === 0xc0 || marker === 0xc2) {
          return { w: full.readUInt16BE(i + 7), h: full.readUInt16BE(i + 5) };
        }
        const len = full.readUInt16BE(i + 2);
        i += 2 + len;
      }
    }
    if (ext === ".webp" && buf.toString("ascii", 0, 4) === "RIFF") {
      // VP8X
      if (buf.toString("ascii", 12, 16) === "VP8X") {
        const w = 1 + buf[24] + (buf[25] << 8) + (buf[26] << 16);
        const h = 1 + buf[27] + (buf[28] << 8) + (buf[29] << 16);
        return { w, h };
      }
      // VP8 
      if (buf.toString("ascii", 12, 16) === "VP8 ") {
        const full = await fs.readFile(file);
        // lossy VP8 start code
        const off = 20;
        if (full[off + 3] === 0x9d && full[off + 4] === 0x01 && full[off + 5] === 0x2a) {
          const w = full.readUInt16LE(off + 6) & 0x3fff;
          const h = full.readUInt16LE(off + 8) & 0x3fff;
          return { w, h };
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

function stemKey(rel) {
  // normalize: strip extension, lowercase, unify separators
  const base = path.basename(rel).toLowerCase();
  const stem = base.replace(/\.(webp|jpe?g|png|gif|avif)$/i, "");
  // strip common res suffixes: _1 _2 -2x @2x _small _thumb image-1 vs image-01
  const norm = stem
    .replace(/@2x$/i, "")
    .replace(/[-_](small|thumb|tiny|large|lg|sm|md)$/i, "")
    .replace(/image-0*(\d+)/i, "image-$1");
  const dir = path.dirname(rel).toLowerCase().replace(/\\/g, "/");
  return `${dir}::${norm}`;
}

async function main() {
  const files = (await walk(ROOT)).filter((f) =>
    IMAGE_EXT.has(path.extname(f).toLowerCase()),
  );
  console.log("scanning", files.length, "images");

  const byHash = new Map();
  const byStem = new Map();
  const rows = [];

  let i = 0;
  for (const file of files) {
    i++;
    if (i % 500 === 0) console.log("…", i, "/", files.length);
    const st = await fs.stat(file);
    const rel = path.relative(ROOT, file).split(path.sep).join("/");
    let sha1 = null;
    try {
      sha1 = await hashFile(file);
    } catch {
      continue;
    }
    const dim = await readDimensions(file);
    const row = {
      rel,
      bytes: st.size,
      sha1,
      w: dim?.w ?? null,
      h: dim?.h ?? null,
      pixels: dim ? dim.w * dim.h : null,
      ext: path.extname(file).toLowerCase(),
    };
    rows.push(row);

    if (!byHash.has(sha1)) byHash.set(sha1, []);
    byHash.get(sha1).push(row);

    const sk = stemKey(rel);
    if (!byStem.has(sk)) byStem.set(sk, []);
    byStem.get(sk).push(row);
  }

  const exactDupGroups = [];
  for (const [sha1, list] of byHash) {
    if (list.length < 2) continue;
    // sort by path for stability
    list.sort((a, b) => a.rel.localeCompare(b.rel));
    const waste = list.slice(1).reduce((s, r) => s + r.bytes, 0);
    exactDupGroups.push({
      sha1,
      count: list.length,
      bytesEach: list[0].bytes,
      wasteBytes: waste,
      paths: list.map((r) => r.rel),
      w: list[0].w,
      h: list[0].h,
    });
  }
  exactDupGroups.sort((a, b) => b.wasteBytes - a.wasteBytes);

  // same stem, different hash — possible multi-res or jpg+webp pair
  const multiResGroups = [];
  for (const [stem, list] of byStem) {
    if (list.length < 2) continue;
    const hashes = new Set(list.map((r) => r.sha1));
    if (hashes.size < 2) continue; // exact dups already covered
    list.sort((a, b) => (b.pixels ?? 0) - (a.pixels ?? 0) || b.bytes - a.bytes);
    const best = list[0];
    const lowers = list.slice(1).filter((r) => {
      if (best.pixels && r.pixels) return r.pixels < best.pixels;
      return r.bytes < best.bytes;
    });
    if (lowers.length === 0 && list.length >= 2) {
      // same stem different format same-ish size — format pair
      multiResGroups.push({
        kind: "same-stem-multi-format",
        stem,
        paths: list.map((r) => ({
          rel: r.rel,
          bytes: r.bytes,
          w: r.w,
          h: r.h,
          ext: r.ext,
        })),
      });
    } else if (lowers.length > 0) {
      multiResGroups.push({
        kind: "same-stem-lower-res",
        stem,
        best: { rel: best.rel, bytes: best.bytes, w: best.w, h: best.h },
        lower: lowers.map((r) => ({
          rel: r.rel,
          bytes: r.bytes,
          w: r.w,
          h: r.h,
          ext: r.ext,
        })),
      });
    }
  }

  // cross-folder exact dups (interesting)
  const crossFolderExact = exactDupGroups.filter((g) => {
    const folders = new Set(g.paths.map((p) => path.dirname(p)));
    return folders.size > 1;
  });

  const wasteTotal = exactDupGroups.reduce((s, g) => s + g.wasteBytes, 0);

  const report = {
    scanned: files.length,
    exactDuplicateGroups: exactDupGroups.length,
    exactDuplicateWasteMB: Math.round((wasteTotal / (1024 * 1024)) * 10) / 10,
    crossFolderExactGroups: crossFolderExact.length,
    multiResOrFormatGroups: multiResGroups.length,
    topExactWaste: exactDupGroups.slice(0, 40),
    topCrossFolder: crossFolderExact.slice(0, 40),
    topLowerRes: multiResGroups
      .filter((g) => g.kind === "same-stem-lower-res")
      .slice(0, 40),
    topFormatPairs: multiResGroups
      .filter((g) => g.kind === "same-stem-multi-format")
      .slice(0, 30),
  };

  await fs.writeFile(OUT, JSON.stringify(report, null, 2));

  const md = [
    "# Duplicate / resolution report (read-only)",
    "",
    `Scanned **${report.scanned}** images under \`site/public/assets\`.`,
    "",
    "## Summary",
    "",
    `| Metric | Value |`,
    `|--------|------:|`,
    `| Exact duplicate groups (same SHA-1) | ${report.exactDuplicateGroups} |`,
    `| Waste if extras removed (MB) | ${report.exactDuplicateWasteMB} |`,
    `| Exact dups across different folders | ${report.crossFolderExactGroups} |`,
    `| Same-stem multi-res / multi-format groups | ${report.multiResOrFormatGroups} |`,
    "",
    "**No files deleted.** Review before any prune.",
    "",
    "## Top exact-duplicate waste",
    "",
    ...report.topExactWaste.slice(0, 15).flatMap((g) => [
      `### ${g.count}× \`${g.sha1.slice(0, 10)}…\` (${(g.bytesEach / 1024).toFixed(1)} KB each, waste ${(g.wasteBytes / 1024).toFixed(1)} KB)`,
      ...g.paths.map((p) => `- \`${p}\``),
      "",
    ]),
    "## Cross-folder exact duplicates (likely true dups)",
    "",
    ...report.topCrossFolder.slice(0, 15).flatMap((g) => [
      `- **${g.count} copies** waste ${(g.wasteBytes / 1024).toFixed(0)} KB`,
      ...g.paths.map((p) => `  - \`${p}\``),
      "",
    ]),
    "## Same stem, lower resolution (candidate keep largest)",
    "",
    ...report.topLowerRes.slice(0, 15).flatMap((g) => [
      `### \`${g.stem}\``,
      `- **best:** \`${g.best.rel}\` ${g.best.w}×${g.best.h} (${(g.best.bytes / 1024).toFixed(1)} KB)`,
      ...g.lower.map(
        (r) =>
          `- lower: \`${r.rel}\` ${r.w ?? "?"}×${r.h ?? "?"} (${(r.bytes / 1024).toFixed(1)} KB)`,
      ),
      "",
    ]),
    "## Same stem, multi-format (e.g. jpg+webp — often intentional)",
    "",
    `Count in report JSON: ${report.topFormatPairs.length} samples (see duplicate-report.json).`,
    "",
  ].join("\n");

  await fs.writeFile(OUT_MD, md);
  console.log(
    JSON.stringify(
      {
        scanned: report.scanned,
        exactGroups: report.exactDuplicateGroups,
        wasteMB: report.exactDuplicateWasteMB,
        crossFolder: report.crossFolderExactGroups,
        multiRes: report.multiResOrFormatGroups,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
