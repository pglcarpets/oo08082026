import fs from "fs";
import path from "path";
import sharp from "sharp";

const DIR = path.resolve("site/public/assets/marketing/hero/pages");
const BRIGHTNESS = 1.05;
const SAT = 1.02;
const LINEAR_A = 1.03;
const LINEAR_B = -3;
const SHARPEN = { sigma: 0.9, m1: 0.8, m2: 0.5, x1: 2, y2: 10, y3: 20 };

const bases = fs
  .readdirSync(DIR)
  .filter((f) => /oneandonly\.webp$/i.test(f) && !/-bright\.webp$/i.test(f));

const report = [];
for (const name of bases) {
  const src = path.join(DIR, name);
  const dest = path.join(DIR, name.replace(/\.webp$/i, "-bright.webp"));
  const buf = await sharp(src, { failOn: "none" })
    .rotate()
    .modulate({ brightness: BRIGHTNESS, saturation: SAT })
    .linear(LINEAR_A, LINEAR_B)
    .sharpen(SHARPEN)
    .webp({ quality: 90, effort: 6, smartSubsample: true })
    .toBuffer();
  fs.writeFileSync(dest, buf);
  const m = await sharp(buf).metadata();
  report.push({ name: path.basename(dest), w: m.width, h: m.height, KB: +(buf.length / 1024).toFixed(1) });
  console.log("OK", path.basename(dest), `${m.width}x${m.height}`, (buf.length / 1024).toFixed(1) + "KB");
}
fs.mkdirSync("results/asset-cutover", { recursive: true });
fs.writeFileSync(
  "results/asset-cutover/hero-pages-slightly-brighter.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2)
);
console.log("done", report.length);
