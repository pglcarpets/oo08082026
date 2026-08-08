/**
 * Re-encode marketing/hero/* as high-quality WebP (overwrite-safe for locked files).
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const HERO_ROOT = path.resolve("site/public/assets/marketing/hero");
const STAGING = path.resolve("results/asset-cutover/hero-hires-staging");
const MAX_EDGE = 2560;
const QUALITY = 90;
const EFFORT = 6;

const SOURCE_UPGRADES = {
  "slides/titan-hero.jpg":
    "site/public/assets/marketing/projects/Titan/hero.jpg",
  "slides/titan-hero.webp":
    "site/public/assets/marketing/projects/Titan/hero.jpg",
  "slides/tvs-patna-enhanced.webp":
    "site/public/assets/marketing/projects/TVS/27-06-2025 Image 01.jpeg",
  "pages/hero-1.webp":
    "E:/Websites/OandO-backups/r2-oando-asset-cdn-20260805/images/projects/DMRC/dmrc-hero.webp",
};

function walk(dir, base = "") {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = (base ? `${base}/${ent.name}` : ent.name).replace(/\\/g, "/");
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full, rel));
    else if (/\.(webp|jpe?g|png)$/i.test(ent.name) && !ent.name.includes(".tmp.")) {
      out.push({ rel, full });
    }
  }
  return out;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeWithRetry(dest, buf, tries = 12) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      fs.writeFileSync(dest, buf);
      return;
    } catch (e) {
      last = e;
      sleep(250 * (i + 1));
    }
  }
  throw last;
}

function unlinkWithRetry(p, tries = 8) {
  for (let i = 0; i < tries; i++) {
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
      return true;
    } catch {
      sleep(200 * (i + 1));
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
  return { buf, inW: w, inH: h, outW: outMeta.width, outH: outMeta.height, outKB: +(buf.length / 1024).toFixed(1) };
}

// clean leftover tmp
for (const f of walk(HERO_ROOT)) {
  if (f.rel.includes(".tmp")) unlinkWithRetry(f.full);
}
// also tmp named *.tmp.webp
function walkAll(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkAll(full);
    else if (ent.name.includes(".tmp.webp")) unlinkWithRetry(full);
  }
}
walkAll(HERO_ROOT);

fs.rmSync(STAGING, { recursive: true, force: true });
fs.mkdirSync(STAGING, { recursive: true });

const files = walk(HERO_ROOT);
const report = [];

for (const f of files) {
  const upgradeRel = SOURCE_UPGRADES[f.rel];
  const src =
    upgradeRel && fs.existsSync(upgradeRel) ? path.resolve(upgradeRel) : f.full;
  const usedUpgrade = path.resolve(src) !== path.resolve(f.full);
  const destRel = f.rel.replace(/\.(jpe?g|png)$/i, ".webp");
  const destFull = path.join(HERO_ROOT, destRel);
  const stageFull = path.join(STAGING, destRel.replace(/\//g, "__"));

  try {
    const result = await encodeBuffer(src);
    fs.writeFileSync(stageFull, result.buf);
    writeWithRetry(destFull, result.buf);

    if (f.full !== destFull) {
      const del = unlinkWithRetry(f.full);
      if (!del) report.push({ rel: f.rel, warn: "original not deleted" });
    }

    report.push({
      rel: f.rel,
      dest: destRel,
      upgrade: usedUpgrade
        ? path.relative(process.cwd(), src).replace(/\\/g, "/")
        : null,
      inW: result.inW,
      inH: result.inH,
      outW: result.outW,
      outH: result.outH,
      outKB: result.outKB,
      ok: true,
    });
    console.log(
      "OK",
      f.rel,
      "->",
      destRel,
      `${result.inW}x${result.inH}`,
      "=>",
      `${result.outW}x${result.outH}`,
      `${result.outKB}KB`,
      usedUpgrade ? "(upgrade)" : ""
    );
  } catch (e) {
    report.push({ rel: f.rel, ok: false, err: String(e.message || e) });
    console.error("FAIL", f.rel, e.message || e);
  }
}

const outPath = "results/asset-cutover/hero-highres-webp-report.json";
fs.writeFileSync(
  outPath,
  JSON.stringify(
    { generatedAt: new Date().toISOString(), maxEdge: MAX_EDGE, quality: QUALITY, report },
    null,
    2
  )
);
console.log("wrote", outPath);
const left = walk(HERO_ROOT).filter((x) => !x.rel.toLowerCase().endsWith(".webp"));
console.log("non-webp remaining", left.map((x) => x.rel));
const fails = report.filter((r) => r.ok === false);
console.log("fails", fails.length);
