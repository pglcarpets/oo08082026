import fs from "fs";
import path from "path";
import sharp from "sharp";

const DIR = path.resolve("site/public/assets/marketing/hero/slides");
const STAGE = path.resolve("results/asset-cutover/hero-slides-bright");
const BAK = path.resolve("results/asset-cutover/hero-slides-pre-brighten");
const QUALITY = 90;

fs.mkdirSync(STAGE, { recursive: true });
fs.mkdirSync(BAK, { recursive: true });

const files = fs.readdirSync(DIR).filter((f) => /oneandonly\.webp$/i.test(f));
const report = [];

for (const name of files) {
  const src = path.join(DIR, name);
  fs.copyFileSync(src, path.join(BAK, name));

  const buf = await sharp(src, { failOn: "none" })
    .rotate()
    .modulate({ brightness: 1.1, saturation: 1.06 })
    .linear(1.08, -8)
    .sharpen({ sigma: 1.4, m1: 1.2, m2: 0.8, x1: 2, y2: 10, y3: 20 })
    .webp({ quality: QUALITY, effort: 6, smartSubsample: true })
    .toBuffer();

  const stagePath = path.join(STAGE, name);
  fs.writeFileSync(stagePath, buf);
  const meta = await sharp(buf).metadata();
  report.push({ name, KB: +(buf.length / 1024).toFixed(1), w: meta.width, h: meta.height, staged: true });
  console.log("STAGED", name, meta.width + "x" + meta.height, (buf.length / 1024).toFixed(1) + "KB");
}

fs.writeFileSync(
  "results/asset-cutover/hero-slides-brighten-report.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2)
);
console.log("staged", report.length);
