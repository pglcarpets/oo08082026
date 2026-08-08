/**
 * Enhance marketing/projects/* → marketing/clients/* as high-quality bright/sharp WebP.
 * Preserves client folder names. Rewrites code paths projects → clients where live.
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const SRC_ROOT = path.resolve("site/public/assets/marketing/projects");
const DEST_ROOT = path.resolve("site/public/assets/marketing/clients");
const MAX_EDGE = 2560;
const QUALITY = 90;

function walk(dir, base = "") {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = (base ? `${base}/${ent.name}` : ent.name).replace(/\\/g, "/");
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full, rel));
    else if (/\.(webp|jpe?g|png)$/i.test(ent.name)) out.push({ rel, full });
  }
  return out;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeRetry(dest, buf) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  for (let i = 0; i < 10; i++) {
    try {
      fs.writeFileSync(dest, buf);
      return;
    } catch {
      sleep(150 * (i + 1));
    }
  }
  throw new Error("write failed " + dest);
}

// Clean slug filename: keep readable, drop "edit this" style
function destName(rel) {
  const dir = path.posix.dirname(rel);
  let base = path.posix.basename(rel).replace(/\.(jpe?g|png|webp)$/i, "");
  // normalize spaces
  base = base
    .replace(/\s+/g, "-")
    .replace(/[()]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (/^edit-this$/i.test(base)) base = "hero-wide";
  if (/^IMG-20200129-WA0036---Copy$/i.test(base)) base = "workspace-01";
  if (/^WhatsApp-Image-/i.test(base)) base = "office-01";
  if (/^20140707_124458_compressed$/i.test(base)) base = "government-hero";
  if (/^snapedit_/i.test(base)) base = base.replace(/snapedit_/, "gallery-");
  return `${dir === "." ? "" : dir + "/"}${base}.webp`;
}

const files = walk(SRC_ROOT);
const report = [];
fs.rmSync(DEST_ROOT, { recursive: true, force: true });
fs.mkdirSync(DEST_ROOT, { recursive: true });

for (const f of files) {
  const outRel = destName(f.rel);
  const outFull = path.join(DEST_ROOT, outRel);

  const meta = await sharp(f.full, { failOn: "none" }).rotate().metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  const long = Math.max(w, h);
  let p = sharp(f.full, { failOn: "none" }).rotate();
  if (long > MAX_EDGE) {
    p = p.resize({
      width: w >= h ? MAX_EDGE : undefined,
      height: h > w ? MAX_EDGE : undefined,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }
  // enhance: brighten + contrast + sharpen (same recipe as slides)
  const buf = await p
    .modulate({ brightness: 1.08, saturation: 1.05 })
    .linear(1.06, -6)
    .sharpen({ sigma: 1.2, m1: 1.0, m2: 0.7, x1: 2, y2: 10, y3: 20 })
    .webp({ quality: QUALITY, effort: 6, smartSubsample: true })
    .toBuffer();

  writeRetry(outFull, buf);
  const om = await sharp(buf).metadata();
  report.push({
    from: f.rel,
    to: outRel,
    in: `${w}x${h}`,
    out: `${om.width}x${om.height}`,
    KB: +(buf.length / 1024).toFixed(1),
  });
  console.log("OK", f.rel, "->", outRel, `${om.width}x${om.height}`, (buf.length / 1024).toFixed(1) + "KB");
}

fs.mkdirSync("results/asset-cutover", { recursive: true });
fs.writeFileSync(
  "results/asset-cutover/projects-to-clients-enhance-report.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), count: report.length, report }, null, 2)
);
console.log("done", report.length, "→", DEST_ROOT);
