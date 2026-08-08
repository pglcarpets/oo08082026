import fs from "fs";
import path from "path";
import sharp from "sharp";

const pages = "site/public/assets/marketing/hero/pages";
const session =
  "C:/Users/ayush/.grok/sessions/D%3A%5C03082026/019fcff3-27ed-7960-8ced-9234e804d1b3/images";
const MAX = 2560;

// Mapped by completion order + aspect ratio
const pairs = [
  ["8.jpg", "contact-oneandonly.webp"], // portrait 0.72
  ["9.jpg", "about-oneandonly.webp"], // 1.5 landscape
  ["10.jpg", "other-oneandonly.webp"], // 1.5
  ["11.jpg", "Other2-oneandonly.webp"], // 1.5
  ["12.jpg", "Other3-oneandonly.webp"], // 1.389
  ["13.jpg", "Planner-oneandonly.webp"], // 1.333
  ["14.jpg", "solutions-oneandonly.webp"], // should be ~1.0 square
];

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

const report = [];
for (const [srcName, dest] of pairs) {
  const src = path.join(session, srcName);
  if (!fs.existsSync(src)) {
    report.push({ dest, ok: false, err: "missing " + srcName });
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
  const out = path.join(pages, dest);
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
    from: srcName,
    ok: wrote,
    in: `${w}x${h}`,
    out: `${om.width}x${om.height}`,
    KB: +(buf.length / 1024).toFixed(1),
  });
  console.log(
    wrote ? "OK" : "FAIL",
    dest,
    `from ${srcName}`,
    `${w}x${h}=>${om.width}x${om.height}`,
    (buf.length / 1024).toFixed(1) + "KB"
  );
}

// verify 14 is roughly square for solutions
const sol = report.find((r) => r.dest === "solutions-oneandonly.webp");
if (sol && sol.in) {
  const [sw, sh] = sol.in.split("x").map(Number);
  const ratio = sw / sh;
  if (ratio < 0.85 || ratio > 1.15) {
    console.warn("WARN solutions aspect unexpected", sol.in, "ratio", ratio.toFixed(3));
  }
}

fs.mkdirSync("results/asset-cutover", { recursive: true });
fs.writeFileSync(
  "results/asset-cutover/hero-pages-ai-enhance-report.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2)
);
console.log("report written");
