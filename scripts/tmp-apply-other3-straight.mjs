import fs from "fs";
import path from "path";
import sharp from "sharp";

const src = "C:/Users/ayush/.cursor/projects/e-oo08082026/assets/Other3-oneandonly-straight.png";
const destDir = "e:/oo08082026/site/public/assets/marketing/hero/pages";
const quality = 90;

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
function writeRetry(dest, buf) {
  for (let i = 0; i < 15; i++) {
    try {
      fs.writeFileSync(dest, buf);
      return;
    } catch {
      sleep(250 * (i + 1));
    }
  }
  throw new Error("write failed " + dest);
}

const baseBuf = await sharp(src, { failOn: "none" })
  .rotate()
  .webp({ quality, effort: 6, smartSubsample: true })
  .toBuffer();
const brightBuf = await sharp(baseBuf)
  .modulate({ brightness: 1.03, saturation: 1.01 })
  .linear(1.02, -2)
  .webp({ quality, effort: 6, smartSubsample: true })
  .toBuffer();

writeRetry(path.join(destDir, "Other3-oneandonly.webp"), baseBuf);
writeRetry(path.join(destDir, "Other3-oneandonly-bright.webp"), brightBuf);
const m = await sharp(baseBuf).metadata();
console.log("OK Other3", `${m.width}x${m.height}`, `${(baseBuf.length / 1024).toFixed(1)}KB`);
