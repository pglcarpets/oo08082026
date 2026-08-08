import fs from "fs";
import path from "path";
import sharp from "sharp";

const slides = "site/public/assets/marketing/hero/slides";
const session =
  "C:/Users/ayush/.grok/sessions/D%3A%5C03082026/019fcff3-27ed-7960-8ced-9234e804d1b3/images";
const MAX = 2560;

const pairs = [
  ["1.jpg", "Titan-Oneandonly.webp"],
  ["2.jpg", "Titan2-Oneandonly.webp"],
  ["3.jpg", "Usha-Oneandonly.webp"],
  ["4.jpg", "TVS3-Oneandonly.webp"],
  ["5.jpg", "TVS-Oneandonly.webp"],
  ["6.jpg", "Dmrc-Oneandonly.webp"],
  ["7.jpg", "TVS2-Oneandonly.webp"],
];

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

const report = [];
for (const [srcName, dest] of pairs) {
  const src = path.join(session, srcName);
  if (!fs.existsSync(src)) {
    report.push({ dest, ok: false, err: "missing " + src });
    console.log("MISSING", srcName);
    continue;
  }
  const meta = await sharp(src).metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  const long = Math.max(w, h);
  let p = sharp(src, { failOn: "none" }).rotate();
  if (long > MAX) {
    p = p.resize({
      width: w >= h ? MAX : undefined,
      height: h > w ? MAX : undefined,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }
  const buf = await p.webp({ quality: 90, effort: 6 }).toBuffer();
  const out = path.join(slides, dest);
  let wrote = false;
  for (let i = 0; i < 15; i++) {
    try {
      fs.writeFileSync(out, buf);
      wrote = true;
      break;
    } catch {
      sleep(250 * (i + 1));
    }
  }
  const om = await sharp(buf).metadata();
  report.push({
    dest,
    ok: wrote,
    in: `${w}x${h}`,
    out: `${om.width}x${om.height}`,
    KB: +(buf.length / 1024).toFixed(1),
  });
  console.log(
    wrote ? "OK" : "FAIL",
    dest,
    `${w}x${h}=>${om.width}x${om.height}`,
    (buf.length / 1024).toFixed(1) + "KB"
  );
}

fs.mkdirSync("results/asset-cutover", { recursive: true });
fs.writeFileSync(
  "results/asset-cutover/hero-slides-ai-enhance-report.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2)
);
console.log("report written");
