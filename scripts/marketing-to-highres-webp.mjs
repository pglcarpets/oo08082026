/**
 * High-res WebP conversion for marketing folders (projects, Showroom).
 * - Max long edge 2560, quality 90
 * - Prefer larger sibling (jpeg/png) as source when dual formats exist
 * - Drop non-webp originals after successful write
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const MAX_EDGE = 2560;
const QUALITY = 90;
const EFFORT = 6;
const ROOTS = [
  "site/public/assets/marketing/projects",
  "site/public/assets/marketing/Showroom",
];

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function walk(dir, base = "") {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = (base ? `${base}/${ent.name}` : ent.name).replace(/\\/g, "/");
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full, rel));
    else if (/\.(webp|jpe?g|png)$/i.test(ent.name)) {
      out.push({
        rel,
        full,
        stem: ent.name.replace(/\.(webp|jpe?g|png)$/i, ""),
        ext: path.extname(ent.name).toLowerCase(),
        bytes: fs.statSync(full).size,
        dir: path.dirname(full),
      });
    }
  }
  return out;
}

function writeWithRetry(dest, buf, tries = 15) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      fs.writeFileSync(dest, buf);
      return;
    } catch (e) {
      last = e;
      sleep(200 * (i + 1));
    }
  }
  throw last;
}

function unlinkWithRetry(p, tries = 10) {
  for (let i = 0; i < tries; i++) {
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
      return true;
    } catch {
      sleep(150 * (i + 1));
    }
  }
  return false;
}

async function encodeBuffer(srcPath) {
  const meta = await sharp(srcPath, { failOn: "none" }).rotate().metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  const long = Math.max(w, h);
  let pipeline = sharp(srcPath, { failOn: "none" }).rotate();
  if (long > MAX_EDGE) {
    pipeline = pipeline.resize({
      width: w >= h ? MAX_EDGE : undefined,
      height: h > w ? MAX_EDGE : undefined,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }
  const buf = await pipeline
    .webp({ quality: QUALITY, effort: EFFORT, smartSubsample: true })
    .toBuffer();
  const outMeta = await sharp(buf).metadata();
  return {
    buf,
    inW: w,
    inH: h,
    outW: outMeta.width,
    outH: outMeta.height,
    outKB: +(buf.length / 1024).toFixed(1),
  };
}

const report = { generatedAt: new Date().toISOString(), maxEdge: MAX_EDGE, quality: QUALITY, folders: {} };

for (const root of ROOTS) {
  const abs = path.resolve(root);
  const files = walk(abs);
  // group by directory + stem
  const groups = new Map();
  for (const f of files) {
    const key = path.join(f.dir, f.stem);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }

  const folderReport = [];
  for (const [, group] of groups) {
    // pick best source: largest pixel area, then largest bytes
    let best = null;
    let bestScore = -1;
    for (const f of group) {
      let score = f.bytes;
      try {
        const m = await sharp(f.full).metadata();
        score = (m.width || 0) * (m.height || 0) * 1000 + f.bytes;
      } catch {}
      if (score > bestScore) {
        bestScore = score;
        best = f;
      }
    }
    const destFull = path.join(best.dir, best.stem + ".webp");
    const destRel = path.relative(abs, destFull).replace(/\\/g, "/");

    try {
      const result = await encodeBuffer(best.full);
      writeWithRetry(destFull, result.buf);
      // delete non-webp siblings (and old webp if we rewrote from non-webp already same path)
      for (const f of group) {
        if (path.resolve(f.full) === path.resolve(destFull)) continue;
        const ok = unlinkWithRetry(f.full);
        if (!ok) folderReport.push({ rel: f.rel, warn: "could not delete" });
      }
      folderReport.push({
        dest: destRel,
        source: path.relative(abs, best.full).replace(/\\/g, "/"),
        inW: result.inW,
        inH: result.inH,
        outW: result.outW,
        outH: result.outH,
        outKB: result.outKB,
        ok: true,
      });
      console.log(
        "OK",
        root,
        destRel,
        `${result.inW}x${result.inH}=>${result.outW}x${result.outH}`,
        `${result.outKB}KB`
      );
    } catch (e) {
      folderReport.push({ dest: destRel, ok: false, err: String(e.message || e) });
      console.error("FAIL", root, destRel, e.message || e);
    }
  }
  report.folders[root] = folderReport;
  const left = walk(abs).filter((f) => f.ext !== ".webp");
  console.log(root, "non-webp left", left.map((f) => f.rel));
}

const outPath = "results/asset-cutover/projects-showroom-highres-webp-report.json";
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log("wrote", outPath);
const fails = Object.values(report.folders).flat().filter((r) => !r.ok);
console.log("fails", fails.length);
process.exit(fails.length ? 1 : 0);
